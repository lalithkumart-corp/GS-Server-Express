var path = require('path');
var util = require('util');
var utils = require('../../utils/commonUtils');
const winston = require('winston');

function consoleLogHandler(logger) {
    var log_stdout = process.stdout;
    let consLogFolder = utils.constructConsoleLogFolder();
    console.log('Console Log Folder', consLogFolder);

    // Create winston loggers for console out and error
    const outLogger = winston.createLogger({
        level: 'info',
        format: winston.format.simple(),
        transports: [
            new winston.transports.File({
                filename: path.resolve(consLogFolder + '/console_out.log'),
                maxsize: 5242880, // 5MB
                maxFiles: 10,
                tailable: true
            })
        ]
    });
    const errLogger = winston.createLogger({
        level: 'error',
        format: winston.format.simple(),
        transports: [
            new winston.transports.File({
                filename: path.resolve(consLogFolder + '/console_error.log'),
                maxsize: 5242880, // 5MB
                maxFiles: 10,
                tailable: true
            })
        ]
    });

    console.log = function() {
      try {
        let dt = new Date().toString();
        let ct = dt.substr(0, dt.indexOf(' GMT'));
        try {
          log_stdout.write(`${ct} ` + util.format.apply(null, arguments) + '\n');
        } catch(e) {
          logger.debug('Error in piping console log to std out');
        }
        try {
          outLogger.info(`${ct} ` + util.format.apply(null, arguments));
        } catch(e) {
          logger.debug('Error in piping console log to out file');
        }
      } catch(e) {
        logger.debug('Error in piping console log to file');
      }
    };

    console.error = function() {
      try {
        let dt = new Date().toString();
        let ct = dt.substr(0, dt.indexOf(' GMT'));
        try {
          log_stdout.write(`${ct} ` + util.format.apply(null, arguments) + '\n');
        } catch(e) {
          logger.debug('Error in piping console error to std out');
        }
        try {
          errLogger.error(`${ct} ` + util.format.apply(null, arguments));
        } catch(e) {
          logger.debug('Error in piping console error to out file');
        }
      } catch(e) {
        logger.debug('Error in piping console error to file');
      }
    }
}

module.exports = {
  consoleLogHandler
}
