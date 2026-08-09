const MAX_ATTACHMENT_FILE_SIZE = 50 * 1024 * 1024;

export const GALLERY_ATTACHMENT_ACCEPT = [
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
].join(',');

const supportedImageTypes = new Set(GALLERY_ATTACHMENT_ACCEPT.split(','));

export type GalleryAttachmentFile = {
  name: string;
  size: number;
  type: string;
};

export type GalleryAttachmentAsset = {
  id: string;
  assetId: string;
  objectPath: string | null;
};

export type GalleryAttachmentRejectionCode =
  | 'empty_file'
  | 'unsupported_type'
  | 'oversized_file'
  | 'unmatched_asset'
  | 'ambiguous_asset'
  | 'already_attached'
  | 'duplicate_asset';

export type GalleryAttachmentRejection<TFile extends GalleryAttachmentFile> = {
  code: GalleryAttachmentRejectionCode;
  file: TFile;
};

export type GalleryAttachmentMatch<TFile extends GalleryAttachmentFile> = {
  asset: GalleryAttachmentAsset;
  file: TFile;
};

export type GalleryAttachmentPlan<TFile extends GalleryAttachmentFile> = {
  matches: GalleryAttachmentMatch<TFile>[];
  rejected: GalleryAttachmentRejection<TFile>[];
};

export function attachmentRejectionMessage(
  code: GalleryAttachmentRejectionCode,
): string {
  switch (code) {
    case 'empty_file':
      return 'The file is empty.';
    case 'unsupported_type':
      return 'The file is not a supported image type.';
    case 'oversized_file':
      return 'The file is larger than 50 MB.';
    case 'unmatched_asset':
      return 'The filename does not contain a registered Asset ID.';
    case 'ambiguous_asset':
      return 'The filename contains more than one registered Asset ID.';
    case 'already_attached':
      return 'The matching asset already has a file.';
    case 'duplicate_asset':
      return 'More than one selected file matches the same Asset ID.';
  }
}

export function planGalleryMediaAttachments<
  TFile extends GalleryAttachmentFile,
>(
  files: TFile[],
  assets: GalleryAttachmentAsset[],
): GalleryAttachmentPlan<TFile> {
  const rejected: GalleryAttachmentRejection<TFile>[] = [];
  const candidates: GalleryAttachmentMatch<TFile>[] = [];

  files.forEach(file => {
    if (file.size === 0) {
      rejected.push({ code: 'empty_file', file });
      return;
    }
    if (!supportedImageTypes.has(file.type)) {
      rejected.push({ code: 'unsupported_type', file });
      return;
    }
    if (file.size > MAX_ATTACHMENT_FILE_SIZE) {
      rejected.push({ code: 'oversized_file', file });
      return;
    }

    const matchingAssets = assets.filter(asset =>
      file.name.includes(asset.assetId),
    );
    if (matchingAssets.length === 0) {
      rejected.push({ code: 'unmatched_asset', file });
      return;
    }
    if (matchingAssets.length > 1) {
      rejected.push({ code: 'ambiguous_asset', file });
      return;
    }

    const asset = matchingAssets[0];
    if (asset.objectPath) {
      rejected.push({ code: 'already_attached', file });
      return;
    }
    candidates.push({ asset, file });
  });

  const matchesPerAsset = new Map<string, number>();
  candidates.forEach(({ asset }) => {
    matchesPerAsset.set(asset.id, (matchesPerAsset.get(asset.id) ?? 0) + 1);
  });

  const matches = candidates.filter(candidate => {
    if (matchesPerAsset.get(candidate.asset.id) === 1) return true;
    rejected.push({ code: 'duplicate_asset', file: candidate.file });
    return false;
  });

  return { matches, rejected };
}
