import { MigrationInterface, QueryRunner } from "typeorm";

export class Here1779775894380 implements MigrationInterface {
  name = "Here1779775894380";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "fileType"`);
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "module"`);
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "recordId"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "images"`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "mimeType" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "productId" character varying`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."product_status_enum"`);
    await queryRunner.query(`ALTER TABLE "Products" ADD "status" character varying NOT NULL DEFAULT 'DRAFT'`);
    await queryRunner.query(
      `ALTER TABLE "Media" ADD CONSTRAINT "FK_c52c9c550c893740404bc72e6b9" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Media" DROP CONSTRAINT "FK_c52c9c550c893740404bc72e6b9"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."product_status_enum" AS ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "Products" ADD "status" "public"."product_status_enum" NOT NULL DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "productId"`);
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "mimeType"`);
    await queryRunner.query(`ALTER TABLE "Products" ADD "images" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "recordId" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "module" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "fileType" character varying NOT NULL`);
  }
}
