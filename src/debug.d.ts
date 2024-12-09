export declare enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
}
declare class DebugService {
    private level;
    configure(level: LogLevel): void;
    private shouldLog;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
}
export declare const debugService: DebugService;
export {};
