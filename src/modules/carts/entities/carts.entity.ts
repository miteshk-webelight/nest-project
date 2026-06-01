import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Relation } from "typeorm";

import { BaseEntity } from "src/modules/database/base-entity";
import { UsersEntity } from "src/modules/users/entity/users.entity";

import { CartItemEntity } from "./cart-items.entity";

@Entity("Carts")
export class CartEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "cart";
  }

  @Column({ type: "varchar", nullable: true })
  @Index({ unique: true })
  userId?: string | null;

  @ManyToOne(() => UsersEntity, {
    nullable: true,
  })
  @JoinColumn({ name: "userId" })
  user?: Relation<UsersEntity>;

  @Column({ type: "varchar", nullable: true })
  @Index({ unique: true })
  guestToken?: string | null;

  @OneToMany(() => CartItemEntity, (cartItem) => cartItem.cart)
  cartItems: Relation<CartItemEntity[]>;
}
