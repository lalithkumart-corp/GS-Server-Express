'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
let dateformat = require('dateformat');
const { remoteMethod } = require('../routes/remoteMethod.js');

import db from '../db/index.js';
import express from 'express';
const router = express.Router();
export default router;

export class UdhaarSettingsCls {
    constructor() {
        
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }
    
    getLastBillSeriesAndNumber(accessToken, cb) {
        utils.getStoreOwnerUserId(accessToken)
        .then(
            (userId) => {
                db.query(`SELECT bill_series, next_bill_no FROM udhaar_settings WHERE userId = ?`, [userId], (err, res) => {
                    if(err) {
                        cb(err, null);
                    } else {
                        let data = res[0] || {};
                        let returnVal = {
                            billSeries: data.bill_series,
                            billNo: data.next_bill_no
                        };
                        cb(null, returnVal);
                    }
                });
            },
            (error) => {
                cb(error, null);
            }
        )
        .catch(
            (exception) => {
                cb(exception, null);
            }
        )
    };

    updateNextBillNumber(userId, nextBillNo) {
        return new Promise(async (resolve, reject) => {

            let res1 = await db.query(`SELECT * FROM udhaar_settings WHERE userId = ?`, [userId]);
            if(res1.length === 0) {
                await db.query(`INSERT INTO udhaar_settings (userId, next_bill_no) VALUES (?, ?)`, [userId, nextBillNo]);
                return resolve({affectedRows: 1});
            }

            await db.query(`UPDATE udhaar_settings SET next_bill_no = ? WHERE userId = ?`, [nextBillNo, userId]);
            resolve({affectedRows: 1});
        });
    }

}
export const UdhaarSettings = new UdhaarSettingsCls();

UdhaarSettings.remoteMethod('getLastBillSeriesAndNumber', {
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
    http: {path: '/get-next-serial-no', verb: 'get'},
    description: 'For fetching udhaar serial number.',
});
