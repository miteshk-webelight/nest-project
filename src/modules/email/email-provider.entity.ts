import { Column, Entity } from "typeorm";

import { BaseEntity } from "../database/base-entity";

import { EmailProviderEnum } from "./email.constants";

@Entity("EmailProviders")
export class EmailProviderEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "email_provider";
  }

  @Column({
    type: "varchar",
  })
  provider: EmailProviderEnum;

  @Column({ type: "text" })
  encryptedConfig: string;

  @Column({ default: true })
  isActive: boolean;
}
