import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedOrderModule1780480317620 implements MigrationInterface {
  name = "AddedOrderModule1780480317620";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "OrderItems" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "vendorOrderId" character varying NOT NULL, "productId" character varying NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "totalPrice" numeric(10,2) NOT NULL, "skuSnapshot" character varying NOT NULL, "nameSnapshot" character varying NOT NULL, "slugSnapshot" character varying NOT NULL, CONSTRAINT "PK_567f75d7ff079b9ab3e6dd33708" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_7d3153db1d63fcd3784e086f47" ON "OrderItems" ("vendorOrderId") `);
    await queryRunner.query(`CREATE INDEX "IDX_f11d5c16edede51cea87a8c4bf" ON "OrderItems" ("productId") `);
    await queryRunner.query(
      `CREATE TABLE "Orders" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "userId" character varying NOT NULL, "addressId" character varying NOT NULL, "orderNumber" character varying NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "paymentMethod" character varying NOT NULL, "paymentStatus" character varying NOT NULL DEFAULT 'PENDING', "razorpayOrderId" character varying, "razorpayPaymentId" character varying, "status" character varying NOT NULL DEFAULT 'PENDING', "placedAt" TIMESTAMP, CONSTRAINT "UQ_69cbec8966ebb42d2fc88f5e37e" UNIQUE ("orderNumber"), CONSTRAINT "PK_ce8e3c4d56e47ff9c8189c26213" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_cc257418e0228f05a8d7dcc555" ON "Orders" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_51b731ee2aafcf4e06e960d363" ON "Orders" ("addressId") `);
    await queryRunner.query(`CREATE INDEX "IDX_69cbec8966ebb42d2fc88f5e37" ON "Orders" ("orderNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_d1c2eefabb64fd8c66d8dda924" ON "Orders" ("razorpayOrderId") `);
    await queryRunner.query(
      `CREATE TABLE "VendorOrders" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" character varying, "updatedBy" character varying, "orderId" character varying NOT NULL, "vendorId" character varying NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', CONSTRAINT "PK_c0d2cc1c0e64e2a1e4e0618ad76" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_47ae3ce9dc87369572c03eeef7" ON "VendorOrders" ("orderId") `);
    await queryRunner.query(`CREATE INDEX "IDX_ea338673722488eb4a5c7a231d" ON "VendorOrders" ("vendorId") `);
    await queryRunner.query(
      `ALTER TABLE "OrderItems" ADD CONSTRAINT "FK_7d3153db1d63fcd3784e086f471" FOREIGN KEY ("vendorOrderId") REFERENCES "VendorOrders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "OrderItems" ADD CONSTRAINT "FK_f11d5c16edede51cea87a8c4bfd" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Orders" ADD CONSTRAINT "FK_cc257418e0228f05a8d7dcc5553" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Orders" ADD CONSTRAINT "FK_51b731ee2aafcf4e06e960d3635" FOREIGN KEY ("addressId") REFERENCES "Addresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "VendorOrders" ADD CONSTRAINT "FK_47ae3ce9dc87369572c03eeef71" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "VendorOrders" DROP CONSTRAINT "FK_47ae3ce9dc87369572c03eeef71"`);
    await queryRunner.query(`ALTER TABLE "Orders" DROP CONSTRAINT "FK_51b731ee2aafcf4e06e960d3635"`);
    await queryRunner.query(`ALTER TABLE "Orders" DROP CONSTRAINT "FK_cc257418e0228f05a8d7dcc5553"`);
    await queryRunner.query(`ALTER TABLE "OrderItems" DROP CONSTRAINT "FK_f11d5c16edede51cea87a8c4bfd"`);
    await queryRunner.query(`ALTER TABLE "OrderItems" DROP CONSTRAINT "FK_7d3153db1d63fcd3784e086f471"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ea338673722488eb4a5c7a231d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_47ae3ce9dc87369572c03eeef7"`);
    await queryRunner.query(`DROP TABLE "VendorOrders"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1c2eefabb64fd8c66d8dda924"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_69cbec8966ebb42d2fc88f5e37"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_51b731ee2aafcf4e06e960d363"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cc257418e0228f05a8d7dcc555"`);
    await queryRunner.query(`DROP TABLE "Orders"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f11d5c16edede51cea87a8c4bf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7d3153db1d63fcd3784e086f47"`);
    await queryRunner.query(`DROP TABLE "OrderItems"`);
  }
}
