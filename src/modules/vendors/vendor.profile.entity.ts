import { Column, Entity, JoinColumn, ManyToOne, OneToMany, type Relation } from "typeorm";

import { BaseEntity } from "../database/base-entity";
import { ProductEntity } from "../products/product.entity";
import { UsersEntity } from "../users/entity/users.entity";

import { VendorStatusEnum } from "./vendors.constants";

@Entity("VendorProfiles")
export class VendorProfileEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "vendor";
  }

  @Column({ unique: true })
  userId: string;

  @ManyToOne(() => UsersEntity, (user) => user.vendorProfiles)
  @JoinColumn({ name: "userId" })
  user: Relation<UsersEntity>;

  @Column()
  businessName: string;

  @Column({ unique: true })
  businessEmail: string;

  @Column()
  businessPhone: string;

  @Column()
  businessAddress: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: VendorStatusEnum,
    enumName: "vendor_status_enum",
    default: VendorStatusEnum.PENDING,
  })
  status: VendorStatusEnum;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ nullable: true, type: "timestamp" })
  approvedAt?: Date;

  @OneToMany(() => ProductEntity, (product) => product.vendor)
  products: ProductEntity[];
}
