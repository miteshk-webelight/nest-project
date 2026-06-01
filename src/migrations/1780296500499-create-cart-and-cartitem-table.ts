import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCartAndCartitemTable1780296500499 implements MigrationInterface {
  name = "CreateCartAndCartitemTable1780296500499";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Carts" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "userId" character varying, "guestToken" character varying, CONSTRAINT "PK_6088efe237f1e59de8fff0032d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8c26b3de964f6e854a22b7e329" ON "Carts" ("userId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_002187458e632c06949916364d" ON "Carts" ("guestToken") `);
    await queryRunner.query(
      `CREATE TABLE "CartItems" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "cartId" character varying NOT NULL, "productId" character varying NOT NULL, "quantity" integer NOT NULL, "priceSnapshot" numeric(10,2) NOT NULL, "discountPriceSnapshot" numeric(10,2), "slugSnapshot" character varying NOT NULL, "nameSnapshot" character varying NOT NULL, CONSTRAINT "PK_3bd084e7aaedba88bd7a0973561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8e89894b6172d8a5c210ce8de0" ON "CartItems" ("cartId", "productId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "Carts" ADD CONSTRAINT "FK_8c26b3de964f6e854a22b7e3293" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "CartItems" ADD CONSTRAINT "FK_8c6d0eaa716d64605b55f8d9476" FOREIGN KEY ("cartId") REFERENCES "Carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "CartItems" ADD CONSTRAINT "FK_ae6de72ec1a62435eb3eee289c0" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "CartItems" DROP CONSTRAINT "FK_ae6de72ec1a62435eb3eee289c0"`);
    await queryRunner.query(`ALTER TABLE "CartItems" DROP CONSTRAINT "FK_8c6d0eaa716d64605b55f8d9476"`);
    await queryRunner.query(`ALTER TABLE "Carts" DROP CONSTRAINT "FK_8c26b3de964f6e854a22b7e3293"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8e89894b6172d8a5c210ce8de0"`);
    await queryRunner.query(`DROP TABLE "CartItems"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_002187458e632c06949916364d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8c26b3de964f6e854a22b7e329"`);
    await queryRunner.query(`DROP TABLE "Carts"`);
  }
}
