import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { ulid } from "ulid";

export class BaseEntity {
  protected prefix?: string;

  @PrimaryColumn()
  id: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  updatedBy?: string;

  @BeforeInsert()
  generateId(): void {
    this.id = this.prefix ? `${this.prefix}_${ulid()}` : ulid();
  }
}
