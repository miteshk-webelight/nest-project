import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1779705550571 implements MigrationInterface {
  name = "Migrations1779705550571";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "UserSessions" ADD "createdBy" character varying`);
    await queryRunner.query(`ALTER TABLE "UserSessions" ADD "updatedBy" character varying`);
    await queryRunner.query(`ALTER TABLE "Addresses" ADD "createdBy" character varying`);
    await queryRunner.query(`ALTER TABLE "Addresses" ADD "updatedBy" character varying`);
    await queryRunner.query(`ALTER TABLE "Users" ADD "createdBy" character varying`);
    await queryRunner.query(`ALTER TABLE "Users" ADD "updatedBy" character varying`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" ADD "createdBy" character varying`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" ADD "updatedBy" character varying`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "createdBy" character varying`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "updatedBy" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "createdBy"`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP COLUMN "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP COLUMN "createdBy"`);
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "createdBy"`);
    await queryRunner.query(`ALTER TABLE "Addresses" DROP COLUMN "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "Addresses" DROP COLUMN "createdBy"`);
    await queryRunner.query(`ALTER TABLE "UserSessions" DROP COLUMN "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "UserSessions" DROP COLUMN "createdBy"`);
  }
}
