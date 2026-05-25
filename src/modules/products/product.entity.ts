import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from "typeorm";

import { CategoryEntity } from "../categories/category.entity";
import { BaseEntity } from "../database/base-entity";
import { UsersEntity } from "../users/entity/users.entity";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";

import { ProductStatusEnum } from "./products.constants";

@Entity("Products")
@Index(["vendorId", "sku"], { unique: true })
export class ProductEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "product";
  }

  @Column()
  vendorId: string;

  @ManyToOne(() => VendorProfileEntity, (vendor) => vendor.products)
  @JoinColumn({ name: "vendorId" })
  vendor: Relation<VendorProfileEntity>;

  @Column()
  categoryId: string;

  @ManyToOne(() => CategoryEntity, (category) => category.products)
  @JoinColumn({ name: "categoryId" })
  category: Relation<CategoryEntity>;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  sku: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  discountPrice?: number;

  @Column({ type: "simple-array" })
  images: string[];

  @Column({ default: 0 })
  stock: number;

  @Column({
    type: "enum",
    enum: ProductStatusEnum,
    enumName: "product_status_enum",
    default: ProductStatusEnum.DRAFT,
  })
  status: ProductStatusEnum;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  approvedBy?: string;

  @ManyToOne(() => UsersEntity)
  @JoinColumn({ name: "approvedBy" })
  approver?: Relation<UsersEntity>;

  @Column({ nullable: true, type: "timestamp" })
  approvedAt?: Date;
}
