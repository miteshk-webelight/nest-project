import { MediaModuleEnum } from "../../media/media.constants";

import { validateFinalMediaCount, validateNewMediaIds, validateRemovedMediaIds } from "./media-validation.utils";

import type { MediaService } from "../../media/media.service";
import type { UpdateProductDto } from "../dto/update-product.dto";
import type { QueryRunner } from "typeorm";

/**
 * Validates the media updates for a product, ensuring that removed media IDs exist and belong to the vendor,
 * new media IDs are valid and belong to the vendor, and that the final media count does not exceed limits.
 */
export async function validateProductMediaUpdates(params: {
  dto: UpdateProductDto;
  productId: string;
  vendorUserId: string;
  mediaService: MediaService;
}): Promise<void> {
  const { dto, productId, vendorUserId, mediaService } = params;

  const existingMedia = await mediaService.getMediaByRecord(MediaModuleEnum.PRODUCT, productId);

  validateRemovedMediaIds(dto.removedMediaIds, existingMedia);

  const availableMedia = dto.newMediaIds ? await mediaService.getAvailableMediaByIds(dto.newMediaIds) : [];

  validateNewMediaIds(dto.newMediaIds, dto.removedMediaIds, vendorUserId, availableMedia);

  validateFinalMediaCount(existingMedia.length, dto.removedMediaIds?.length ?? 0, dto.newMediaIds?.length ?? 0);
}

/**
 * Synchronizes the media associations for a product based on the provided update DTO, attaching new media and detaching old media.
 */
export async function syncProductMedia(params: {
  dto: UpdateProductDto;
  productId: string;
  mediaService: MediaService;
  queryRunner: QueryRunner;
}): Promise<void> {
  const { dto, productId, mediaService, queryRunner } = params;

  if (dto.removedMediaIds?.length) {
    await mediaService.detachMediaFromRecord(dto.removedMediaIds, queryRunner);
  }

  if (dto.newMediaIds?.length) {
    await mediaService.attachMediaToRecord(dto.newMediaIds, MediaModuleEnum.PRODUCT, productId, queryRunner);
  }
}
