import { getAdminSupabaseClient } from './supabase';
import {
  attachmentRejectionMessage,
  planGalleryMediaAttachments,
  type GalleryAttachmentRejectionCode,
} from './galleryAttachment';

const GALLERY_BUCKET = 'gallery';
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PREVIEW_TTL_SECONDS = 60 * 60;
const GALLERY_COLUMNS = [
  'id',
  'asset_id',
  'object_path',
  'name',
  'description',
  'tags',
  'mime_type',
  'size_bytes',
  'source_provider',
  'creator_name',
  'creator_handle',
  'license_name',
  'license_checked_on',
  'downloaded_on',
  'original_width',
  'original_height',
  'asset_status',
  'created_at',
  'updated_at',
].join(',');

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
  assetId: string;
  objectPath: string | null;
  name: string;
  description: string;
  tags: string[];
  mimeType: string | null;
  sizeBytes: number | null;
  sourceProvider: string;
  creatorName: string;
  creatorHandle: string | null;
  licenseName: string;
  licenseCheckedOn: string | null;
  downloadedOn: string | null;
  originalWidth: number | null;
  originalHeight: number | null;
  assetStatus: GalleryAssetStatus;
  createdAt: string;
  updatedAt: string;
  previewUrl: string;
};

export type GalleryAssetStatus =
  | 'pending_upload'
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'rejected';

export type GalleryMediaChanges = {
  assetId?: string;
  name?: string;
  description?: string;
  tags?: string[];
  sourceProvider?: string;
  creatorName?: string;
  creatorHandle?: string | null;
  licenseName?: string;
  licenseCheckedOn?: string | null;
  downloadedOn?: string | null;
  originalWidth?: number | null;
  originalHeight?: number | null;
  assetStatus?: GalleryAssetStatus;
};

export type GalleryMediaReference = {
  entityType: string;
  entityId: string;
  imageUri: string;
};

export type DeleteGalleryMediaResult =
  | { deleted: true }
  | { deleted: false; references: GalleryMediaReference[] };

export type GalleryAttachmentRejectedFile = {
  code: GalleryAttachmentRejectionCode;
  fileName: string;
  reason: string;
};

export type AttachGalleryMediaResult = {
  attachedMediaIds: string[];
  rejected: GalleryAttachmentRejectedFile[];
};

export class GalleryAttachmentUploadError extends Error {
  rejected: GalleryAttachmentRejectedFile[];

  constructor(message: string, rejected: GalleryAttachmentRejectedFile[]) {
    super(message);
    this.name = 'GalleryAttachmentUploadError';
    this.rejected = rejected;
  }
}

type GalleryRow = {
  id: string;
  asset_id: string;
  object_path: string | null;
  name: string;
  description: string;
  tags: string[];
  mime_type: string | null;
  size_bytes: number | null;
  source_provider: string;
  creator_name: string;
  creator_handle: string | null;
  license_name: string;
  license_checked_on: string | null;
  downloaded_on: string | null;
  original_width: number | null;
  original_height: number | null;
  asset_status: GalleryAssetStatus;
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

  const objectPaths = rows.flatMap(row =>
    row.object_path ? [row.object_path] : [],
  );
  const previewByPath = new Map<string, string>();
  if (objectPaths.length > 0) {
    const client = getAdminSupabaseClient();
    const { data, error } = await client.storage
      .from(GALLERY_BUCKET)
      .createSignedUrls(objectPaths, PREVIEW_TTL_SECONDS);
    throwIfError(error);
    (data ?? []).forEach(preview => {
      if (preview.path && preview.signedUrl) {
        previewByPath.set(preview.path, preview.signedUrl);
      }
    });
  }

  return rows.map(row => ({
    id: row.id,
    assetId: row.asset_id,
    objectPath: row.object_path,
    name: row.name,
    description: row.description,
    tags: row.tags,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
    sourceProvider: row.source_provider,
    creatorName: row.creator_name,
    creatorHandle: row.creator_handle,
    licenseName: row.license_name,
    licenseCheckedOn: row.license_checked_on,
    downloadedOn: row.downloaded_on,
    originalWidth: row.original_width,
    originalHeight: row.original_height,
    assetStatus: row.asset_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    previewUrl: row.object_path ? previewByPath.get(row.object_path) ?? '' : '',
  }));
}

