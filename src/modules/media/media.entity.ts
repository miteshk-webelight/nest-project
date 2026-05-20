import { Column, Entity, DeleteDateColumn, Index } from "typeorm";

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
  fileType: string;

  @Column()
  size: number;

  @Column()
  filePath: string;

  @Column()
  module: string;

  @Column()
  recordId: string;

  @DeleteDateColumn()
  deletedAt: Date;
}
