import { Column, Entity, OneToMany } from "typeorm";

import { BaseEntity } from "../../database/base-entity";
import { UserSessionEntity } from "../../userSessions/userSession.entity";
import { VendorProfileEntity } from "../../vendors/vendor.profile.entity";
import { UserRoleEnum } from "../constants/enum";

import { AddressEntity } from "./address.entity";

@Entity("Users")
export class UsersEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "user";
  }

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({
    type: "enum",
    enum: UserRoleEnum,
    enumName: "user_role_enum",
    default: UserRoleEnum.USER,
  })
  role: UserRoleEnum;

  @Column({ default: false })
  isEmailVerified: boolean;

  @OneToMany(() => AddressEntity, (address) => address.user)
  addresses: AddressEntity[];

  @OneToMany(() => VendorProfileEntity, (vendorProfile) => vendorProfile.user)
  vendorProfiles: VendorProfileEntity[];

  @OneToMany(() => UserSessionEntity, (session) => session.user)
  sessions: UserSessionEntity[];
}
