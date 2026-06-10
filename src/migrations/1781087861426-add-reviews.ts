import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviews1781087861426 implements MigrationInterface {
  name = "AddReviews1781087861426";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ReviewLikes" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "userId" character varying NOT NULL, "reviewId" character varying NOT NULL, CONSTRAINT "PK_1f6987f417a620ba9923434e694" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_654171cb159a7af1a8693b9ff1" ON "ReviewLikes" ("userId", "reviewId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "Reviews" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "userId" character varying NOT NULL, "orderItemId" character varying NOT NULL, "productId" character varying NOT NULL, "title" character varying NOT NULL, "comment" text NOT NULL, "rating" integer NOT NULL, "likesCount" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_5ae106da7bc18dc3731e48a8a94" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5d6ee5d009a2c0af49f6da025a" ON "Reviews" ("userId", "productId") `,
    );
    await queryRunner.query(`ALTER TABLE "Products" ADD "averageRating" numeric(3,2) NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "Products" ADD "reviewCount" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE "ReviewLikes" ADD CONSTRAINT "FK_c509394f9293781c25b4e9bf29b" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ReviewLikes" ADD CONSTRAINT "FK_524527bd4e520a58db133069a90" FOREIGN KEY ("reviewId") REFERENCES "Reviews"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Reviews" ADD CONSTRAINT "FK_03697b4cf2383ce44b9b0ac3fda" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Reviews" ADD CONSTRAINT "FK_e572ede7e5f478c27b02ef30af9" FOREIGN KEY ("orderItemId") REFERENCES "OrderItems"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Reviews" ADD CONSTRAINT "FK_8679c285008ea7ff66b93edc0ac" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Reviews" DROP CONSTRAINT "FK_8679c285008ea7ff66b93edc0ac"`);
    await queryRunner.query(`ALTER TABLE "Reviews" DROP CONSTRAINT "FK_e572ede7e5f478c27b02ef30af9"`);
    await queryRunner.query(`ALTER TABLE "Reviews" DROP CONSTRAINT "FK_03697b4cf2383ce44b9b0ac3fda"`);
    await queryRunner.query(`ALTER TABLE "ReviewLikes" DROP CONSTRAINT "FK_524527bd4e520a58db133069a90"`);
    await queryRunner.query(`ALTER TABLE "ReviewLikes" DROP CONSTRAINT "FK_c509394f9293781c25b4e9bf29b"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "reviewCount"`);
    await queryRunner.query(`ALTER TABLE "Products" DROP COLUMN "averageRating"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5d6ee5d009a2c0af49f6da025a"`);
    await queryRunner.query(`DROP TABLE "Reviews"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_654171cb159a7af1a8693b9ff1"`);
    await queryRunner.query(`DROP TABLE "ReviewLikes"`);
  }
}
