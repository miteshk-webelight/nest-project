import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Relation } from "typeorm";

import { VendorProfileEntity } from "src/modules/vendors/vendor.profile.entity";

import { BaseEntity } from "../../database/base-entity";
import { VendorOrderStatusEnum } from "../orders.enums";

import { OrderItemEntity } from "./order-item.entity";
import { OrderEntity } from "./order.entity";

@Entity("VendorOrders")
export class VendorOrderEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "vendorOrder";
  }

  @Column()
  @Index()
  orderId: string;

  @ManyToOne(() => OrderEntity, (order) => order.vendorOrders, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "orderId" })
  order: Relation<OrderEntity>;

  @Column()
  @Index()
  vendorId: string;

  @ManyToOne(() => VendorProfileEntity, (vendor) => vendor.id)
  @JoinColumn({ name: "vendorId" })
  vendor: VendorProfileEntity;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: "varchar",
    default: VendorOrderStatusEnum.PENDING,
  })
  status: VendorOrderStatusEnum;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.vendorOrder, {
    cascade: true,
  })
  orderItems: Relation<OrderItemEntity[]>;
}
