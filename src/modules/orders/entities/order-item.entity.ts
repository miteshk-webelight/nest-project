import { Column, Entity, Index, JoinColumn, ManyToOne, Relation } from "typeorm";

import { BaseEntity } from "../../database/base-entity";
import { ProductEntity } from "../../products/product.entity";

import { VendorOrderEntity } from "./vendor-order.entity";

@Entity("OrderItems")
export class OrderItemEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "orderItem";
  }

  @Column()
  @Index()
  vendorOrderId: string;

  @ManyToOne(() => VendorOrderEntity, (vendorOrder) => vendorOrder.orderItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vendorOrderId" })
  vendorOrder: Relation<VendorOrderEntity>;

  @Column()
  @Index()
  productId: string;

  @ManyToOne(() => ProductEntity, (product) => product.id)
  @JoinColumn({ name: "productId" })
  product: Relation<ProductEntity>;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalPrice: number;

  @Column()
  skuSnapshot: string;

  @Column()
  nameSnapshot: string;

  @Column()
  slugSnapshot: string;
}
