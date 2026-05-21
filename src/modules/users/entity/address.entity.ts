import { Column, Entity, JoinColumn, ManyToOne, type Relation } from "typeorm";

import { BaseEntity } from "../../database/base-entity";

import { UsersEntity } from "./users.entity";

@Entity("Addresses")
export class AddressEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "addr";
  }

  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity, (user) => user.addresses)
  @JoinColumn({ name: "userId" })
  user: Relation<UsersEntity>;

  @Column()
  fullName: string;

  @Column()
  phoneNumber: string;

  @Column()
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column()
  postalCode: string;
}
