import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1779341088178 implements MigrationInterface {
  name = "Migrations1779341088178";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Users" RENAME COLUMN "isDeleted" TO "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "UserSessions" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "Addresses" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "Users" ADD "deletedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "Users" ADD "deletedAt" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "Addresses" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "UserSessions" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "Users" RENAME COLUMN "deletedAt" TO "isDeleted"`);
  }
}
