const logger = {
    debug: (message, context = {}) => {
      console.debug(JSON.stringify({ level: 'debug', message, context, timestamp: new Date().toISOString() }));
    },
    info: (message, context = {}) => {
      console.info(JSON.stringify({ level: 'info', message, context, timestamp: new Date().toISOString() }));
    },
    error: (message, context = {}) => {
      console.error(JSON.stringify({ level: 'error', message, context, timestamp: new Date().toISOString() }));
    },
  };
  
  export default logger;