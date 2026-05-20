import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { QueryRunner, Repository } from "typeorm";

import { DatabaseService } from "../database/database.service";

import { ERROR_MESSAGES } from "./constants/message";
import { MediaEntity } from "./media.entity";

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    private readonly databaseService: DatabaseService,
  ) {}

  async ManageMedia(recordId: string, module: string, media: MediaEntity[]): Promise<void> {
    const existMedia = await this.mediaRepository
      .createQueryBuilder("media")
      .where("media.recordId = :recordId AND media.module = :module", { recordId, module })
      .getMany();

    const existingMediapath = existMedia.map((m) => m.filePath);

    const mediaToAdd = media.filter((m) => !existingMediapath.includes(m.filePath));

    const mediaToRemove = existingMediapath.filter((path) => !media.map((m) => m.filePath).includes(path));

    const MediaToUpdate = media.filter((m) => existingMediapath.includes(m.filePath));

    const queryRunner = await this.databaseService.createQueryRunner();

    try {
      if (mediaToRemove.length > 0) {
        await this.deleteMedia(mediaToRemove, queryRunner);
      }

      if (mediaToAdd.length > 0) {
        await this.ValidateMedia(mediaToAdd.map((m) => m.filePath));

        await Promise.all(
          mediaToAdd.map(async (mediaEntity) => {
            const newMedia = this.mediaRepository.create({ ...mediaEntity, recordId, module });
            await queryRunner.manager.save(newMedia);
          }),
        );
      }
      if (MediaToUpdate.length > 0) {
        await Promise.all(
          MediaToUpdate.map(async (mediaEntity) => {
            const existMediaEntity = existMedia.find((m) => m.filePath === mediaEntity.filePath);
            if (existMediaEntity) {
              const updated = Object.assign(existMediaEntity, mediaEntity);
              await queryRunner.manager.save(updated);
            }
          }),
        );
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async ValidateMedia(paths: string[]): Promise<void> {
    const existMedia = await this.mediaRepository
      .createQueryBuilder("media")
      .where("media.filePath IN (:...paths)", { paths })
      .getMany();

    if (existMedia.length !== paths.length) {
      throw new ConflictException(ERROR_MESSAGES.MEDIA_ALREADY_EXISTS);
    }
  }

  async deleteMedia(paths: string[], queryRunner?: QueryRunner): Promise<void> {
    const existMedia = await this.mediaRepository
      .createQueryBuilder("media")
      .where("media.filePath IN (:...paths)", { paths })
      .getMany();

    if (existMedia.length !== paths.length) {
      throw new NotFoundException(ERROR_MESSAGES.MEDIA_NOT_FOUND);
    }
    if (queryRunner) {
      await queryRunner.manager.softRemove(existMedia);
    } else {
      await this.mediaRepository.softRemove(existMedia);
    }
  }
}
