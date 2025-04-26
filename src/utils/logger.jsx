const logger = {
  debug: (message, context = {}) => {
    console.debug(`[DEBUG] ${message}`, context);
    console.log(JSON.stringify({
      level: 'debug',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  info: (message, context = {}) => {
    console.info(`[INFO] ${message}`, context);
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  warn: (message, context = {}) => {
    console.warn(`[WARN] ${message}`, context);
    console.log(JSON.stringify({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  error: (message, context = {}) => {
    console.error(`[ERROR] ${message}`, context);
    console.log(JSON.stringify({
      level: 'error',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  }
};

export default logger;