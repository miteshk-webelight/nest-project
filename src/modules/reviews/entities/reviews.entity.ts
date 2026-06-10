import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from "typeorm";

import { BaseEntity } from "src/modules/database/base-entity";
import { OrderItemEntity } from "src/modules/orders/entities/order-item.entity";
import { ProductEntity } from "src/modules/products/product.entity";
import { UsersEntity } from "src/modules/users/entity/users.entity";

import { ReviewLikesEntity } from "./likes.entity";

@Entity("Reviews")
@Index(["userId", "productId"], { unique: true })
export class ReviewsEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "review";
  }

  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity)
  @JoinColumn({ name: "userId" })
  user: Relation<UsersEntity>;

  @Column()
  orderItemId: string;

  @ManyToOne(() => OrderItemEntity)
  @JoinColumn({ name: "orderItemId" })
  orderItem: Relation<OrderItemEntity>;

  @Column()
  productId: string;

  @ManyToOne(() => ProductEntity)
  product: Relation<ProductEntity>;

  @Column()
  title: string;

  @Column({ type: "text" })
  comment: string;

  @Column({ type: "int" })
  rating: number;

  @Column({ default: 0 })
  likesCount: number;

  @OneToMany(() => ReviewLikesEntity, (like) => like.review)
  likes: Relation<ReviewLikesEntity[]>;
}
