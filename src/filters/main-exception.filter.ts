import { Catch, ArgumentsHost, HttpException, HttpStatus, ExceptionFilter } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

import { captureException } from "@sentry/node";

import { ERROR_MESSAGES } from "../constants/messages.constants";
import { logger } from "../services/logger.service";

@Catch()
export class MainExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    // HANDLE ALL HTTP EXCEPTIONS
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      return httpAdapter.reply(ctx.getResponse(), response, statusCode);
    }

    // UNKNOWN ERRORS
    const error = exception as Error;

    logger.error(`EXCEPTION FILTER:: Exception: ${error.message}, stack: ${error.stack}`);

    captureException(error, {
      extra: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        stack: error.stack,
      },
    });

    return httpAdapter.reply(
      ctx.getResponse(),
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
