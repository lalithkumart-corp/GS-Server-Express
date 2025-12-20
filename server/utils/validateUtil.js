const addUserParamValidation = (params) => {
    let errors = [];
    try {
        if(!params)
            throw 'FormData is Empty';
        if(!params.email)
            throw 'Email is Empty';
        if(params.gateWay == 'direct') {
            if(!params.password)
                throw 'Password is Empty';
            if(!params.confirmPassword)
                throw 'confirmPassword is Empty';
            if(params.password !== params.confirmPassword)
                throw 'Passwords mismatch';
        }
        if(!params.userName)
            throw 'Username is empty';
    } catch(e) {
        errors.push(e);
    } finally {
        return {
            STATUS: errors.length?0:1,
            ERRORS: errors
        }
    }
}
module.exports = {
    addUserParamValidation: addUserParamValidation
}