import type { UpdateReviewDto } from "./dto/update-review.dto";
import type { MediaService } from "../media/media.service";
import type { QueryRunner } from "typeorm";

interface WithQueryRunner {
  queryRunner: QueryRunner;
}

interface WithMediaService {
  mediaService: MediaService;
}

interface WithUserAndReview {
  userId: string;
  reviewId: string;
}

export interface GetOrFailMyReviewParams extends WithQueryRunner, WithUserAndReview {}

export interface ReviewMediaUpdatesParams extends WithUserAndReview, WithMediaService {
  dto: UpdateReviewDto;
}

export interface ValidateReviewMediaParams extends WithMediaService {
  mediaIds: string[] | undefined;
  userId: string;
}

export interface AttachReviewMediaParams extends WithQueryRunner, WithMediaService {
  mediaIds: string[] | undefined;
  reviewId: string;
}

export interface DetachReviewMediaParams extends WithQueryRunner, WithMediaService {
  mediaIds: string[] | undefined;
}

export interface SyncReviewMediaParams extends WithQueryRunner, WithMediaService {
  dto: UpdateReviewDto;
  reviewId: string;
}
