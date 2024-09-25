import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

// Global error filter
@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = exception.getStatus();
        const message = exception.getResponse() as string | { message: string; data?: any };

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: typeof message === 'string' ? message : message.message,
            data: typeof message === 'object' ? message.data : undefined,
        };

        response.status(status).json(errorResponse);
    }
}

export class UserNotFoundException extends HttpException {
    constructor(theName: string = 'ID', userId?: string) {
        super(`User not found${userId ? ` with ${theName}: ${userId}` : ''}`, HttpStatus.NOT_FOUND);
    }
}

export class AlreadyExistsException extends HttpException {
    constructor(entity: string) {
        super(`${entity} already exists`, HttpStatus.CONFLICT);
    }
}

export class DefaultErrorException extends HttpException {
    constructor(message: string = 'Internal Error') {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export class SuccessException extends HttpException {
    constructor(message: string = 'Success', public readonly data?: any) {
        super({ message, data }, HttpStatus.OK);
    }

    getData(): any {
        return this.data;
    }
}

export class ValidationException extends HttpException {
    constructor(errors: string[]) {
        super({ message: 'Validation failed', errors }, HttpStatus.BAD_REQUEST);
    }
}

export class UnauthorizedException extends HttpException {
    constructor(message: string = 'Unauthorized access') {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}

export class ForbiddenException extends HttpException {
    constructor(message: string = 'Access forbidden') {
        super(message, HttpStatus.FORBIDDEN);
    }
}

export class NotFoundException extends HttpException {
    constructor(entity: string) {
        super(`${entity} not found`, HttpStatus.NOT_FOUND);
    }
}

export class BadRequestException extends HttpException {
    constructor(message: string) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

export class DatabaseException extends HttpException {
    constructor(message: string = 'Database operation failed') {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export class ExternalServiceException extends HttpException {
    constructor(service: string, message: string = 'External service error') {
        super(`${service}: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
    }
}