import { Column, Entity, Index } from "typeorm";

import { BaseEntity } from "../database/base-entity";

@Entity("Media")
@Index(["filePath"], { unique: true })
export class MediaEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "med";
  }

  @Column()
  filename: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  filePath: string;

  @Column({ nullable: true })
  module?: string;

  @Column({ nullable: true })
  recordId?: string;
}
