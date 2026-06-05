import { MigrationInterface, QueryRunner } from "typeorm";

export class JoinVendorId1780639194798 implements MigrationInterface {
  name = "JoinVendorId1780639194798";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VendorOrders" ADD CONSTRAINT "FK_ea338673722488eb4a5c7a231d7" FOREIGN KEY ("vendorId") REFERENCES "VendorProfiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "VendorOrders" DROP CONSTRAINT "FK_ea338673722488eb4a5c7a231d7"`);
  }
}
