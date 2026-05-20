import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommerceIdentityTables implements MigrationInterface {
  name = "CreateCommerceIdentityTables";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'USER', 'VENDOR')`);
    await queryRunner.query(
      `CREATE TYPE "vendor_status_enum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "Users" (
        "id" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying,
        "phoneNumber" character varying NOT NULL,
        "avatarUrl" character varying,
        "role" "user_role_enum" NOT NULL DEFAULT 'USER',
        "isEmailVerified" boolean NOT NULL DEFAULT false,
        "isDeleted" boolean NOT NULL DEFAULT false,
        CONSTRAINT "UQ_Users_email" UNIQUE ("email"),
        CONSTRAINT "PK_Users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "VendorProfiles" (
        "id" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" character varying NOT NULL,
        "businessName" character varying NOT NULL,
        "businessEmail" character varying NOT NULL,
        "businessPhone" character varying NOT NULL,
        "businessAddress" character varying NOT NULL,
        "logoUrl" character varying,
        "description" character varying,
        "status" "vendor_status_enum" NOT NULL DEFAULT 'PENDING',
        "approvedBy" character varying,
        CONSTRAINT "PK_VendorProfiles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "Addresses" (
        "id" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" character varying NOT NULL,
        "fullName" character varying NOT NULL,
        "phoneNumber" character varying NOT NULL,
        "addressLine1" character varying NOT NULL,
        "addressLine2" character varying,
        "city" character varying NOT NULL,
        "state" character varying NOT NULL,
        "country" character varying NOT NULL,
        "postalCode" character varying NOT NULL,
        CONSTRAINT "PK_Addresses_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "UserSessions" (
        "id" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" character varying NOT NULL,
        "refreshTokenHash" character varying NOT NULL,
        "ipAddress" character varying,
        "userAgent" character varying,
        "expiresAt" TIMESTAMP NOT NULL,
        "revokedAt" TIMESTAMP,
        CONSTRAINT "PK_UserSessions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "VendorProfiles" ADD CONSTRAINT "FK_VendorProfiles_userId" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Addresses" ADD CONSTRAINT "FK_Addresses_userId" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserSessions" ADD CONSTRAINT "FK_UserSessions_userId" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      INSERT INTO "Users" ("id", "email", "password", "firstName", "phoneNumber", "role", "isEmailVerified")
      VALUES (
        'user_01K7J000000000000000000001',
        'admin@gmail.com',
        'pbkdf2$120000$manual_admin_seed_salt$52cc21d05f4fe2787cf24231f0b451eac60316df6165aa556fc730941486c1c2af663224dee6c2aa5958da04d6ef562766e228403c8da53b2089af4e1a7ddfba',
        'Admin',
        '+919999999999',
        'ADMIN',
        true
      ) ON CONFLICT ("email") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "UserSessions"`);
    await queryRunner.query(`DROP TABLE "Addresses"`);
    await queryRunner.query(`DROP TABLE "VendorProfiles"`);
    await queryRunner.query(`DROP TABLE "Users"`);
    await queryRunner.query(`DROP TYPE "vendor_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
