import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";

import { DataSource, EntityTarget, ObjectLiteral, QueryRunner, Repository } from "typeorm";

import { handleServiceError } from "src/utils/service-error-handler";

@Injectable()
export class DatabaseService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getRepository<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): Repository<Entity> {
    return this.dataSource.getRepository(entity);
  }

  async createQueryRunner(): Promise<QueryRunner> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    return queryRunner;
  }

  async commitTransaction(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();
  }

  async rollbackTransaction(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.rollbackTransaction();
  }

  async releaseQueryRunner(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.release();
  }

  async executeTransaction<T>({
    operation,
    errorContext = "Unknown Error",
  }: {
    operation: (queryRunner: QueryRunner) => Promise<T>;
    errorContext?: string;
  }): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);

      if (queryRunner.isTransactionActive) {
        await queryRunner.commitTransaction();
      }

      return result;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      handleServiceError(error, errorContext);

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
