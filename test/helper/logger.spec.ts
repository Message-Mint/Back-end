import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService, LogLevel } from '../../src/Helpers/Logger/logger-service';
import { Request, Response } from 'express';
import * as winston from 'winston';

describe('LoggerService', () => {
    let loggerService: LoggerService;
    let configService: ConfigService;

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoggerService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        loggerService = module.get<LoggerService>(LoggerService);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(loggerService).toBeDefined();
    });

    describe('use middleware', () => {
        it('should call next() in production environment', () => {
            mockConfigService.get.mockReturnValue('production');
            const next = jest.fn();
            loggerService.use({} as Request, {} as Response, next);
            expect(next).toHaveBeenCalled();
        });

        it('should log HTTP request in non-production environment', () => {
            mockConfigService.get.mockReturnValue('development');
            const req = {
                method: 'GET',
                originalUrl: '/test',
                ip: '::1',
            } as unknown as Request;
            const res = {
                statusCode: 200,
                json: jest.fn(),
                on: jest.fn(),
            } as unknown as Response;
            const next = jest.fn();

            const logSpy = jest.spyOn(loggerService, 'logWithLevel');

            loggerService.use(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

            // Simulate response finish
            const finishCallback = (res.on as jest.Mock).mock.calls[0][1];
            finishCallback();

            expect(logSpy).toHaveBeenCalledWith(LogLevel.HTTP, expect.stringContaining('GET /test'));
        });
    });

    describe('logging methods', () => {
        it('should log messages with correct level', () => {
            const logSpy = jest.spyOn(loggerService, 'logWithLevel');

            loggerService.log('Info message');
            loggerService.error('Error message');
            loggerService.warn('Warning message');
            loggerService.debug('Debug message');
            loggerService.verbose('Verbose message');

            expect(logSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Info message', { context: undefined });
            expect(logSpy).toHaveBeenCalledWith(LogLevel.ERROR, 'Error message', { trace: undefined, context: undefined });
            expect(logSpy).toHaveBeenCalledWith(LogLevel.WARN, 'Warning message', { context: undefined });
            expect(logSpy).toHaveBeenCalledWith(LogLevel.DEBUG, 'Debug message', { context: undefined });
            expect(logSpy).toHaveBeenCalledWith(LogLevel.VERBOSE, 'Verbose message', { context: undefined });
        });
    });

    describe('logObject', () => {
        it('should log objects correctly', () => {
            const logSpy = jest.spyOn(loggerService, 'logWithLevel');
            const testObj = { key: 'value' };

            loggerService.logObject(testObj, 'Test Object');

            expect(logSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Test Object'));
            expect(logSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining(JSON.stringify(testObj, null, 2)));
        });
    });

    describe('startTimer and logPerformance', () => {
        it('should measure and log performance', () => {
            const logSpy = jest.spyOn(loggerService, 'logWithLevel');

            const result = loggerService.logPerformance('Test Operation', () => {
                // Simulate some work
                for (let i = 0; i < 1000000; i++) { }
                return 'result';
            });

            expect(result).toBe('result');
            expect(logSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining("Timer 'Test Operation' took"));
        });
    });

    describe('createChildLogger', () => {
        it('should create a child logger', () => {
            const childSpy = jest.spyOn(winston.Logger.prototype, 'child');
            const options = { requestId: '123' };

            loggerService.createChildLogger(options);

            expect(childSpy).toHaveBeenCalledWith(options);
        });
    });
});
