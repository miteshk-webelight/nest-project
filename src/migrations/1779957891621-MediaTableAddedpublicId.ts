import { MigrationInterface, QueryRunner } from "typeorm";

export class MediaTableAddedpublicId1779957891621 implements MigrationInterface {
  name = "MediaTableAddedpublicId1779957891621";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Media" ADD "publicId" character varying NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Media" DROP COLUMN "publicId"`);
  }
}
