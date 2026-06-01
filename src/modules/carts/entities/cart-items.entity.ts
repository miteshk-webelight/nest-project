import { Column, Entity, Index, JoinColumn, ManyToOne, Relation } from "typeorm";

import { BaseEntity } from "src/modules/database/base-entity";
import { ProductEntity } from "src/modules/products/product.entity";

import { CartEntity } from "./carts.entity";

@Entity("CartItems")
@Index(["cartId", "productId"], { unique: true })
export class CartItemEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "cartItem";
  }

  @Column()
  cartId: string;

  @ManyToOne(() => CartEntity, (cart) => cart.cartItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "cartId" })
  cart: Relation<CartEntity>;

  @Column()
  productId: string;

  @ManyToOne(() => ProductEntity, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product: Relation<ProductEntity>;

  @Column({
    type: "int",
  })
  quantity: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  priceSnapshot: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  discountPriceSnapshot?: number;

  @Column()
  slugSnapshot: string;

  @Column()
  nameSnapshot: string;
}
