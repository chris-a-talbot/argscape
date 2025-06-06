/**
 * Centralized logging utility for frontend application
 * Provides structured logging with levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  component?: string;
  action?: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const component = context?.component ? `[${context.component}]` : '';
    const action = context?.action ? `(${context.action})` : '';
    
    return `[${timestamp}] ${level} ${component}${action} ${message}`;
  }

  private logToConsole(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const levelName = LogLevel[level];
    const formattedMessage = this.formatMessage(levelName, message, context);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, context?.data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, context?.data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, context?.data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, error || context?.error, context?.data);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.logToConsole(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.logToConsole(LogLevel.INFO, message, context);
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.logToConsole(LogLevel.WARN, message, context);
    }
  }

  error(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.logToConsole(LogLevel.ERROR, message, context, context?.error);
    }
  }

  // Convenience methods for common scenarios
  apiCall(endpoint: string, method: string = 'GET', data?: unknown) {
    this.debug(`API ${method} ${endpoint}`, {
      action: 'api-call',
      data: { endpoint, method, payload: data }
    });
  }

  apiSuccess(endpoint: string, method: string = 'GET', response?: unknown) {
    this.info(`API ${method} ${endpoint} succeeded`, {
      action: 'api-success',
      data: { endpoint, method, response }
    });
  }

  apiError(endpoint: string, error: Error, method: string = 'GET') {
    this.error(`API ${method} ${endpoint} failed`, {
      action: 'api-error',
      error,
      data: { endpoint, method }
    });
  }

  componentMount(componentName: string, props?: unknown) {
    this.debug(`${componentName} mounted`, {
      component: componentName,
      action: 'mount',
      data: props
    });
  }

  componentUnmount(componentName: string) {
    this.debug(`${componentName} unmounted`, {
      component: componentName,
      action: 'unmount'
    });
  }

  userAction(action: string, data?: unknown, component?: string) {
    this.info(`User action: ${action}`, {
      component,
      action: 'user-action',
      data
    });
  }

  dataProcessing(operation: string, component?: string, inputSize?: number, outputSize?: number) {
    this.debug(`Data processing: ${operation}`, {
      component,
      action: 'data-processing',
      data: { operation, inputSize, outputSize }
    });
  }

  navigation(from: string, to: string) {
    this.info(`Navigation: ${from} → ${to}`, {
      action: 'navigation',
      data: { from, to }
    });
  }

  performance(operation: string, duration: number, component?: string) {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      component,
      action: 'performance',
      data: { operation, duration }
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions for common use cases
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, context?: LogContext) => logger.error(message, context),
  
  // Convenience methods
  api: {
    call: (endpoint: string, method?: string, data?: unknown) => logger.apiCall(endpoint, method, data),
    success: (endpoint: string, method?: string, response?: unknown) => logger.apiSuccess(endpoint, method, response),
    error: (endpoint: string, error: Error, method?: string) => logger.apiError(endpoint, error, method),
  },
  
  component: {
    mount: (name: string, props?: unknown) => logger.componentMount(name, props),
    unmount: (name: string) => logger.componentUnmount(name),
  },
  
  user: {
    action: (action: string, data?: unknown, component?: string) => logger.userAction(action, data, component),
  },
  
  data: {
    processing: (operation: string, component?: string, inputSize?: number, outputSize?: number) => 
      logger.dataProcessing(operation, component, inputSize, outputSize),
  },
  
  nav: (from: string, to: string) => logger.navigation(from, to),
  perf: (operation: string, duration: number, component?: string) => logger.performance(operation, duration, component),
}; 