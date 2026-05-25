import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { databaseConfig } from "../../config/database.config";

import { DatabaseService } from "./database.service";
import { AuditSubscriber } from "./subscribers/audit.subscriber";

@Global()
@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig)],
  exports: [TypeOrmModule, DatabaseService],
  providers: [DatabaseService, AuditSubscriber],
})
export class DatabaseModule {}
