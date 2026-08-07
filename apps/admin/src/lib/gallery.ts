import { getAdminSupabaseClient } from './supabase';

const GALLERY_BUCKET = 'gallery';
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PREVIEW_TTL_SECONDS = 60 * 60;

export const GALLERY_ACCEPT = [
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
].join(',');

const supportedTypes = new Set(GALLERY_ACCEPT.split(','));

export type GalleryMedia = {
  id: string;
  objectPath: string;
  name: string;
  description: string;
  tags: string[];
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  previewUrl: string;
};

export type GalleryMediaChanges = {
  name?: string;
  description?: string;
  tags?: string[];
};

type GalleryRow = {
  id: string;
  object_path: string;
  name: string;
  description: string;
  tags: string[];
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
};

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function titleFromFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^/.]+$/, '');
  return withoutExtension.trim() || filename.trim() || 'Untitled media';
}

function safeFilename(filename: string): string {
  const normalized = filename
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase();
  return normalized || 'media';
}

export function normalizeGalleryTags(tags: string[]): string[] {
  return [
    ...new Set(tags.map(tag => tag.trim().toLowerCase()).filter(Boolean)),
  ];
}

function validateFiles(files: File[]): void {
  if (files.length === 0) throw new Error('Choose at least one media file.');

  const unsupported = files.find(file => !supportedTypes.has(file.type));
  if (unsupported) {
    throw new Error(
      `${unsupported.name} is not a supported image or video format.`,
    );
  }

  const empty = files.find(file => file.size === 0);
  if (empty) throw new Error(`${empty.name} is empty and cannot be uploaded.`);

  const oversized = files.find(file => file.size > MAX_FILE_SIZE);
  if (oversized) {
    throw new Error(`${oversized.name} is larger than the 50 MB limit.`);
  }
}

async function withPreviewUrls(rows: GalleryRow[]): Promise<GalleryMedia[]> {
  if (rows.length === 0) return [];

  const client = getAdminSupabaseClient();
  const { data, error } = await client.storage
    .from(GALLERY_BUCKET)
    .createSignedUrls(
      rows.map(row => row.object_path),
      PREVIEW_TTL_SECONDS,
    );
  throwIfError(error);

  const previewByPath = new Map(
    (data ?? []).map(preview => [preview.path, preview.signedUrl]),
  );

  return rows.map(row => ({
    id: row.id,
    objectPath: row.object_path,
    name: row.name,
    description: row.description,
    tags: row.tags,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    previewUrl: previewByPath.get(row.object_path) ?? '',
  }));
}

export async function loadGalleryMedia(): Promise<GalleryMedia[]> {
  const { data, error } = await getAdminSupabaseClient()
    .from('gallery_media')
    .select(
      'id,object_path,name,description,tags,mime_type,size_bytes,created_at,updated_at',
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  throwIfError(error);
  return withPreviewUrls((data ?? []) as GalleryRow[]);
}

export async function uploadGalleryMedia(
  files: File[],
): Promise<GalleryMedia[]> {
  validateFiles(files);

  const client = getAdminSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  throwIfError(userError);
  if (!userData.user) throw new Error('Your admin session has expired.');

  const uploads = await Promise.allSettled(
    files.map(async file => {
      const objectPath = `${userData.user.id}/${crypto.randomUUID()}-${safeFilename(
        file.name,
      )}`;
      const { error } = await client.storage
        .from(GALLERY_BUCKET)
        .upload(objectPath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });
      throwIfError(error);
      return { file, objectPath };
    }),
  );

  const completed = uploads.flatMap(result =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  const failed = uploads.find(result => result.status === 'rejected');

  if (failed?.status === 'rejected') {
    if (completed.length > 0) {
      await client.storage
        .from(GALLERY_BUCKET)
        .remove(completed.map(item => item.objectPath));
    }
    throw failed.reason instanceof Error
      ? failed.reason
      : new Error('One or more files could not be uploaded.');
  }

  const { data, error } = await client
    .from('gallery_media')
    .insert(
      completed.map(({ file, objectPath }) => ({
        object_path: objectPath,
        name: titleFromFilename(file.name),
        description: '',
        tags: [],
        mime_type: file.type,
        size_bytes: file.size,
        created_by: userData.user.id,
      })),
    )
    .select(
      'id,object_path,name,description,tags,mime_type,size_bytes,created_at,updated_at',
    );

  if (error) {
    await client.storage
      .from(GALLERY_BUCKET)
      .remove(completed.map(item => item.objectPath));
    throw new Error(error.message);
  }

  return withPreviewUrls((data ?? []) as GalleryRow[]);
}

export async function updateGalleryMedia(
  ids: string[],
  changes: GalleryMediaChanges,
): Promise<void> {
  if (ids.length === 0) throw new Error('Select at least one gallery item.');

  const values: Record<string, string | string[]> = {};
  if (changes.name !== undefined) {
    const name = changes.name.trim();
    if (!name) throw new Error('Media name cannot be empty.');
    values.name = name;
  }
  if (changes.description !== undefined) {
    values.description = changes.description.trim();
  }
  if (changes.tags !== undefined) {
    values.tags = normalizeGalleryTags(changes.tags);
  }
  if (Object.keys(values).length === 0) {
    throw new Error('Choose at least one field to update.');
  }

  const { error } = await getAdminSupabaseClient()
    .from('gallery_media')
    .update(values)
    .in('id', ids);
  throwIfError(error);
}
