import { MediaModuleEnum } from "../../media/media.constants";
import {
  validateFinalMediaCount,
  validateNewMediaIds,
  validateRemovedMediaIds,
} from "../../media/utils/media-validation.utils";
import { PRODUCT_MEDIA_COUNTS } from "../products.constants";

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

  validateRemovedMediaIds({
    removedMediaIds: dto.removedMediaIds,
    existingMedia,
  });

  const availableMedia = dto.newMediaIds ? await mediaService.getAvailableMediaByIds(dto.newMediaIds) : [];

  validateNewMediaIds({
    newMediaIds: dto.newMediaIds,
    removedMediaIds: dto.removedMediaIds,
    userId: vendorUserId,
    availableMedia,
  });

  validateFinalMediaCount({
    existingMediaCount: existingMedia.length,
    removedMediaCount: dto.removedMediaIds?.length ?? 0,
    newMediaCount: dto.newMediaIds?.length ?? 0,
    minCount: PRODUCT_MEDIA_COUNTS.MIN,
    maxCount: PRODUCT_MEDIA_COUNTS.MAX,
  });
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
    await mediaService.attachMediaToRecord({
      mediaIds: dto.newMediaIds,
      module: MediaModuleEnum.PRODUCT,
      recordId: productId,
      queryRunner,
    });
  }
}
