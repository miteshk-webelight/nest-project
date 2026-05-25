import { Column, Entity, Index, OneToMany } from "typeorm";

import { BaseEntity } from "../database/base-entity";
import { ProductEntity } from "../products/product.entity";

@Entity("Categories")
export class CategoryEntity extends BaseEntity {
  constructor() {
    super();
    this.prefix = "category";
  }

  @Column({ unique: true })
  @Index()
  name: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ProductEntity, (product) => product.category)
  products: ProductEntity[];
}
