import { BadRequestException } from "@nestjs/common";

import { ERROR_MESSAGES as MEDIA_ERROR_MESSAGES } from "../../media/media.constants";
import { ERROR_MESSAGES, ERROR_MESSAGES as PRODUCT_ERROR_MESSAGES, PRODUCT_MEDIA_COUNTS } from "../products.constants";

import type { MediaEntity } from "../../media/media.entity";

/**
 * Validates that:
 * - removed media ids are unique
 * - all removed media belong to the current product
 *
 * This ensures vendors cannot remove:
 * - duplicate media entries
 * - media attached to another product
 * - non-existing media
 */
export function validateRemovedMediaIds(removedMediaIds: string[] | undefined, existingMedia: MediaEntity[]): void {
  if (!removedMediaIds || removedMediaIds.length === 0) {
    return;
  }

  // Ensuring that there are no duplicated media ids
  const existingMediaIds = new Set(existingMedia.map(({ id }) => id));
  const uniqueRemovedIds = new Set(removedMediaIds);

  if (uniqueRemovedIds.size !== removedMediaIds.length) {
    throw new BadRequestException(ERROR_MESSAGES.REMOVED_MEDIA_MUST_BE_UNIQUE);
  }

  for (const mediaId of removedMediaIds) {
    if (!existingMediaIds.has(mediaId)) {
      throw new BadRequestException(ERROR_MESSAGES.REMOVED_MEDIA_BELONG_TO_CURRENT_PRODUCT);
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
    throw new BadRequestException(ERROR_MESSAGES.NEW_MEDIA_IDS_MUST_UNIQUE);
  }

  const removedSet = new Set(removedMediaIds ?? []);

  for (const mediaId of newMediaIds) {
    if (removedSet.has(mediaId)) {
      throw new BadRequestException(ERROR_MESSAGES.NEW_MEDIA_NOT_OVERLAP_WITH_REMOVED_IDS);
    }
  }
}

/**
 * Validates that:
 * - media exists
 * - media was uploaded by the current vendor
 * - media is currently unattached to any module/record
 *
 * Prevents:
 * - attaching another vendor's media
 * - reusing already attached media
 * - attaching invalid media ids
 */
function validateMediaOwnershipAndAvailability(
  newMediaIds: string[],
  vendorUserId: string,
  availableMedia: MediaEntity[],
): void {
  const availableMediaMap = new Map(availableMedia.map((media) => [media.id, media]));

  for (const mediaId of newMediaIds) {
    const media = availableMediaMap.get(mediaId);

    if (!media) {
      throw new BadRequestException(MEDIA_ERROR_MESSAGES.INVALID_MEDIA_IDS);
    }

    if (media.createdBy !== vendorUserId) {
      throw new BadRequestException(ERROR_MESSAGES.YOU_CAN_ONLY_ATTACH_MEDIA_YOU_UPLOADED);
    }

    if (media.recordId || media.module) {
      throw new BadRequestException(ERROR_MESSAGES.MEDIA_MUST_NOT_ATTACHED_TO_ANOTHER_RECORD);
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
export function validateNewMediaIds(
  newMediaIds: string[] | undefined,
  removedMediaIds: string[] | undefined,
  vendorUserId: string,
  availableMedia: MediaEntity[],
): void {
  if (!newMediaIds?.length) {
    return;
  }

  validateNewMediaUniqueness(newMediaIds, removedMediaIds);
  validateMediaOwnershipAndAvailability(newMediaIds, vendorUserId, availableMedia);
}

/**
 * Validates final media count after update operation.
 *
 * Formula:
 * finalMediaCount = existingMediaCount - removedMediaCount + newMediaCount
 *
 * Rules:
 * - minimum media count = 1
 * - maximum media count = 5
 */
export function validateFinalMediaCount(
  existingMediaCount: number,
  removedMediaCount: number,
  newMediaCount: number,
): void {
  const finalMediaCount = existingMediaCount - removedMediaCount + newMediaCount;

  if (finalMediaCount < PRODUCT_MEDIA_COUNTS.MIN || finalMediaCount > PRODUCT_MEDIA_COUNTS.MAX) {
    throw new BadRequestException(PRODUCT_ERROR_MESSAGES.INVALID_IMAGES_COUNT);
  }
}
