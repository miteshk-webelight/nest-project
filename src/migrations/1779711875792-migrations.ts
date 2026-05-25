import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1779711875792 implements MigrationInterface {
  name = "Migrations1779711875792";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."product_status_enum" AS ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "Products" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "vendorId" character varying NOT NULL, "categoryId" character varying NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "sku" character varying NOT NULL, "description" character varying, "price" numeric(10,2) NOT NULL, "discountPrice" numeric(10,2), "images" text NOT NULL, "stock" integer NOT NULL DEFAULT '0', "status" "public"."product_status_enum" NOT NULL DEFAULT 'DRAFT', "isActive" boolean NOT NULL DEFAULT false, "approvedBy" character varying, "approvedAt" TIMESTAMP, CONSTRAINT "UQ_e67e2afd334d79fdb9de48e68b7" UNIQUE ("slug"), CONSTRAINT "PK_36a07cc432789830e7fb7b58a83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a3e936539dbf6b6801ed7ea1c1" ON "Products" ("vendorId", "sku") `);
    await queryRunner.query(
      `ALTER TABLE "Products" ADD CONSTRAINT "FK_8446e8174f97594f40ce603f973" FOREIGN KEY ("vendorId") REFERENCES "VendorProfiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Products" ADD CONSTRAINT "FK_85fdee89fa67fcdce66863def29" FOREIGN KEY ("categoryId") REFERENCES "Categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Products" ADD CONSTRAINT "FK_0e229ac4c7293e6988c3bbfbb33" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Products" DROP CONSTRAINT "FK_0e229ac4c7293e6988c3bbfbb33"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP CONSTRAINT "FK_85fdee89fa67fcdce66863def29"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP CONSTRAINT "FK_8446e8174f97594f40ce603f973"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a3e936539dbf6b6801ed7ea1c1"`);
    await queryRunner.query(`DROP TABLE "Products"`);
    await queryRunner.query(`DROP TYPE "public"."product_status_enum"`);
  }
}
