import { Column, Entity, Index } from "typeorm";

import { BaseEntity } from "../database/base-entity";

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
}
