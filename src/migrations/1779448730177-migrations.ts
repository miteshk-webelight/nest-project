import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1779448730177 implements MigrationInterface {
  name = "Migrations1779448730177";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Categories" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdBy" character varying, "updatedBy" character varying, CONSTRAINT "UQ_9004ab74b495518b3dee4f4222a" UNIQUE ("name"), CONSTRAINT "UQ_4fc9f1db5657ede0bb675defb2d" UNIQUE ("slug"), CONSTRAINT "PK_537b5c00afe7427c4fc9434cd59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_9004ab74b495518b3dee4f4222" ON "Categories" ("name") `);
    await queryRunner.query(`CREATE INDEX "IDX_4fc9f1db5657ede0bb675defb2" ON "Categories" ("slug") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_4fc9f1db5657ede0bb675defb2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9004ab74b495518b3dee4f4222"`);
    await queryRunner.query(`DROP TABLE "Categories"`);
  }
}
