/**
 * Renderer process logger utility
 * Outputs to both console and sends to main process via IPC
 */

type LogFn = (...args: unknown[]) => void

interface Logger {
  log: LogFn
  info: LogFn
  warn: LogFn
  error: LogFn
  debug: LogFn
}

// Create logger that outputs to both console and IPC
function createLogger(level: keyof Logger): LogFn {
  return (...args: unknown[]) => {
    // Output to browser console
    console[level](...args)
    // Send to main process
    window.electronAPI?.logger?.[level](...args)
  }
}

// Export logger methods
export const logger: Logger = {
  log: createLogger('log'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
  debug: createLogger('debug'),
}
