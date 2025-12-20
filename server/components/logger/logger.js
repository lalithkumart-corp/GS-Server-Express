import winston from 'winston';
console.log(__dirname);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'GS-Server' },
  transports: [
    new winston.transports.File({ filename: 'info.log', level: 'info',
        maxsize: 5242880, // 5MB (5 * 1024 * 1024 bytes)
      maxFiles: 5,      // Keep up to 5 rotated log files
      tailable: true,   
     }),
    new winston.transports.File({ filename: 'debug.log', level: 'debug',
        maxsize: 5242880, // 5MB (5 * 1024 * 1024 bytes)
      maxFiles: 5,      // Keep up to 5 rotated log files
      tailable: true,   
     }),
    new winston.transports.File({ filename: 'warn.log', level: 'warn',
        maxsize: 5242880, // 5MB (5 * 1024 * 1024 bytes)
      maxFiles: 5,      // Keep up to 5 rotated log files
      tailable: true,   
     }),
    new winston.transports.File({ filename: 'error.log', level: 'error',
        maxsize: 5242880, // 5MB (5 * 1024 * 1024 bytes)
      maxFiles: 5,      // Keep up to 5 rotated log files
      tailable: true,   
     }),
    new winston.transports.File({ filename: 'combined.log',
        maxsize: 5242880, // 5MB (5 * 1024 * 1024 bytes)
      maxFiles: 5,      // Keep up to 5 rotated log files
      tailable: true,   
     }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.prettyPrint(),
  }));
}

export default logger;
