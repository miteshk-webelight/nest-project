export const MEDIA_CONSTANTS = {
  MAX_FILES: 5,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  CLOUDINARY_FOLDER: "e-commerce/products",
  ORPHAN_MEDIA_CLEANUP_HOURS: 24, // Media that is 24 Hours old are considered for clean up
};

export const CRON_CONSTANTS = {
  ORPHAN_MEDIA_CLEANUP_CRON: "0 2 * * *", // 2 AM every midnight
};

export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: "Invalid file type",
  FILE_TOO_LARGE: "File size exceeds allowed limit",
  UPLOAD_FAILED: "Failed to upload file",
  MAX_FILES_EXCEEDED: "Maximum files limit exceeded",
  INVALID_MEDIA_IDS: "One or more media IDs are invalid",
  NO_FILES_UPLOADED: "No files uploaded",
};
export const SUCCESS_MESSAGES = {
  MEDIA_UPLOADED_SUCCESS: "Media uploaded successfully",
};
export const MEDIA_SELECT_FIELDS = {
  MEDIA_ID: ["media.id"],
  MEDIA_ID_AND_PATH: ["media.id", "media.filePath", "media.publicId"],
  MEDIA_DETAILS: ["media.id", "media.createdBy", "media.recordId", "media.module"],
};
export enum MediaModuleEnum {
  PRODUCT = "PRODUCT",
}
