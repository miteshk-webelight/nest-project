/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { appConfig } from "src/config/app.config";
import { logger } from "src/services/logger.service";

import { WorkersModule } from "./modules/workers/workers.module";

async function createNestApp() {
  return NestFactory.create<NestExpressApplication>(WorkersModule, {
    rawBody: true,
  });
}

async function bootstrap() {
  const app = await createNestApp();

  const port = appConfig.workerPort;
  await app.listen(port, () => {
    logger.info(`🚀 Worker is listening on port: ${port}`);
  });
}

bootstrap().catch((error) => {
  logger.error(error);
});
