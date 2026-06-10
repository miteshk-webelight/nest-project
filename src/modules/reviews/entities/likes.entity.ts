import { Column, Entity, Index, ManyToOne, type Relation } from "typeorm";

import { BaseEntity } from "src/modules/database/base-entity";
import { UsersEntity } from "src/modules/users/entity/users.entity";

import { ReviewsEntity } from "./reviews.entity";

@Entity("ReviewLikes")
@Index(["userId", "reviewId"], { unique: true })
export class ReviewLikesEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "reviewLike";
  }

  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity)
  user: Relation<UsersEntity>;

  @Column()
  reviewId: string;

  @ManyToOne(() => ReviewsEntity, (review) => review.likes)
  review: Relation<ReviewsEntity>;
}
