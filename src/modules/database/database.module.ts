import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { databaseConfig } from "../../config/database.config";

import { DatabaseService } from "./database.service";

@Global()
@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig)],
  exports: [TypeOrmModule, DatabaseService],
  providers: [DatabaseService],
})
export class DatabaseModule {}
