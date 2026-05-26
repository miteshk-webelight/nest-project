import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMediaToGenericModuleMapping1779786206425 implements MigrationInterface {
  name = "RefactorMediaToGenericModuleMapping1779786206425";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Media" DROP CONSTRAINT "FK_c52c9c550c893740404bc72e6b9"`);
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "productId"`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "module" character varying`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "recordId" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "recordId"`);
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "module"`);
    await queryRunner.query(`ALTER TABLE "Media" ADD "productId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "Media" ADD CONSTRAINT "FK_c52c9c550c893740404bc72e6b9" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
