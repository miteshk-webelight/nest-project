import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { logger } from "src/services/logger.service";

import cloudinary from "../../config/cloudinary.config";
import { DatabaseService } from "../database/database.service";

import { CRON_CONSTANTS, MEDIA_CONSTANTS, MEDIA_SELECT_FIELDS } from "./media.constants";
import { MediaEntity } from "./media.entity";

import type { Repository } from "typeorm";

@Injectable()
export class MediaCleanupService {
  constructor(private readonly databaseService: DatabaseService) {}

  // This CRON job will run every day at 2 AM
  @Cron(CRON_CONSTANTS.ORPHAN_MEDIA_CLEANUP_CRON)
  async cleanupOrphanMedia(): Promise<void> {
    logger.info("Starting orphan media cleanup...");

    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - MEDIA_CONSTANTS.ORPHAN_MEDIA_CLEANUP_HOURS);

      const mediaRepository = this.databaseService.getRepository(MediaEntity);

      const orphanMedia = await mediaRepository
        .createQueryBuilder("media")
        .select(MEDIA_SELECT_FIELDS.MEDIA_ID_AND_PATH)
        .where("media.recordId IS NULL")
        .andWhere("media.module IS NULL")
        .andWhere("media.createdAt < :cutoffDate", { cutoffDate })
        .getMany();

      if (orphanMedia.length === 0) {
        logger.info("No orphan media found for cleanup.");
        return;
      }

      logger.info(`Found ${orphanMedia.length} orphan media items to clean up.`);

      const publicIds = orphanMedia.map((media) => media.publicId);

      await this.deleteFromCloudinary(publicIds as string[]);

      await this.deleteFromDatabase(orphanMedia, mediaRepository);

      logger.info(`Successfully cleaned up ${orphanMedia.length} orphan media items.`);
    } catch (error) {
      logger.error("Error during orphan media cleanup:", error);
    }
  }

  private async deleteFromCloudinary(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) {
      return;
    }

    await Promise.allSettled(
      publicIds.map(async (publicId) => {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          logger.warn(`Failed to delete Cloudinary resource: ${publicId}`, error);
        }
      }),
    );
  }

  private async deleteFromDatabase(mediaItems: MediaEntity[], mediaRepository: Repository<MediaEntity>): Promise<void> {
    const mediaIds = mediaItems.map((media) => media.id);

    await mediaRepository
      .createQueryBuilder()
      .delete()
      .from(MediaEntity)
      .where("id IN (:...mediaIds)", { mediaIds })
      .execute();
  }
}
