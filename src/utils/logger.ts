type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context?: string;
  constructor(context?: string) { this.context = context; }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const ts = new Date().toISOString();
    const prefix = this.context ? `[${ts}] [${level.toUpperCase()}] [${this.context}]` : `[${ts}] [${level.toUpperCase()}]`;
    const line = data && Object.keys(data).length > 0 ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
    switch (level) {
      case 'debug': console.debug(line); break;
      case 'info': console.info(line); break;
      case 'warn': console.warn(line); break;
      case 'error': console.error(line); break;
    }
  }

  debug(msg: string, data?: Record<string, unknown>) { this.log('debug', msg, data); }
  info(msg: string, data?: Record<string, unknown>) { this.log('info', msg, data); }
  warn(msg: string, data?: Record<string, unknown>) { this.log('warn', msg, data); }
  error(msg: string, data?: Record<string, unknown>) { this.log('error', msg, data); }
  child(ctx: string) { return new Logger(this.context ? `${this.context}:${ctx}` : ctx); }
}

export const logger = new Logger();
export function createLogger(context: string) { return new Logger(context); }
