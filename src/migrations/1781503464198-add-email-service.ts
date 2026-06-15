import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailService1781503464198 implements MigrationInterface {
  name = "AddEmailService1781503464198";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "EmailProviders" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "provider" character varying NOT NULL, "encryptedConfig" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ea9beed75a4005dea6275b847c7" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "EmailProviders"`);
  }
}
