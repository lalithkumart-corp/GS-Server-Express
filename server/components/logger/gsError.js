let _ = require('lodash');
class GsError extends Error {
    constructor(args) {
        super(args);
        if(args.className)
            this.className = args.className;
        if(args.methodName)
            this.methodName = args.methodName;
        if(args.identifier)
            this.identifier = args.identifier;
        if(args.cause)
            this.cause = args.cause;
        if(args.message)
            this.message = args.message;
        if(args.propertyName)
            this.propertyName = args.propertyName;
        if(args.propertyValue)
            this.propertyValue = args.propertyValue;
        this.errorType = 'DEFAULT';
    }
}

module.exports = GsError;
