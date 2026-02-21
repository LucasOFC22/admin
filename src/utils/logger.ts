/**
 * Development utility for console logging
 * In production, these calls are stripped out
 */

const isDevelopment = false; // Logs desabilitados por segurança

export const devLog = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

// For production error tracking (always enabled)
export const prodLog = {
  error: (error: Error, context?: string) => {
    console.error(`[${context || 'Error'}]:`, error);
    // Here you could send to error tracking service like Sentry
  }
};