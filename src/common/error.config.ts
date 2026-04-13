import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = {
        statusCode: status,
        message: 'Validation Error',
        errors: exception.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    } else {
      // For any other unknown exceptions, log them with stack trace
      this.logger.error(`${request.method} ${request.url} - ${exception.message}`, {
        stack: exception.stack,
        context: 'GlobalErrorFilter',
      });
      message = exception.message || 'Internal Server Error';
    }

    // Clean up message format for consistency
    const errorResponse =
      typeof message === 'object' && message !== null
        ? message
        : { statusCode: status, message };

    response.status(status).json(errorResponse);
  }
}