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

  @Column({ type: "varchar", nullable: true })
  module?: string | null;

  @Column({ type: "varchar", nullable: true })
  recordId?: string | null;

  @Column({ type: "varchar", nullable: true })
  publicId?: string | null;
}
