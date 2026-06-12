import type { MediaModuleEnum } from "./media.constants";
import type { MediaEntity } from "./media.entity";
import type { QueryRunner } from "typeorm";

export type ValidateRemovedMediaIdsParams = {
  removedMediaIds: string[] | undefined;
  existingMedia: MediaEntity[];
};

export type ValidateNewMediaIdsParams = {
  newMediaIds: string[] | undefined;
  removedMediaIds: string[] | undefined;
  userId: string;
  availableMedia: MediaEntity[];
};

export type ValidateFinalMediaCountParams = {
  existingMediaCount: number;
  removedMediaCount: number;
  newMediaCount: number;
  minCount: number;
  maxCount: number;
};
export interface AttachMediaToRecordParams {
  mediaIds: string[] | undefined;
  module: MediaModuleEnum;
  recordId: string;
  queryRunner: QueryRunner;
}
