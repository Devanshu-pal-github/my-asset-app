
const logger = {
  debug: (message, context = {}) => {
    console.debug(message, context);
    // Optionally log to a service or file
    console.log(JSON.stringify({
      level: 'debug',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  info: (message, context = {}) => {
    console.info(message, context);
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  warning: (message, context = {}) => {
    console.warn(message, context);
    console.log(JSON.stringify({
      level: 'warning',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  error: (message, context = {}) => {
    console.error(message, context);
    console.log(JSON.stringify({
      level: 'error',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  }
};

export default logger;
