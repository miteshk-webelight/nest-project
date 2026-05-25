import { HttpException, InternalServerErrorException } from "@nestjs/common";

import { logger } from "src/services/logger.service";

export const handleServiceError = (error: unknown, context: string): never => {
  if (error instanceof HttpException) {
    logger.error(`${context}: ${error.message}`, error.stack);
    throw error;
  }

  logger.error(`${context}: Unexpected error`, error);

  throw new InternalServerErrorException("Something went wrong");
};
