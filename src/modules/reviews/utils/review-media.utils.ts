import { BadRequestException } from "@nestjs/common";

import { MediaModuleEnum, ERROR_MESSAGES as MEDIA_ERROR_MESSAGES } from "../../media/media.constants";
import { ERROR_MESSAGES, REVIEW_CONSTRAINTS } from "../reviews.constants";

import type { MediaEntity } from "../../media/media.entity";
import type { MediaService } from "../../media/media.service";
import type { QueryRunner } from "typeorm";

/**
 * Validates that media ids are unique.
 */
function validateMediaIdsUniqueness(mediaIds: string[]): void {
  const uniqueMediaIds = new Set(mediaIds);

  if (uniqueMediaIds.size !== mediaIds.length) {
    throw new BadRequestException(ERROR_MESSAGES.INVALID_MEDIA_IDS);
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
      throw new BadRequestException(ERROR_MESSAGES.YOU_CAN_ONLY_ATTACH_MEDIA_YOU_UPLOADED);
    }

    if (media.recordId || media.module) {
      throw new BadRequestException(ERROR_MESSAGES.MEDIA_MUST_BE_UNATTACHED);
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
export async function validateReviewMedia(params: {
  mediaIds: string[] | undefined;
  userId: string;
  mediaService: MediaService;
}): Promise<void> {
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
export async function attachReviewMedia(params: {
  mediaIds: string[] | undefined;
  reviewId: string;
  mediaService: MediaService;
  queryRunner: QueryRunner;
}): Promise<void> {
  const { mediaIds, reviewId, mediaService, queryRunner } = params;

  if (!mediaIds || mediaIds.length === 0) {
    return;
  }

  await mediaService.attachMediaToRecord(mediaIds, MediaModuleEnum.REVIEW, reviewId, queryRunner);
}

/**
 * Detaches media from a review record.
 */
export async function detachReviewMedia(params: {
  mediaIds: string[] | undefined;
  mediaService: MediaService;
  queryRunner: QueryRunner;
}): Promise<void> {
  const { mediaIds, mediaService, queryRunner } = params;

  if (!mediaIds || mediaIds.length === 0) {
    return;
  }

  await mediaService.detachMediaFromRecord(mediaIds, queryRunner);
}
