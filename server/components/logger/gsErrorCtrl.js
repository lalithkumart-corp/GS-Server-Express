let GsError = require('./gsError');
// let GsValidation = require('./gsValidationError');

class GsErrorCtrl extends Error {
    constructor(args) {
        //super(args);
    }

    static create(args, errType = 'default') {
        args = GsErrorCtrl.parseIncomingArgs(args);
    
        let errInstance;
        // if(errType == 'validation')
        //     errInstance = new GsValidation(args);
        // else if(args.cause && args.cause.constructor.name == 'GsValidation')
        //     errInstance = new GsValidation(args);
        // else
            errInstance = new GsError(args);
        return errInstance;
    }

    static parseIncomingArgs(args) {
        if(typeof args == 'string') // args == string
            args = {cause: new Error(args), message: ''};
        else if(typeof args == 'object') {
            if(args.constructor.name == "Error") // args == Error
                args = {cause: args, message: ''};
            else if(args.constructor.name == 'Object') { //  args == Object
                if(typeof args.cause == 'string' || typeof args.cause == 'number' || typeof args.cause == 'boolean') { // args.cause == string
                    args.cause = new Error(args.cause);
                } else if(typeof args.cause == 'object') {
                    if(args.cause.constructor.name == 'Object') // args.cause == Object
                        args.cause = new Error(JSON.stringify(args.cause));
                    else if(args.cause.constructor.name == 'Array') // args.cause == Array
                        args.cause = new Error(JSON.stringify(args.cause));
                }
            } else if(args.constructor.name == 'Array') {
                console.log('TODO');
            }
            if(args.appendChildMsg)
                args.message = (args.message || '') + args.cause.message;
        }
        return args;
    }
}

module.exports = GsErrorCtrl;

/** TEST case
 
let GsErrorCtrl = require('./components/logger/gsErrorCtrl');
let logger = app.get('logger');

const testLogger = () => {
  try {
    childMeth();  
    logger.error({className: 'Server', methodName: 'Start', cause: new Error('not found'), message: 'Some error'});
  } catch(e) {
    logger.error({className: 'Server', methodName: 'Start2', cause: e, message: 'Some error'});
  }
}
const childMeth = () => {
  try {
    childMeth2();
  } catch(e) {
    throw e;
  }
}

const childMeth2 = () => {
  let yy = GsErrorCtrl.create({className: 'server', cause:'Hello world', message: 'yy1 man'}, 'validation');
  let yy2 = GsErrorCtrl.create({className: 'server', cause: new Error('Child meth2'), message: 'yy2 man' });
  let yy3 = GsErrorCtrl.create({className: 'server', cause: {a: 1} , message: 'yy3 man'});
  let yy4 = GsErrorCtrl.create({className: 'server', cause: yy, message: 'yy4 man' });
  let yy5 = GsErrorCtrl.create({className: 'server', cause: yy2, message: 'yy5 man' });
  let yy6 = GsErrorCtrl.create({className: 'server', cause: yy3, message: 'yy6 man' });
  let yy7 = GsErrorCtrl.create({className: 'server', cause: yy5, message: 'yy7 man', appendChildMsg: true });
  let yy8 = GsErrorCtrl.create({className: 'server', cause: yy7, message: 'yy8 man', appendChildMsg: true });
  logger.error(yy);
  logger.error(yy2);
  logger.error(yy3);
  logger.error(yy4);
  logger.error(yy5);
  logger.error(yy6);
  logger.error(yy7);
  logger.error(yy8);
  throw new Error('child meth2');
}
 */