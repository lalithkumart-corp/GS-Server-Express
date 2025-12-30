'use strict';
// let app = require('../server');
// let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
// let logger = app.get('logger');
let utils = require('../utils/commonUtils');
let moment = require('moment');
const { remoteMethod } = require('../routes/remoteMethod.js');


import db from '../db/index.js';
import express from 'express';
const router = express.Router();
export default router;

export class StoreCls {
    constructor() {
        
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    _insertNewStore(params) {
        return new Promise((resolve, reject) => {
            db.query(`INSERT INTO stores (user_id, store_name, email, mobile) VALUES (?, ?, ?, ?)`, [params.userId, params.storeName, params.email, params.phone], (err, resp) => {
                if(err) {
                    // logger.error(GsErrorCtrl.create({className: 'Store', className: '_insertNewStore', cause: err, message: 'Exception in sql callback'}));
                    return reject(err);
                } else {
                    return resolve(resp);
                }
            });
        });
    }

    async getInfo(accessToken, cb) {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let info = await this.findByUserId(userId);
            return { STATUS: 'SUCCESS', STORE_INFO: info };
        } catch(e) {
            console.log(e);
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    findByUserId(userId) {
        return new Promise((resolve, reject) => {
            db.query(`SELECT * FROM stores WHERE user_id = ?`, [userId], (err, result) => {
                if(err) {
                    // logger.error(GsErrorCtrl.create({className: 'Store', className: 'findByUserId', cause: err, message: 'Exception in sql callback'}));
                    return reject(err);
                } else {
                    return resolve(result[0]);
                }
            });
        })
    }

    async updateInfo(apiParams) {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            let updatedStoreDetails = await this._updateInfo(apiParams);
            return { STATUS: 'SUCCESS', UPDATED_DETAILS: updatedStoreDetails };
        } catch(e) {
            console.log(e);
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _updateInfo(apiParams) {
        return new Promise( (resolve, reject) => {
            let tableData = {
                store_name: apiParams.storeName,
                address: apiParams.address,
                place: apiParams.place,
                city: apiParams.city,
                pincode: apiParams.pincode,
                mobile: apiParams.mobile,
                email: apiParams.email,
                gst_no: apiParams.gstNo,
                loan_license_name: apiParams.loanLicenseName,
                loan_bill_address_line1: apiParams.loanBillAddrLine1,
                loan_bill_address_line2: apiParams.loanBillAddrLine2,
            };
            db.query(`SELECT * FROM stores WHERE user_id = ?`, [apiParams._userId], (error, res) => {
                if(error) {
                    return reject(error);
                } else {
                    if(res && res.length > 0) {
                        db.query(`UPDATE stores SET ? WHERE user_id = ?`, [tableData, apiParams._userId], (err, resp) => {
                            if(err) {
                                return reject(err);
                            } else {
                                return resolve(tableData);
                            }
                        });
                    } else {
                        db.query(`INSERT INTO stores (user_id, ?) VALUES (?, ?)`, [tableData, apiParams._userId], (err, resp) => {
                            if(err) {
                                return reject(err);
                            } else {
                                return resolve(tableData);
                            }
                        });
                    }
                }
            });
        });
    }

}

export const Store = new StoreCls();


Store.remoteMethod('getInfo', {
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
    http: {path: '/get-info', verb: 'get'},
    description: 'For fetching store info.',
});

Store.remoteMethod('updateInfo', {
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
    http: {path: '/update-info', verb: 'post'},
    description: 'Update store info'
});    

