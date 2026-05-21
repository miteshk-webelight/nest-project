import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1779340767452 implements MigrationInterface {
  name = "Migrations1779340767452";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "UserSessions" DROP CONSTRAINT "FK_UserSessions_userId"`);
    await queryRunner.query(`ALTER TABLE "Addresses" DROP CONSTRAINT "FK_Addresses_userId"`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP CONSTRAINT "FK_VendorProfiles_userId"`);
    await queryRunner.query(
      `CREATE TABLE "Media" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "filename" character varying NOT NULL, "fileType" character varying NOT NULL, "size" integer NOT NULL, "filePath" character varying NOT NULL, "module" character varying NOT NULL, "recordId" character varying NOT NULL, "deletedAt" TIMESTAMP, CONSTRAINT "PK_d6faa9c3e688a5d2b80d9bfdeb6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_be3f2cc2faecba8f8006f99c7a" ON "Media" ("filePath") `);
    await queryRunner.query(
      `ALTER TABLE "VendorProfiles" ADD CONSTRAINT "UQ_4b41409d07751cdd47cefd6435b" UNIQUE ("businessEmail")`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserSessions" ADD CONSTRAINT "FK_2a9651cb9d358458955e7baf59a" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Addresses" ADD CONSTRAINT "FK_cc5512a08524474323a4fac2728" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "VendorProfiles" ADD CONSTRAINT "FK_c84b02381c101c41cb12214380c" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP CONSTRAINT "FK_c84b02381c101c41cb12214380c"`);
    await queryRunner.query(`ALTER TABLE "Addresses" DROP CONSTRAINT "FK_cc5512a08524474323a4fac2728"`);
    await queryRunner.query(`ALTER TABLE "UserSessions" DROP CONSTRAINT "FK_2a9651cb9d358458955e7baf59a"`);
    await queryRunner.query(`ALTER TABLE "VendorProfiles" DROP CONSTRAINT "UQ_4b41409d07751cdd47cefd6435b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_be3f2cc2faecba8f8006f99c7a"`);
    await queryRunner.query(`DROP TABLE "Media"`);
    await queryRunner.query(
      `ALTER TABLE "VendorProfiles" ADD CONSTRAINT "FK_VendorProfiles_userId" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Addresses" ADD CONSTRAINT "FK_Addresses_userId" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserSessions" ADD CONSTRAINT "FK_UserSessions_userId" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
