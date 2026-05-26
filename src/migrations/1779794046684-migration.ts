import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779794046684 implements MigrationInterface {
  name = "Migration1779794046684";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Products" DROP CONSTRAINT "FK_0e229ac4c7293e6988c3bbfbb33"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "approvedBy"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "approvedAt"`);
    await queryRunner.query(`ALTER TABLE "Products" ADD "reviewedBy" character varying`);
    await queryRunner.query(`ALTER TABLE "Products" ADD "reviewedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "Products" ADD CONSTRAINT "FK_95586f9c03c5a8ae2592dec86f9" FOREIGN KEY ("reviewedBy") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Products" DROP CONSTRAINT "FK_95586f9c03c5a8ae2592dec86f9"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "reviewedAt"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "reviewedBy"`);
    await queryRunner.query(`ALTER TABLE "Products" ADD "approvedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "Products" ADD "approvedBy" character varying`);
    await queryRunner.query(
      `ALTER TABLE "Products" ADD CONSTRAINT "FK_0e229ac4c7293e6988c3bbfbb33" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
