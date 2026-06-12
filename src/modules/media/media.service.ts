import { BadRequestException, Injectable } from "@nestjs/common";

import cloudinary from "../../config/cloudinary.config";
import { handleServiceError } from "../../utils/service-error-handler";
import { DatabaseService } from "../database/database.service";

import { ERROR_MESSAGES, MEDIA_CONSTANTS, MEDIA_SELECT_FIELDS, MediaModuleEnum } from "./media.constants";
import { MediaEntity } from "./media.entity";

import type { UploadApiResponse } from "cloudinary";
import type { QueryRunner } from "typeorm";

@Injectable()
export class MediaService {
  constructor(private readonly databaseService: DatabaseService) {}

  async uploadFiles(files: Express.Multer.File[]): Promise<MediaEntity[] | void> {
    if (!files.length) {
      throw new BadRequestException(ERROR_MESSAGES.NO_FILES_UPLOADED);
    }

    const queryRunner = await this.databaseService.createQueryRunner();

    const uploadedPublicIds: string[] = [];

    try {
      const mediaRepository = queryRunner.manager.getRepository(MediaEntity);

      const mediaEntities: MediaEntity[] = [];

      for (const file of files) {
        this.validateFile(file);

        const uploadResult = await this.uploadToCloudinary(file);

        uploadedPublicIds.push(uploadResult.public_id);

        const mediaEntity = mediaRepository.create({
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          publicId: uploadResult.public_id,
          filePath: uploadResult.secure_url,
        });

        mediaEntities.push(mediaEntity);
      }

      const savedMedia = await mediaRepository.save(mediaEntities);

      await this.databaseService.commitTransaction(queryRunner);

      return savedMedia;
    } catch (error) {
      await this.databaseService.rollbackTransaction(queryRunner);

      await this.deleteUploadedFiles(uploadedPublicIds);

      handleServiceError(error, "uploadFiles");
    } finally {
      await this.databaseService.releaseQueryRunner(queryRunner);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!MEDIA_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    if (file.size > MEDIA_CONSTANTS.MAX_FILE_SIZE) {
      throw new BadRequestException(ERROR_MESSAGES.FILE_TOO_LARGE);
    }
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: MEDIA_CONSTANTS.CLOUDINARY_FOLDER,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(new BadRequestException(ERROR_MESSAGES.UPLOAD_FAILED));

            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  private async deleteUploadedFiles(publicIds: string[]): Promise<void> {
    if (!publicIds.length) {
      return;
    }

    await Promise.allSettled(
      publicIds.map(async (publicId) => {
        await cloudinary.uploader.destroy(publicId);
      }),
    );
  }

  async validateMediaIds(mediaIds: string[], queryRunner: QueryRunner): Promise<void> {
    if (mediaIds.length > MEDIA_CONSTANTS.MAX_FILES) {
      throw new BadRequestException(ERROR_MESSAGES.MAX_FILES_EXCEEDED);
    }

    const mediaRepository = queryRunner.manager.getRepository(MediaEntity);

    const media = await mediaRepository
      .createQueryBuilder("media")
      .select(MEDIA_SELECT_FIELDS.MEDIA_ID)
      .where("media.id IN (:...mediaIds)", {
        mediaIds,
      })
      .andWhere("media.recordId IS NULL")
      .getMany();

    if (media.length !== mediaIds.length) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_MEDIA_IDS);
    }
  }

  async attachMediaToRecord({ mediaIds, module, recordId, queryRunner }): Promise<void> {
    if (!mediaIds?.length) return;

    const mediaRepository = queryRunner.manager.getRepository(MediaEntity);

    await mediaRepository
      .createQueryBuilder()
      .update(MediaEntity)
      .set({
        module,
        recordId,
      })
      .where("id IN (:...mediaIds)", {
        mediaIds,
      })
      .execute();
  }

  async getMediaByRecord(module: MediaModuleEnum, recordId: string): Promise<MediaEntity[]> {
    const mediaRepository = this.databaseService.getRepository(MediaEntity);

    return await mediaRepository
      .createQueryBuilder("media")
      .where("media.module = :module", {
        module,
      })
      .andWhere("media.recordId = :recordId", {
        recordId,
      })
      .getMany();
  }

  async detachMediaFromRecord(mediaIds: string[] | undefined, queryRunner: QueryRunner): Promise<void> {
    if (!mediaIds?.length) return;

    const mediaRepository = queryRunner.manager.getRepository(MediaEntity);
    await mediaRepository
      .createQueryBuilder()
      .update(MediaEntity)
      .set({
        module: null,
        recordId: null,
      })
      .where("id IN (:...mediaIds)", {
        mediaIds,
      })
      .execute();
  }

  async getAvailableMediaByIds(mediaIds: string[]): Promise<MediaEntity[]> {
    const mediaRepository = this.databaseService.getRepository(MediaEntity);

    return await mediaRepository
      .createQueryBuilder("media")
      .select(MEDIA_SELECT_FIELDS.MEDIA_DETAILS)
      .where("media.id IN (:...mediaIds)", {
        mediaIds,
      })
      .getMany();
  }
}
