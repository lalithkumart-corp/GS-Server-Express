'use strict';
import db from '../db/index.js';
import express from 'express';
import userService from '../services/user.service.js';

import { UserPreference } from './user-preferences.js';
import { ApplicationManagerCls, ApplicationManager } from './app-manager.js';
import { LoanBillTemplate } from './loan-bill-template.js';
import { JewelleryBillSettings } from './jewellery-bill-settings.js';
import { JewelleryTagSettings } from './jewellery-tag-settings.js';
import { StoreCls } from './store.js';
const { remoteMethod } = require('../routes/remoteMethod.js');

let addUserParamValidation = require('../utils/validateUtil').addUserParamValidation;
let utils = require('../utils/commonUtils');
// let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
// let logger = app.get('logger');
let sha256 = require('sha256');

const DUMMY_PWD = 'G1Rv1_S0fTwArE';

const router = express.Router();
export default router;

export class GsuserCls {
    constructor() {
        this.userService = new userService();
        this.appManager = new ApplicationManagerCls();
        this.store = new StoreCls();
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    loginUser(custom, cb) {
        this._loginUser(custom).then(
            (resp) => {
                return cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (error) => {
                console.log(error);
                return cb(error, null);
            }
        ).catch((err) => {
            console.log(err);
            return cb(err);
        });
    }

    async _loginUser(apiParams) {
        let session;
        try {
            // session = await GsuserCls._invokeBuiltInLogin({email: apiParams.email, password: apiParams.password||DUMMY_PWD});
            session = await this.userService.login(apiParams.email, apiParams.password || DUMMY_PWD);
            session = session.data;
            let userTblRow = await Gsuser._find(session.userId);

            session.ownerId = userTblRow.ownerId;
            session.username = userTblRow.username;
            session.email = userTblRow.email;
            let setupActionsStatus = await this.checkForAnyPendingActions(userTblRow.id, userTblRow.ownerId);
            let userPreferences = await UserPreference._fetchFromDB(userTblRow.ownerId || userTblRow.id);
            let status = await this.appManager.updateValidityTime(userTblRow.id, userTblRow.ownerId);
            // session.roleId = await app.models.GsRole.prototype.findUserRoleId(userTblRow.id);
            let otherStuffs = await this.fetchOtherPromiseStuffs(userTblRow.ownerId || userTblRow.id);
            let response = {
                session: session,
                userPreferences: userPreferences,
                applicationStatus: status,
                setupActionsStatus: setupActionsStatus,
                loanBillTemplateSettings: otherStuffs.loanBillTemplateSettings,
                jewelleryBillTemplateSettings: otherStuffs.jewelleryBillTemplateSettings,
                jewelleryTagTemplateSettings: otherStuffs.jewelleryTagTemplateSettings,
            }
            // TODO: Mig Refactor
            // GsuserCls.storeLoginActionDB({email: apiParams.email, status: true, userId: session.userId});
            return response;
        } catch(e) {
            console.log(e);
            // TODO: Mig Refactor
            // GsuserCls.storeLoginActionDB({email: apiParams.email, status: false, userId: session?session.userId:null});
            throw e;
        }
    }

    _invokeBuiltInLogin(apiParams) {
        return new Promise((resolve, reject) => {
            this.login(apiParams, (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    ssoLogin(apiParams, cb) {
        this._ssoLogin(apiParams).then(
            (resp) => {
                return cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (error) => {
                console.log(error);
                return cb(error, null);
            }
        ).catch((err) => {
            return cb(err);
        });
    }

    async _ssoLogin(apiParams) {
        try {
            let userObj = await utils.validateSSOAuthToken(apiParams.accessToken); // await GsuserCls.isValidUser(apiParams);
            if(!userObj)
                throw 'Invalid Token passed from UI';
            let resp = await this._loginUser({email: userObj.email});
            await this._insertSsoToken(apiParams.accessToken, resp.session.id);
            return resp;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    logoutApi(apiParams, cb) {
        this._logoutUser(apiParams.accessToken).then(
            (resp) => {
                return cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (error) => {
                console.log(error);
                return cb(error, null);
            }
        ).catch((err) => {
            console.log(err);
            return cb(null);
        });
    }

    _logoutUser(accessToken) {
        return new Promise((resolve, reject) => {
            // TODO: Logout handler
            // this.logout(accessToken, (err, res) => {
            //     if(err) {
            //         console.log(err);
            //         this.storeLogoutActionDB({status: false, accessToken});
            //         return resolve(null);
            //     } else {
            //         console.log(res);
            //         this.storeLogoutActionDB({status: true, accessToken});
            //         return resolve(true);
            //     }
            // });
            this.storeLogoutActionDB({status: true, accessToken});
        });
    }

    _findBySsoUID(ssoUID) {
        return new Promise((resolve, reject) => {
            this.findOne({where: {ssoUserId: ssoUID}}, (err, res) => {
                if(err)
                    return reject(err);
                else
                    return resolve(res);
            })
        });
    }

    _insertSsoToken(ssoToken, accessToken) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE AccessToken SET sso_token='${ssoToken}' WHERE id='${accessToken}'`;
            db.query(sql, (err, res) => {
                if(err) {
                    console.log(err);
                    return resolve(null);
                } else {
                    console.log(res);
                    return resolve(true);
                }
            });
        });
    }


    checkEmailExistance(apiParams, cb) {
        try {
            this.find({where:{ email: apiParams.email }}, (err, res)=> {
                if(err) {
                    cb(null, {STATUS: 'ERROR', ERR: err});
                } else {
                    if(res && res.length)
                        cb(null, {STATUS: 'SUCCESS', USER_EXISTS: 1, USER_EMAIL: res[0].email});
                    else
                        cb(null, {STATUS: 'SUCCESS', USER_EXISTS: 0});
                }
            });
        } catch(e) {
            console.log(e);
            cb(null, {STATUS: 'EXCEPTION', EXCEPTION: e});
        }
    }

    async signupNewCustomer(custom, cb) {
        try{
            let user = await this._insertUser(custom);
            // await this._insertRoleMapping(user, 2);
            await this._insertNewApplication(user);
            await this._insertNewStore(custom, user);
            let resp = await this._loginUser(custom);
            if(custom.isSsoUserSignup)
                await this._insertSsoToken(custom.accessToken, resp.session.id);
            return {STATUS: 'SUCCESS', RESP: resp};

            // return {STATUS: 'SUCCESS', MSG: 'New User Created Successfully!'};
        } catch(e) {
            console.log(e);
            return {STATUS: 'ERROR', ERROR: e};
        }
    }


    async addUser(apiParams, cb) {
        let errors = [];
        try {
            let validationRes = addUserParamValidation(apiParams.formData);
            if(validationRes.STATUS) {
                console.log('ADD user');
                let ownerUserId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                if(!ownerUserId) {
                    throw 'Owner User Id not found';
                } else {
                    let newUser = await this._insertUser({...apiParams.formData, ownerId: ownerUserId});
                    await this._insertRoleMapping(newUser, apiParams.formData.roleId);
                    console.log(newUser);
                }
            } else {
                errors.push(...validationRes.ERRORS);
                throw 'validation Errors';
            }

            return {
                STATUS: 'SUCCESS',
                MSG: "Successfully added the user"
            } 
        } catch(e) {
            console.log(e);
            if(typeof e == 'string')
                errors.push(e);
            else
                errors.push(e.message || e.msg || 'Exception occured');
            return {
                STATUS: 'ERROR',
                ERRORS: errors
            }
        }   
    }

    async fetchUserList(accessToken, cb) {
        try {
            let ownerUserId = await utils.getStoreOwnerUserId(accessToken);
            let usersList = await this._fetchList(ownerUserId);
            return {
                STATUS: 'success',
                USER_LIST: usersList
            }
        } catch(e) {
            console.log(e);
            return {
                STATUS: 'ERROR',
                ERROR: e,
                MSG: e.message || e.msg || 'Exception occured in fetching user List'
            }
        }
    }
    _insertUser(custom) {
        return new Promise( async (resolve, reject) => {
            let theParams = {
                username: custom.userName,
                ownerId: custom.ownerId || 0,
                email: custom.email,
                password: custom.password || DUMMY_PWD,
                phone: custom.phone,
                guardianName: custom.guardianName || '',
                gateWay: custom.gateWay || 'direct',
                ssoUserId: custom.ssoUserId || '',
            }
            let res = await this.userService.signup(theParams);
            return resolve(res);
        });
    };

    _insertRoleMapping(user, roleId) {
        return new Promise( (resolve, reject) => {
            let params = {
                principalType: "USER",
                principalId: user.id,
                roleId: roleId
            };
            GsuserCls.app.models.RoleMapping.create(params, (error, roleMapInstance) => {
                if(error) {
                    console.log(error);
                    return reject(error);
                } else {
                    console.log(roleMapInstance);                        
                    return resolve(roleMapInstance);
                }
            });
        });
    }

    async _insertNewApplication(user) {
        let shaCode = sha256(user.id.toString());
        await this.appManager.insertNewApp({userId: user.id, status: 0, shaCode})
    }

    async _insertNewStore(apiParams, user) {
        try {
            await this.store._insertNewStore({storeName: apiParams.storeName, email: apiParams.email, phone: apiParams.phone, userId: user.id});
            return true;
        } catch(e) {
            console.log(e);
            return false;
        }
    }

    _fetchList(ownerUserId) {
        return new Promise( (resolve, reject) => {
            let where = '';
            if(ownerUserId !== undefined)
                where = {where: {ownerId: ownerUserId}};
            db.query('SELECT id, username, email, phone FROM user WHERE ownerId = ?', [ownerUserId], (err, res) => {
            // GsuserCls.find(where, (err, res) => {
                if(err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    checkForAnyPendingActions() {
        try {
            // check if atleast one interest rate added?
            // check if the BillSeries + BillNumber got updated?
            return {
                interestCreated: true,
                billSeriesAndNumberUpdated: true
            }
        } catch(e) {
            console.log(e);
            return {
                interestCreated: false,
                billSeriesAndNumberUpdated: false
            }
        }
    }

    fetchOtherPromiseStuffs(ownerUserId) {
        return new Promise((resolve, reject) => {

            let fetchLoanBillTemplateSettings = new Promise(async (resolve, reject) => {
                let row = await LoanBillTemplate._getSettingsApi({_userId: ownerUserId});
                return resolve(row);
            });

            let jewelleryBillTemplateSettings = new Promise(async (resolve, reject) => {
                let row = await JewelleryBillSettings._getTemplateSettingsApi({_userId: ownerUserId});
                let gst = {};
                let estimate = {};
                for(let i in row) {
                    if(row[i].category == 'gst')
                        gst = row[i];
                    if(row[i].category == 'estimate')
                        estimate = row[i];
                }
                return resolve({gst, estimate});
            });

            let jewelleryTagTemplateSettings = new Promise(async (resolve, reject) => {
                let row = await JewelleryTagSettings._getSettings(ownerUserId);                
                return resolve(row);
            });

            Promise.all([fetchLoanBillTemplateSettings, jewelleryBillTemplateSettings, jewelleryTagTemplateSettings]).then(
                (results) => {
                    let obj = {
                        loanBillTemplateSettings: results[0],
                        jewelleryBillTemplateSettings: results[1],
                        jewelleryTagTemplateSettings: results[2],
                    }
                    resolve(obj);
                },
                (error) => {
                    console.log(error);
                    reject(error);
                }
            )
            .catch(
                (exception) => {
                    console.log(exception);
                    reject(exception);
                }
            );
        });
    }

    _find(userId) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM user WHERE id = ?', [userId], (err, res) => {
            // GsuserCls.findOne({where: {id: userId}}, async (err, ret) => {
                if(err)
                    return reject(err);
                else
                    return resolve(res[0]);
            });
        });
    }

    passwordResetApi(apiParams, cb) {
        this._passwordReset(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (error) => {
                console.log(error);
                return cb(error, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _passwordReset(apiParams) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            let userRec = await this._find(userId);
            if(userRec && userRec.pwd == apiParams.currentPassword) {
                userRec.updateAttribute('password', apiParams.newPassword, (err, res) => {
                    if(err) return reject(err);
                    else {
                        db.query('UPDATE user SET pwd = ? WHERE email = ?', [apiParams.newPassword, userRec.email], (err, res) => {
                        // this.updateAll({email: userRec.email}, {pwd: apiParams.newPassword}, (err, res) => {
                            if(err) {
                                console.log(err);
                                return reject(err);
                            } else {
                                return resolve('Updated password in DB');
                            }
                        });
                    }
                });
            } else {
                return reject('Please enter your correct Current Password.');
            }
        });
    };

    storeLoginActionDB(params) {
        return new Promise((resolve, reject) => {
            let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
            db.query(`INSERT INTO analytics_app_login (user_id, wmic, action, resp, other, created_date, modified_date) VALUES (?,?,?,?,?,?,?)`, [params.userId, app.get('observedWmic'), 'login', params.status, params.email, dt, dt], (err, res)=> {
                if(err) {
                    console.log(err);
                    return resolve(false);
                } else {
                    return resolve(true);
                }
            })
        });
    }

    storeLogoutActionDB(params) {
        return new Promise((resolve, reject) => {
            let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
            db.query(`INSERT INTO analytics_app_login (wmic, action, resp, other, created_date, modified_date) VALUES (?,?,?,?,?,?)`, [app.get('observedWmic'), 'logout', params.status, params.accessToken, dt, dt], (err, res)=> {
                if(err) {
                    console.log(err);
                    return resolve(false);
                } else {
                    return resolve(true);
                }
            })
        });
    }
}

export const Gsuser = new GsuserCls();

Gsuser.remoteMethod(
    'loginUser',
    {
        description: 'User Login.',
        accepts: {
            arg: 'custom',
            type: 'object',
            default: {
                "email": "name@domain.com",
                "password": "password",
            },
            http: {
                source: 'body'
            }
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {verb: 'post', path: '/login-user'}
    }
);


Gsuser.remoteMethod('ssoLogin', {
    description: 'User Login.',
    accepts: {
        arg: 'apiParams',
        type: 'object',
        default: {},
        http: {
            source: 'body'
        }
    },
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {verb: 'post', path: '/sso-login'}
});

Gsuser.remoteMethod('logoutApi', {
    description: 'User LogOut.',
    accepts: {
        arg: 'apiParams',
        type: 'object',
        default: {},
        http: {
            source: 'body'
        }
    },
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {verb: 'post', path: '/logout-user'}
});

Gsuser.remoteMethod('checkEmailExistance', {
    description: 'Validating user by email',
    accepts: {
        arg: 'apiParams',
        type: 'object',
        default: {},
        http: {
            source: 'body'
        }
    },
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {verb: 'post', path: '/check-email-existance'}
});

Gsuser.remoteMethod('passwordResetApi', {
    description: 'Password reset',
    accepts: {
        arg: 'apiParams',
        type: 'object',
        default: {
            "accessToken": "",
            "current": "",
            "new": ""
        },
        http: {
            source: 'body'
        }
    },
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {verb: 'post', path: '/password-reset'}
});

Gsuser.remoteMethod('signupNewCustomer', {
    description: 'Registering a new customer',
    accepts: {
        arg: 'custom',
        type: 'object',
        default: {
            "email": "gs@gs.com",
            "password": "admin123",
            "username": ""
        },
        http: {
            source: 'body'
        }
    },
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {verb: 'post', path: '/add-customer'}
});

Gsuser.remoteMethod('addUser', {
    description: 'Adding new User under an existing customer',
    accepts: {
        arg: 'apiParams',
        type: 'object',
        default: {
            "email": "gs@gs.com",
            "password": "admin123",
            "confirmPassword": "admin123",
            "userName": "admin"
        },
        http: {
            source: 'body'
        }
    },
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {verb: 'post', path: '/add-user'}
});


Gsuser.remoteMethod('fetchUserList', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken = req && req.query.access_token;
                return accessToken;
            },
            description: 'Arguments goes here',
        }],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body',
        },
    },
    http: {verb: 'get', path: '/user-list'}
});
