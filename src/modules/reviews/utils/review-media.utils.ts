import { BadRequestException } from "@nestjs/common";

import { ERROR_MESSAGES as MEDIA_ERROR_MESSAGES, MediaModuleEnum } from "../../media/media.constants";
import {
  validateFinalMediaCount,
  validateNewMediaIds,
  validateRemovedMediaIds,
} from "../../media/utils/media-validation.utils";
import { ERROR_MESSAGES, REVIEW_CONSTRAINTS } from "../reviews.constants";

import type { MediaEntity } from "../../media/media.entity";
import type {
  AttachReviewMediaParams,
  DetachReviewMediaParams,
  ReviewMediaUpdatesParams,
  SyncReviewMediaParams,
  ValidateReviewMediaParams,
} from "../reviews.types";

/**
 * Validates that media ids are unique.
 */
function validateMediaIdsUniqueness(mediaIds: string[]): void {
  const uniqueMediaIds = new Set(mediaIds);

  if (uniqueMediaIds.size !== mediaIds.length) {
    throw new BadRequestException(MEDIA_ERROR_MESSAGES.INVALID_MEDIA_IDS);
  }
}

/**
 * Validates media ownership and availability.
 */
function validateMediaOwnershipAndAvailability(
  mediaIds: string[],
  userId: string,
  availableMedia: MediaEntity[],
): void {
  const availableMediaMap = new Map(availableMedia.map((media) => [media.id, media]));

  for (const mediaId of mediaIds) {
    const media = availableMediaMap.get(mediaId);

    if (!media) {
      throw new BadRequestException(MEDIA_ERROR_MESSAGES.INVALID_MEDIA_IDS);
    }

    if (media.createdBy !== userId) {
      throw new BadRequestException(MEDIA_ERROR_MESSAGES.YOU_CAN_ONLY_ATTACH_MEDIA_YOU_UPLOADED);
    }

    if (media.recordId || media.module) {
      throw new BadRequestException(MEDIA_ERROR_MESSAGES.MEDIA_MUST_NOT_BE_ATTACHED_TO_ANOTHER_RECORD);
    }
  }
}

/**
 * Validates that:
 * - media ids are unique
 * - media exists
 * - media was uploaded by the current user
 * - media is currently unattached to any module/record
 * - media count does not exceed limits
 */
export async function validateReviewMedia(params: ValidateReviewMediaParams): Promise<void> {
  const { mediaIds, userId, mediaService } = params;

  if (!mediaIds || mediaIds.length === 0) {
    return;
  }

  if (mediaIds.length > REVIEW_CONSTRAINTS.MAX_IMAGES) {
    throw new BadRequestException(ERROR_MESSAGES.INVALID_IMAGES_COUNT);
  }

  validateMediaIdsUniqueness(mediaIds);

  const availableMedia = await mediaService.getAvailableMediaByIds(mediaIds);

  if (availableMedia.length !== mediaIds.length) {
    throw new BadRequestException(MEDIA_ERROR_MESSAGES.INVALID_MEDIA_IDS);
  }

  validateMediaOwnershipAndAvailability(mediaIds, userId, availableMedia);
}

/**
 * Attaches media to a review record.
 */
export async function attachReviewMedia(params: AttachReviewMediaParams): Promise<void> {
  const { mediaIds, reviewId, mediaService, queryRunner } = params;

  if (!mediaIds || mediaIds.length === 0) {
    return;
  }

  await mediaService.attachMediaToRecord(mediaIds, MediaModuleEnum.REVIEW, reviewId, queryRunner);
}

/**
 * Detaches media from a review record.
 */
export async function detachReviewMedia(params: DetachReviewMediaParams): Promise<void> {
  const { mediaIds, mediaService, queryRunner } = params;

  if (!mediaIds || mediaIds.length === 0) {
    return;
  }

  await mediaService.detachMediaFromRecord(mediaIds, queryRunner);
}

/**
 * Validates the media updates for a review using the generic media validation utilities.
 */
export async function validateReviewMediaUpdates(params: ReviewMediaUpdatesParams): Promise<void> {
  const { dto, reviewId, userId, mediaService } = params;

  const existingMedia = await mediaService.getMediaByRecord(MediaModuleEnum.REVIEW, reviewId);

  validateRemovedMediaIds({
    removedMediaIds: dto.removedMediaIds,
    existingMedia,
  });

  const availableMedia = dto.newMediaIds ? await mediaService.getAvailableMediaByIds(dto.newMediaIds) : [];

  validateNewMediaIds({
    newMediaIds: dto.newMediaIds,
    removedMediaIds: dto.removedMediaIds,
    userId,
    availableMedia,
  });

  validateFinalMediaCount({
    existingMediaCount: existingMedia.length,
    removedMediaCount: dto.removedMediaIds?.length ?? 0,
    newMediaCount: dto.newMediaIds?.length ?? 0,
    minCount: 0,
    maxCount: REVIEW_CONSTRAINTS.MAX_IMAGES,
  });
}

/**
 * Synchronizes media associations for a review.
 */
export async function syncReviewMedia(params: SyncReviewMediaParams): Promise<void> {
  const { dto, reviewId, mediaService, queryRunner } = params;

  if (dto.removedMediaIds?.length) {
    await mediaService.detachMediaFromRecord(dto.removedMediaIds, queryRunner);
  }

  if (dto.newMediaIds?.length) {
    await mediaService.attachMediaToRecord(dto.newMediaIds, MediaModuleEnum.REVIEW, reviewId, queryRunner);
  }
}
