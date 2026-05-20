import { Logger } from "@nestjs/common";

import type { Logger as TypeOrmLogger } from "typeorm";

export class CustomQueryLogger implements TypeOrmLogger {
  private readonly logger = new Logger(CustomQueryLogger.name);

  logQuery(query: string, parameters?: AnyType[]): void {
    const count = Reflect.getMetadata("queryCount", global) ?? 0;
    Reflect.defineMetadata("queryCount", count + 1, global);

    this.logger.debug(`Executed Query: ${query}`);
    if (parameters) {
      this.logger.debug(`Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQueryError(error: string, query: string, parameters?: AnyType[]): void {
    this.logger.error(`Query Failed: ${query}`);
    this.logger.error(`Error: ${error}`);
    if (parameters) {
      this.logger.error(`Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQuerySlow(time: number, query: string, parameters?: AnyType[]): void {
    this.logger.warn(`Slow Query Detected: ${query}`);
    this.logger.warn(`Execution Time: ${time}ms`);
    if (parameters) {
      this.logger.warn(`Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logSchemaBuild(message: string): void {
    this.logger.log(`Schema Build: ${message}`);
  }

  logMigration(message: string): void {
    this.logger.log(`Migration: ${message}`);
  }

  log(level: "log" | "info" | "warn", message: AnyType): void {
    switch (level) {
      case "log":
        this.logger.log(message);
        break;
      case "info":
        this.logger.debug(message);
        break;
      case "warn":
        this.logger.warn(message);
        break;
    }
  }
}
