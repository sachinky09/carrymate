import { supabase, ITEM_IMAGES_BUCKET } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const FILE = 'services/storageService.js';
const SIGNED_URL_TTL_SECONDS = 3600;

export async function uploadRequestImage(requestId, fileBuffer, mimeType) {
  const ext = mimeType && mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${requestId}/image.${ext}`;

  const { error } = await supabase.storage
    .from(ITEM_IMAGES_BUCKET)
    .upload(path, fileBuffer, { contentType: mimeType, upsert: true });

  if (error) {
    throw new AppError(`Image upload failed: ${error.message}`, 500, FILE);
  }

  return path;
}

export async function getSignedImageUrl(path) {
  if (!path) return '';
  const { data, error } = await supabase.storage
    .from(ITEM_IMAGES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw new AppError(`Signed URL generation failed: ${error.message}`, 500, FILE);
  }

  return data.signedUrl;
}
