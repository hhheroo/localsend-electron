export let logger: Logger = console;

export type Logger = Pick<Console, 'log' | 'warn' | 'error' | 'debug' | 'info'>;

export class LoggerManager {
  setLogger(console: Logger) {
    logger = console;
  }
}

export const loggerManager = new LoggerManager();
