import { BadRequestException } from "@nestjs/common";

import { ERROR_MESSAGES } from "../media.constants";

import type {
  ValidateFinalMediaCountParams,
  ValidateNewMediaIdsParams,
  ValidateRemovedMediaIdsParams,
} from "../media.types";

/**
 * Validates that:
 * - removed media ids are unique
 * - all removed media belong to the current record
 *
 * This ensures users cannot remove:
 * - duplicate media entries
 * - media attached to another record
 * - non-existing media
 */
export function validateRemovedMediaIds({ removedMediaIds, existingMedia }: ValidateRemovedMediaIdsParams): void {
  if (!removedMediaIds || removedMediaIds.length === 0) {
    return;
  }

  const existingMediaIds = new Set(existingMedia.map(({ id }) => id));
  const uniqueRemovedIds = new Set(removedMediaIds);

  if (uniqueRemovedIds.size !== removedMediaIds.length) {
    throw new BadRequestException(ERROR_MESSAGES.REMOVED_MEDIA_IDS_MUST_BE_UNIQUE);
  }

  for (const mediaId of removedMediaIds) {
    if (!existingMediaIds.has(mediaId)) {
      throw new BadRequestException(ERROR_MESSAGES.REMOVED_MEDIA_MUST_BELONG_TO_RECORD);
    }
  }
}

/**
 * Validates that:
 * - new media ids are unique
 * - new media ids do not overlap with removed media ids
 *
 * Prevents invalid payload combinations such as:
 * - duplicate uploads
 * - removing and attaching same media simultaneously
 */
function validateNewMediaUniqueness(newMediaIds: string[], removedMediaIds: string[] | undefined): void {
  const uniqueNewIds = new Set(newMediaIds);

  if (uniqueNewIds.size !== newMediaIds.length) {
    throw new BadRequestException(ERROR_MESSAGES.NEW_MEDIA_IDS_MUST_BE_UNIQUE);
  }

  const removedSet = new Set(removedMediaIds ?? []);

  for (const mediaId of newMediaIds) {
    if (removedSet.has(mediaId)) {
      throw new BadRequestException(ERROR_MESSAGES.NEW_MEDIA_IDS_MUST_NOT_OVERLAP_WITH_REMOVED);
    }
  }
}

/**
 * Validates that:
 * - media exists
 * - media was uploaded by the current user/creator
 * - media is currently unattached to any module/record
 *
 * Prevents:
 * - attaching another user's media
 * - reusing already attached media
 * - attaching invalid media ids
 */
function validateMediaOwnershipAndAvailability(
  newMediaIds: string[],
  userId: string,
  availableMedia: ValidateNewMediaIdsParams["availableMedia"],
): void {
  const availableMediaMap = new Map(availableMedia.map((media) => [media.id, media]));

  for (const mediaId of newMediaIds) {
    const media = availableMediaMap.get(mediaId);

    if (!media) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_MEDIA_IDS);
    }

    if (media.createdBy !== userId) {
      throw new BadRequestException(ERROR_MESSAGES.YOU_CAN_ONLY_ATTACH_MEDIA_YOU_UPLOADED);
    }

    if (media.recordId || media.module) {
      throw new BadRequestException(ERROR_MESSAGES.MEDIA_MUST_NOT_BE_ATTACHED_TO_ANOTHER_RECORD);
    }
  }
}

/**
 * Main validator for newly attached media.
 *
 * Performs:
 * - uniqueness validation
 * - overlap validation
 * - ownership validation
 * - media availability validation
 */
export function validateNewMediaIds({
  newMediaIds,
  removedMediaIds,
  userId,
  availableMedia,
}: ValidateNewMediaIdsParams): void {
  if (!newMediaIds?.length) {
    return;
  }

  validateNewMediaUniqueness(newMediaIds, removedMediaIds);
  validateMediaOwnershipAndAvailability(newMediaIds, userId, availableMedia);
}

/**
 * Validates final media count after update operation.
 *
 * Formula:
 * finalMediaCount = existingMediaCount - removedMediaCount + newMediaCount
 */
export function validateFinalMediaCount({
  existingMediaCount,
  removedMediaCount,
  newMediaCount,
  minCount,
  maxCount,
}: ValidateFinalMediaCountParams): void {
  const finalMediaCount = existingMediaCount - removedMediaCount + newMediaCount;

  if (finalMediaCount < minCount || finalMediaCount > maxCount) {
    throw new BadRequestException(ERROR_MESSAGES.INVALID_MEDIA_COUNT);
  }
}
