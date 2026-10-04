import config from '../config/index.js';

const logger = (req, res, next) => {
  if (config.env === 'development') {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
      const resetColor = '\x1b[0m';
      
      console.log(
        `${statusColor}${req.method}${resetColor} ${req.originalUrl} - ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`
      );
    });
  }
  
  next();
};

export default logger;
