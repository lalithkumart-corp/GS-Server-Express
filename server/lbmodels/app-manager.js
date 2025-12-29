'use strict';

import logger from "../components/logger/logger";
let utils = require('../utils/commonUtils');
let moment = require('moment');
import express from 'express';
import db from '../db/index.js';
const { remoteMethod } = require('../routes/remoteMethod.js');
import { Common } from './common.js';
const router = express.Router();

export class ApplicationManagerCls {
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}

const ApplicationManager = new ApplicationManagerCls();

// module.exports = function(ApplicationManager) {
    ApplicationManagerCls.prototype.remoteMethod('getStatus', {
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
        http: {path: '/get-status', verb: 'get'},
        description: 'For fetching app status.',
    });

    ApplicationManagerCls.prototype.remoteMethod('checkUsedTrialOffer', {
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
        http: {path: '/check-used-trial-offer', verb: 'get'},
        description: 'For fetching app status.',
    });

    ApplicationManagerCls.prototype.remoteMethod('updateStatus', {
        accepts: {
            arg: 'apiParams',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/update-status', verb: 'post'},
        description: 'Update application status'
    });

    ApplicationManagerCls.prototype.remoteMethod('renewLicenseApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            }, {
            arg: 'data',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
        }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/renew-license', verb: 'post'},
        description: 'Renew the license'
    });

    ApplicationManagerCls.prototype.getStatus = async (accessToken, cb) => {
        try {
            let status = 0;
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let appRow = await ApplicationManagerCls.prototype.findByUserId(userId);
            let daysToExpire;
            if(appRow) {
                status = appRow.status;
                let validTillDate = moment(appRow.valid_till_date);
                let todaysDate = moment();
                daysToExpire = validTillDate.diff(todaysDate, 'days');
            }
            return { STATUS: 'SUCCESS', isActive: status, daysToExpire, softwareLicenseValidTill: appRow.valid_till_date};
        } catch(e) {
            console.log(e);
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }
    ApplicationManagerCls.prototype.findByUserId = (userId) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM app WHERE user_id = ?', [userId], (err, result) => {
                if(err) {
                    // logger.error(GsErrorCtrl.create({className: 'AppManager', className: 'findByUserId', cause: err, message: 'Exception in sql callback'}));
                    logger.error(err);
                    return reject(err);
                } else {
                    return resolve(result[0]);
                }
            });
        })
    }
    ApplicationManagerCls.prototype.checkUsedTrialOffer = async (accessToken) => {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let flag = await ApplicationManagerCls.prototype.checkAlreadySubscribedTrial(userId);
            return { STATUS: 'SUCCESS', TRIAL_OVER: flag};
        } catch(e) {
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    ApplicationManagerCls.prototype.updateStatus = async function(apiParams, cb) {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            if(apiParams._userId) {
                let resp = await ApplicationManagerCls.prototype._updateTable(apiParams);
                return { STATUS: 'SUCCESS', resp: resp};
            } else {
                throw 'AUTH INVALID';
            }
        } catch(e) {
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    ApplicationManagerCls.prototype._updateTable = (apiParams) => {
        return new Promise( async (resolve, reject) => {
            try {
                let today = moment().format('YYYY-MM-DD HH:MM:ss');
                if(apiParams.plan == "trial") {
                    let day7 = moment().add(6, 'days').format('YYYY-MM-DD HH:MM:ss');
                    let alreadySubscribedTrial = await ApplicationManagerCls.prototype.checkAlreadySubscribedTrial(apiParams._userId);
                    if(alreadySubscribedTrial)
                        return reject( new Error('Trial Version already completed!'));
                    let updatedTable = await ApplicationManagerCls.prototype.activate(apiParams._userId, {status: 1, used_trial_offer: 1, valid_till_date: day7, modified_date: today});
                    await Common.createNewTablesIfNotExist(apiParams._userId);
                    await Common.setupNewUser(apiParams._userId);
                } else if(apiParams.plan == "custom") {
                    if(!apiParams.activationKey) return reject('Provide the Activation Key...')
                    let today = moment().format('YYYY-MM-DD HH:MM:ss');
                    let rr = new Date();
                    let password = app.get('csProductUUID') + app.get('encpwd') + rr.getFullYear()+rr.getMonth()+rr.getHours();
                    try {
                        const decryptedMessage = utils.decrypt(apiParams.activationKey, password);
                        let decryptedObj = JSON.parse(decryptedMessage);
                        if(!decryptedObj.expiryDate)
                            return reject('License Invalid - Code 1'); // If expiry date argument is not present in license key
                        await ApplicationManagerCls.prototype.activate(apiParams._userId, {status: 1, used_trial_offer: 1, valid_till_date: decryptedObj.expiryDate, modified_date: today});
                    } catch(e) {
                        return reject('License Invalid - Code 2'); // If license key is not the proper/right one
                    }
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }
    ApplicationManagerCls.prototype.checkAlreadySubscribedTrial = (userId) => {
        return new Promise((resolve, reject) => {
            try {
                db.query('SELECT * FROM app WHERE user_id = ?', [userId], (err, res) => {
                // ApplicationManagerCls.find({where: {userId: userId}}, (err, res) => {
                    if(err) {
                        console.log(err);
                        return reject(err);
                    } else {
                        if(res && res.length > 0) {
                            if(res[0].used_trial_offer)
                                return resolve(true);
                            else
                                return resolve(false);
                        }
                    }
                })
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }
    ApplicationManagerCls.prototype.activate = (userId, data) => {
        return new Promise((resolve, reject) => {
            db.query('UPDATE app SET ? WHERE user_id = ?', [data, userId], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        })
    }
    ApplicationManagerCls.prototype.updateValidityTime = (userId, ownerId) => {
        return new Promise( (resolve, reject) => {
            try {
                let id = ownerId || userId;
                db.query('SELECT * FROM app WHERE user_id = ?', [id], async (err, res) => {
                // ApplicationManagerCls.find({where: {userId: id}}, async (err, res) => {
                    if(err) {
                        //TODO: IMPORTANT. Log this error and notice this error in case appearing in PROD. 
                        console.log(err);
                        return resolve(false);
                    } else {
                        if(res && res.length>0) {
                            let date = res[0].valid_till_date;
                            let validityLastDate = moment(new Date(date));
                            let todayDate = moment();
                            let diff = validityLastDate.diff(todayDate, 'days');
                            if(diff <= 0) {
                                let res = await ApplicationManagerCls.disableUserApplication(id);
                                return resolve(false);
                            }
                            return resolve(true);
                        } else {
                            // logger.error(GsErrorCtrl.create({className: 'ApplicationManager', methodName: 'updateValidityTime', cause: 'App Not Found', message: 'No Appp found for this user.'}));
                            logger.error('No Appp found for this user.');
                            return resolve(null);
                        }
                    }
                });
            } catch(e) {
                console.log(e);
                // logger.error(GsErrorCtrl.create({className: 'ApplicationManager', methodName: 'updateValidityTime', cause: e, message: 'Exception'}));
                logger.error(e);
                return resolve(false);
            }
        });
    }
    ApplicationManagerCls.prototype.disableUserApplication = (userId) => {
        return new Promise((resolve, reject) => {
            db.query('UPDATE app SET status = 0 WHERE user_id = ?', [userId], (err, res) => {
            // ApplicationManagerCls.updateAll({userId: userId}, {status: 0}, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    ApplicationManagerCls.prototype.renewLicenseApi = (accessToken, data, cb) => {
        ApplicationManagerCls.prototype._renewLicenseApi(accessToken, data).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    ApplicationManagerCls.prototype._renewLicenseApi = (accessToken, data) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let today = moment().format('YYYY-MM-DD HH:MM:ss');
            let rr = new Date();
            let password = app.get('csProductUUID') + app.get('encpwd') + rr.getFullYear()+rr.getMonth()+rr.getHours();
            const decryptedMessage = utils.decrypt(data.licenseKey, password);
            try {
                let decryptedObj = JSON.parse(decryptedMessage);
                if(!decryptedObj.expiryDate)
                    return reject('License Invalid - Code 1');
                db.query('UPDATE app SET ? WHERE user_id = ?', [{status: 1, used_trial_offer: 1, valid_till_date: decryptedObj.expiryDate, modified_date: today}, userId], (err, res) => {
                // ApplicationManagerCls.updateAll({userId: userId}, {status: 1, usedTrialOffer: 1, validTillDate: decryptedObj.expiryDate, modifiedDate: today}, (err, res) => {
                    if(err) {
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
            } catch(e) {
                return reject(e);
            }
        });
    }
// }


export default router;
export { ApplicationManager };