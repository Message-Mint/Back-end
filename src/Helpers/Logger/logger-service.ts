import { Injectable, Scope, ConsoleLogger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as clc from 'cli-color';
import { Request, Response, NextFunction } from 'express';

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    VERBOSE = 'verbose',
    DEBUG = 'debug',
    SILLY = 'silly',
}

interface LogMetadata {
    [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger implements NestMiddleware {
    private logger: winston.Logger;
    private readonly isProduction: boolean;

    constructor(private configService: ConfigService) {
        super();
        this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
        this.initializeLogger();
    }

    use(req: Request, res: Response, next: NextFunction) {
        if (this.isProduction) {
            return next();
        }

        const startTime = Date.now();
        const { method, originalUrl, ip } = req;

        // Capture the original res.json function
        const originalJson = res.json;
        let responseBody: any;

        // Override res.json to capture the response body
        res.json = function (body) {
            responseBody = body;
            return originalJson.call(this, body);
        };

        res.on('finish', () => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            const { statusCode } = res;

            // Log message in a beautiful format
            const logMessage = `
┌─────────────────────────────────────────────────────────────────────────
│ ${clc.bold(method)} ${clc.cyan(originalUrl)} ${this.colorizeStatus(statusCode)}
├─────────────────────────────────────────────────────────────────────────
│ IP: ${clc.yellow(ip.includes('::ffff:') ? ip.split('::ffff:')[1] : ip)}
│ Response Time: ${clc.green(`${responseTime}ms`)}
│ Timestamp: ${clc.blue(new Date().toISOString())}
├─────────────────────────────────────────────────────────────────────────
│ Response Body:
${this.formatResponseBody(responseBody)}
└─────────────────────────────────────────────────────────────────────────
`;

            this.logWithLevel(LogLevel.HTTP, logMessage);
        });

        next();
    }

    private colorizeStatus(status: number): string {
        if (status >= 500) return clc.red(`${status}`);
        if (status >= 400) return clc.yellow(`${status}`);
        if (status >= 300) return clc.cyan(`${status}`);
        if (status >= 200) return clc.green(`${status}`);
        return clc.white(`${status}`);
    }

    private formatResponseBody(body: any): string {
        if (!body) return '│ No response body';
        try {
            const formatted = JSON.stringify(body, null, 2)
                .split('\n')
                .map(line => `│ ${line}`)
                .join('\n');
            return formatted;
        } catch (error) {
            return `│ Unable to format response body: ${error.message}`;
        }
    }



    private initializeLogger() {
        const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');

        const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
            let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
            if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
        });

        this.logger = winston.createLogger({
            level: logLevel,
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
                customFormat
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    ),
                }),
            ],
        });
    }

    private formatMessages(message: string, context?: string): string {
        return context ? `[${context}] ${message}` : message;
    }

    private logToConsole(level: LogLevel, message: string, context?: string) {
        if (!this.isProduction) {
            const colorizedMessage = this.colorizeMessage(level, this.formatMessages(message, context));
            super.log(colorizedMessage);
        }
    }

    private colorizeMessage(level: LogLevel, message: string): string {
        switch (level) {
            case LogLevel.ERROR:
                return clc.red(message);
            case LogLevel.WARN:
                return clc.yellow(message);
            case LogLevel.INFO:
                return clc.blue(message);
            case LogLevel.HTTP:
                return clc.magenta(message);
            case LogLevel.VERBOSE:
                return clc.cyan(message);
            case LogLevel.DEBUG:
                return clc.green(message);
            case LogLevel.SILLY:
                return clc.white(message);
            default:
                return message;
        }
    }

    log(message: string, context?: string) {
        this.logWithLevel(LogLevel.INFO, message, { context });
    }

    error(message: string, trace?: string, context?: string) {
        this.logWithLevel(LogLevel.ERROR, message, { trace, context });
    }

    warn(message: string, context?: string) {
        this.logWithLevel(LogLevel.WARN, message, { context });
    }

    debug(message: string, context?: string) {
        this.logWithLevel(LogLevel.DEBUG, message, { context });
    }

    verbose(message: string, context?: string) {
        this.logWithLevel(LogLevel.VERBOSE, message, { context });
    }

    logWithLevel(level: LogLevel, message: string, metadata?: LogMetadata) {
        this.logToConsole(level, message, metadata?.context);
    }

    logObject(obj: any, message: string = 'Object Log', level: LogLevel = LogLevel.INFO) {
        const objString = JSON.stringify(obj, null, 2);
        this.logWithLevel(level, `${message}\n${objString}`);
    }

    startTimer(label: string): () => void {
        const start = process.hrtime();
        return () => {
            const end = process.hrtime(start);
            const duration = (end[0] * 1e9 + end[1]) / 1e6; // Convert to milliseconds
            this.logWithLevel(LogLevel.INFO, `Timer '${label}' took ${duration.toFixed(3)}ms`);
        };
    }

    logPerformance<T>(label: string, operation: () => T): T {
        const endTimer = this.startTimer(label);
        try {
            return operation();
        } finally {
            endTimer();
        }
    }

    createChildLogger(options: LogMetadata): winston.Logger {
        return this.logger.child(options);
    }
}