export async function loadGalleryMedia(): Promise<GalleryMedia[]> {
  const { data, error } = await getAdminSupabaseClient()
    .from('gallery_media')
    .select(GALLERY_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  throwIfError(error);
  return withPreviewUrls((data ?? []) as unknown as GalleryRow[]);
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
      const objectPath = `${
        userData.user.id
      }/${crypto.randomUUID()}-${safeFilename(file.name)}`;
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
        asset_id: crypto.randomUUID(),
        object_path: objectPath,
        name: titleFromFilename(file.name),
        description: '',
        tags: [],
        mime_type: file.type,
        size_bytes: file.size,
        source_provider: 'unknown',
        creator_name: 'Unknown',
        license_name: 'Unverified',
        asset_status: 'pending_review',
        created_by: userData.user.id,
      })),
    )
    .select(GALLERY_COLUMNS);

  if (error) {
    await client.storage
      .from(GALLERY_BUCKET)
      .remove(completed.map(item => item.objectPath));
    throw new Error(error.message);
  }

  return withPreviewUrls((data ?? []) as unknown as GalleryRow[]);
}

async function removeGalleryObjects(
  objectPaths: string[],
): Promise<string | null> {
  if (objectPaths.length === 0) return null;
  const { error } = await getAdminSupabaseClient()
    .storage.from(GALLERY_BUCKET)
    .remove(objectPaths);
  return error?.message ?? null;
}

export async function attachGalleryMediaFiles(
  files: File[],
  media: GalleryMedia[],
): Promise<AttachGalleryMediaResult> {
  const plan = planGalleryMediaAttachments(files, media);
  const rejected = plan.rejected.map(({ code, file }) => ({
    code,
    fileName: file.name,
    reason: attachmentRejectionMessage(code),
  }));
  if (plan.matches.length === 0) {
    return { attachedMediaIds: [], rejected };
  }

  const client = getAdminSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) {
    throw new GalleryAttachmentUploadError(userError.message, rejected);
  }
  if (!userData.user) {
    throw new GalleryAttachmentUploadError(
      'Your admin session has expired.',
      rejected,
    );
  }

  const uploads = await Promise.allSettled(
    plan.matches.map(async match => {
      const objectPath = `${userData.user.id}/registered/${safeFilename(
        match.asset.assetId,
      )}/${crypto.randomUUID()}-${safeFilename(match.file.name)}`;
      const { error } = await client.storage
        .from(GALLERY_BUCKET)
        .upload(objectPath, match.file, {
          cacheControl: '3600',
          contentType: match.file.type,
          upsert: false,
        });
      throwIfError(error);
      return { ...match, objectPath };
    }),
  );

  const completed = uploads.flatMap(result =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  const failed = uploads.find(result => result.status === 'rejected');
  if (failed?.status === 'rejected') {
    const cleanupError = await removeGalleryObjects(
      completed.map(upload => upload.objectPath),
    );
    const uploadMessage =
      failed.reason instanceof Error
        ? failed.reason.message
        : 'One or more images could not be uploaded.';
    throw new GalleryAttachmentUploadError(
      cleanupError
        ? `${uploadMessage} Uploaded objects could not be fully cleaned up: ${cleanupError}`
        : `${uploadMessage} No gallery assets were attached.`,
      rejected,
    );
  }

  const { data, error } = await client.rpc('attach_gallery_media_uploads', {
    p_uploads: completed.map(upload => ({
      asset_id: upload.asset.assetId,
      object_path: upload.objectPath,
      mime_type: upload.file.type,
      size_bytes: upload.file.size,
    })),
  });
  if (error) {
    const cleanupError = await removeGalleryObjects(
      completed.map(upload => upload.objectPath),
    );
    throw new GalleryAttachmentUploadError(
      cleanupError
        ? `${error.message} Uploaded objects could not be fully cleaned up: ${cleanupError}`
        : `${error.message} Uploaded objects were removed and no gallery assets were attached.`,
      rejected,
    );
  }

  const attachedMediaIds = (
    (data ?? []) as Array<{ media_id: string; attached_asset_id: string }>
  ).map(row => row.media_id);
  return { attachedMediaIds, rejected };
}

