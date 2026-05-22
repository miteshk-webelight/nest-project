import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1779433380329 implements MigrationInterface {
  name = "Migrations1779433380329";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "VendorProfiles" ADD "approvedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP CONSTRAINT "FK_c84b02381c101c41cb12214380c"`);
    await queryRunner.query(
      `ALTER TABLE "VendorProfiles" ADD CONSTRAINT "UQ_c84b02381c101c41cb12214380c" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "VendorProfiles" ADD CONSTRAINT "FK_c84b02381c101c41cb12214380c" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP CONSTRAINT "FK_c84b02381c101c41cb12214380c"`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP CONSTRAINT "UQ_c84b02381c101c41cb12214380c"`);
    await queryRunner.query(
      `ALTER TABLE "VendorProfiles" ADD CONSTRAINT "FK_c84b02381c101c41cb12214380c" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP COLUMN "approvedAt"`);
  }
}
