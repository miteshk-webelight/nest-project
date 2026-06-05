import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Relation } from "typeorm";

import { BaseEntity } from "../../database/base-entity";
import { AddressEntity } from "../../users/entity/address.entity";
import { UsersEntity } from "../../users/entity/users.entity";
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum } from "../orders.enums";

import { VendorOrderEntity } from "./vendor-order.entity";

@Entity("Orders")
export class OrderEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "order";
  }

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => UsersEntity, (user) => user.id)
  @JoinColumn({ name: "userId" })
  user: Relation<UsersEntity>;

  @Column()
  @Index()
  addressId: string;

  @ManyToOne(() => AddressEntity, (address) => address.id)
  @JoinColumn({ name: "addressId" })
  address: Relation<AddressEntity>;

  @Column({ unique: true })
  @Index()
  orderNumber: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: "varchar",
  })
  paymentMethod: PaymentMethodEnum;

  @Column({
    type: "varchar",
    default: PaymentStatusEnum.PENDING,
  })
  paymentStatus: PaymentStatusEnum;

  @Column({ nullable: true, type: "varchar" })
  @Index()
  razorpayOrderId?: string | null;

  @Column({ nullable: true, type: "varchar" })
  razorpayPaymentId?: string | null;

  @Column({
    type: "varchar",
    default: OrderStatusEnum.PENDING,
  })
  status: OrderStatusEnum;

  @Column({ nullable: true, type: "timestamp" })
  placedAt?: Date;

  @OneToMany(() => VendorOrderEntity, (vendorOrder) => vendorOrder.order, {
    cascade: true,
  })
  vendorOrders: Relation<VendorOrderEntity[]>;
}
