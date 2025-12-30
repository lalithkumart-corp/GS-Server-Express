'use strict';
let utils = require('../utils/commonUtils');
import express from 'express';
import db from '../db/index.js';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();
class PledgebooksettingsCls {
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    updateLastBillDetail(data) {
    return new Promise((resolve, reject) => {
        let userId = data._userId;

        db.query('SELECT * FROM pledgebook_settings WHERE user_id = ?', [userId], (err, res) => {
            if(err) {
                return reject(err);
            } else {
                if(res && res.length > 0) {
                    db.query('UPDATE pledgebook_settings SET bill_series = ?, last_created_bill_no = ? WHERE user_id = ?', [data.billSeries, data.billNo, userId], (updateErr, updateRes) => {
                        if(updateErr) {
                            return reject(updateErr);
                        } else {
                            return resolve(updateRes);
                        }
                    });
                } else {
                    db.query('INSERT INTO pledgebook_settings (user_id, bill_series, last_created_bill_no, bill_start, bill_limit) VALUES (?, ?, ?, ?, ?)', [userId, data.billSeries, data.billNo, 1, 10000], (insertErr, insertRes) => {
                        if(insertErr) {
                            return reject(insertErr);
                        } else {
                            return  resolve(insertRes);
                        }
                    });
                }
            }
        });
        // PledgebooksettingsCls.findOrCreate({where: {userId: userId}}, {userId: userId, billStart: 1, billLimit: 10000}, (err, res) => {
        //     if(err) {
        //         console.log(err); // TODO: Mig Refactor
        //         reject(err);
        //     } else {
        //         PledgebooksettingsCls.updateAll({userId: userId}, {billSeries: data.billSeries, lastCreatedBillNo: data.billNo}, (error, result) => {
        //             if(error) {
        //                 reject(error);
        //             } else {
        //                 resolve(result);
        //             }
        //         });
        //     }
        // });            
    });
}

    async UpdateBillNumberAPIHanlder(params, cb) {
        let resp = {STATUS: 'SUCCESS'};
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await this.updateLastBillDetail(params);
            resp.MSG = 'Updated the bill settings successfully!';
        } catch(e) {
            resp.STATUS = 'ERROR';
            resp.ERROR = e.message?e.message:'Unknown Error';
        } finally {
            return resp;
        }
    }

    getLastBillSeriesAndNumber(accessToken, cb) {
        utils.getStoreOwnerUserId(accessToken)
        .then(
            (userId) => {
                db.query('SELECT * FROM pledgebook_settings WHERE user_id = ?', [userId], (err, result) => {
                    if(err) {
                        cb(err, null);
                    } else {
                        let data = result[0] || {};
                        let returnVal = {
                            billSeries: data.bill_series, //billSeries,
                            billNo: data.last_created_bill_no, //lastCreatedBillNo
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

}

export const Pledgebooksettings = new PledgebooksettingsCls();


Pledgebooksettings.remoteMethod('UpdateBillNumberAPIHanlder', {
    accepts: {
            arg: 'params',
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
    http: {path: '/update-bill-series-and-number', verb: 'post'},
    description: 'Update bill series and number'
});



Pledgebooksettings.remoteMethod('getLastBillSeriesAndNumber', {
    accepts: {
        arg: 'accessToken', type: 'string', http: (ctx) => {
            var req = ctx && ctx.req;
            let access_token = req && req.query.access_token;
            return access_token;
        },
        description: 'Accesstoken passed from client'
    },
    returns: {
        type: 'string',
        root: true,
        http: {
            source: 'body',
        },
    },
    http: {path: '/get-last-bill-series-and-number', verb: 'get'},
    description: 'For fetching metadata from Customer Data.',
});

export default router;