export async function updateGalleryMedia(
  ids: string[],
  changes: GalleryMediaChanges,
): Promise<void> {
  if (ids.length === 0) throw new Error('Select at least one gallery item.');

  const values: Record<string, string | string[] | number | null> = {};
  if (changes.assetId !== undefined) {
    const assetId = changes.assetId.trim();
    if (!assetId) throw new Error('Asset ID cannot be empty.');
    values.asset_id = assetId;
  }
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
  if (changes.sourceProvider !== undefined) {
    const provider = changes.sourceProvider.trim().toLowerCase();
    if (!provider) throw new Error('Source provider cannot be empty.');
    values.source_provider = provider;
  }
  if (changes.creatorName !== undefined) {
    const creatorName = changes.creatorName.trim();
    if (!creatorName) throw new Error('Creator name cannot be empty.');
    values.creator_name = creatorName;
  }
  if (changes.creatorHandle !== undefined) {
    values.creator_handle =
      changes.creatorHandle?.trim().replace(/^@/, '') || null;
  }
  if (changes.licenseName !== undefined) {
    const licenseName = changes.licenseName.trim();
    if (!licenseName) throw new Error('License name cannot be empty.');
    values.license_name = licenseName;
  }
  if (changes.licenseCheckedOn !== undefined) {
    values.license_checked_on = changes.licenseCheckedOn || null;
  }
  if (changes.downloadedOn !== undefined) {
    values.downloaded_on = changes.downloadedOn || null;
  }
  if (
    changes.originalWidth !== undefined ||
    changes.originalHeight !== undefined
  ) {
    const width = changes.originalWidth ?? null;
    const height = changes.originalHeight ?? null;
    const validDimensions =
      (width === null && height === null) ||
      (Number.isInteger(width) &&
        Number.isInteger(height) &&
        (width as number) > 0 &&
        (height as number) > 0);
    if (!validDimensions) {
      throw new Error(
        'Original width and height must both be positive whole numbers.',
      );
    }
    values.original_width = width;
    values.original_height = height;
  }
  if (changes.assetStatus !== undefined) {
    values.asset_status = changes.assetStatus;
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

export async function getGalleryMediaReferences(
  id: string,
): Promise<GalleryMediaReference[]> {
  const { data, error } = await getAdminSupabaseClient().rpc(
    'get_gallery_media_references',
    { p_media_id: id },
  );
  throwIfError(error);

  return (
    (data ?? []) as Array<{
      entity_type: string;
      entity_id: string;
      image_uri: string;
    }>
  ).map(reference => ({
    entityType: reference.entity_type,
    entityId: reference.entity_id,
    imageUri: reference.image_uri,
  }));
}

export async function deleteGalleryMedia(
  media: GalleryMedia,
): Promise<DeleteGalleryMediaResult> {
  const references = await getGalleryMediaReferences(media.id);
  if (references.length > 0) return { deleted: false, references };

  const client = getAdminSupabaseClient();
  const { data: deletedObjectPath, error: deleteError } = await client.rpc(
    'delete_gallery_media_if_unreferenced',
    { p_media_id: media.id },
  );

  if (deleteError?.code === '23503') {
    const currentReferences = await getGalleryMediaReferences(media.id);
    if (currentReferences.length > 0) {
      return { deleted: false, references: currentReferences };
    }
    throw new Error(
      'This media is still in use. Its references could not be displayed, so removal remains blocked.',
    );
  }
  throwIfError(deleteError);

  const objectPath =
    typeof deletedObjectPath === 'string'
      ? deletedObjectPath
      : media.objectPath;
  if (!objectPath) return { deleted: true };

  const { error: storageError } = await client.storage
    .from(GALLERY_BUCKET)
    .remove([objectPath]);

  if (storageError) {
    throw new Error(
      `The gallery record was removed, but its stored file could not be deleted. ${storageError.message}`,
    );
  }

  return { deleted: true };
}
