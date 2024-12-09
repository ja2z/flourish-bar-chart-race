// debug.ts
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

class DebugService {
  private level: LogLevel = LogLevel.NONE;

  configure(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  error(...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error('[ERROR]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn('[WARN]', ...args);
    }
  }

  info(...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info('[INFO]', ...args);
    }
  }

  debug(...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log('[DEBUG]', ...args);
    }
  }
}

export const debugService = new DebugService();