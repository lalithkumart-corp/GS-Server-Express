
let utils = require('../utils/commonUtils');

import db from '../db/index.js';
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

export class UserPreferenceCls {
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}

const UserPreference = new UserPreferenceCls();


// module.exports = function(UserPreference) {

    UserPreferenceCls.prototype.fetchUserPreferenceAPI = async (accessToken) => {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let res = await UserPreferenceCls.prototype._fetchFromDB(userId);
            return {
                STATUS: 'SUCCESS',
                USER_PREFERENCES: res
            }
        } catch(e) {
            // logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: 'fetchUserPreferenceAPI', cause: e, message: 'Exception occured while fetching the user preferences'}));
            return {
                STATUS: 'ERROR',
                ERROR: e.message || '',
                ERR: e
            }
        }
    }

    UserPreferenceCls.prototype.remoteMethod('fetchUserPreferenceAPI', {
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
        http: {path: '/get-user-preferences', verb: 'get'},
        description: 'For fetching user preferences.',
    });

    UserPreferenceCls.prototype._fetchFromDB = (userId) => {
        return new Promise( (resolve, reject) => {
            try {
                db.query(`SELECT * FROM user_preferences WHERE user_id = ?`, [userId], (err, res) => {
                    if(err) {
                        // logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: '_fetchFromDB', cause: err, message: 'Exception in sql query execution'}));
                        return resolve({});
                    } else {
                        if(res.length > 0)
                            return resolve(res[0]);
                        else
                            return resolve({});
                    }
                });
            } catch(e) {
                // logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: '_fetchFromDB', cause: e, message: 'Exception caught while fetching user preferences'}));
                return {};
            }
        });
    }

    UserPreferenceCls.prototype.updateAPI = async (params) => {
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await UserPreferenceCls.prototype._insertOrUpdate(params);
            return {
                STATUS: 'success'
            }
        } catch(e) {
            // logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: 'updateAPI', cause: e, message: 'Exception occured while updating the user preferences'}));
            return {
                STATUS: 'error',
                ERROR: e.message || '',
                ERR: e
            }
        }
    }

    UserPreferenceCls.prototype.remoteMethod('updateAPI', {
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
        http: {path: '/update-user-preference', verb: 'post'},
        description: 'Update user preferences'
    });

    UserPreferenceCls.prototype._getUpdatedValues = (params) => {
        let val = {};
        if(params.place)
            val.bill_create_place_default = params.place;
        if(params.city)
            val.bill_create_city_default = params.city;
        if(params.pincode)
            val.bill_create_pincode_default = params.pincode;
        if(typeof params.auto_print_receipt !== "undefined")
            val.auto_print_receipt = params.auto_print_receipt;
        if(typeof params.expiryDays !== "undefined")
            val.loan_bill_expiry_days = params.expiryDays;

        val.bill_create_alert_offline_date = (typeof params.alertOfflineDate !== 'undefined')?params.alertOfflineDate:false;

        return val;
    }

    UserPreferenceCls.prototype._insertOrUpdate = (params) => {
        return new Promise( (resolve, reject) => {
            db.query(`SELECT * FROM user_preferences WHERE user_id = ?`, [params._userId], (err, res) => {
                if(err) {
                    // TODO: Mig Refactor
                    // let gsErr = GsErrorCtrl.create({className: 'UserPreference', methodName: '_insertOrUpdate', message: 'Error occured while updating defaults in DB', cause: err});
                    // return reject(gsErr);
                    return reject(err);
                } else {
                    if(res && res.length > 0) {

                        db.query(`UPDATE user_preferences SET ? WHERE user_id = ?`, [UserPreferenceCls.prototype._getUpdatedValues(params), params._userId], (err, res) => {
                            if(err) {
                                // TODO: Mig Refactor
                                // let gsError = GsErrorCtrl.create({className: 'UserPreference', methodName: '_insertOrUpdate', message: 'Error occured while updating defaults in DB', cause: err});
                                // return reject(gsError);
                                return reject(err);
                            } else {
                                return resolve(res);
                            }
                        });
                    } else {
                        db.query(`INSERT INTO user_preferences (user_id, bill_create_place_default, bill_create_city_default, bill_create_pincode_default, auto_print_receipt, bill_create_alert_offline_date, loan_bill_expiry_days) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                            params._userId,
                            params.place,
                            params.city,
                            params.pincode,
                            false,
                            params.alertOfflineDate,
                            params.loan_bill_expiry_days
                        ], (err, res) => {
                            if(err) {
                                // TODO: Mig Refactor
                                // let gsError = GsErrorCtrl.create({className: 'UserPreference', methodName: '_insertOrUpdate', message: 'Error occured while creating the defaults in DB', cause: err});
                                // return reject(gsError);
                                return reject(err);
                            } else {
                                return resolve(res);
                            }
                        });
                    }
                }
            });
        });
    }
// }

export default router;
export { UserPreference };
