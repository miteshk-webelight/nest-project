import { Column, Entity, JoinColumn, ManyToOne, type Relation } from "typeorm";

import { BaseEntity } from "../database/base-entity";
import { UsersEntity } from "../users/users.entity";

@Entity("UserSessions")
export class UserSessionEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "session";
  }

  @Column()
  userId!: string;

  @ManyToOne(() => UsersEntity, (user) => user.sessions)
  @JoinColumn({ name: "userId" })
  user!: Relation<UsersEntity>;

  @Column()
  refreshTokenHash!: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  revokedAt?: Date;
}
