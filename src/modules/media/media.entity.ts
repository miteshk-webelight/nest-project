import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from "typeorm";

import { BaseEntity } from "../database/base-entity";
import { ProductEntity } from "../products/product.entity";

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
  productId?: string;

  @ManyToOne(() => ProductEntity, (product) => product.media, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "productId" })
  product?: Relation<ProductEntity>;
}
