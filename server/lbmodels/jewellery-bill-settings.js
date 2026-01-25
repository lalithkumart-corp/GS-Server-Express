'use strict';
let utils = require('../utils/commonUtils');
let _ = require('lodash');
const { remoteMethod } = require('../routes/remoteMethod.js');
import express from 'express';
import db from '../db/index.js';
export class JewelleryBillSettingsCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    getSettingsApi(accessToken, category, cb) {
        this._getSettingsApiByCategory({accessToken, category}).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    };

    async _getTemplateSettingsApi(params) {
        try {
            if(!params._userId)
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let whereObj = {
                userId: params._userId,
            };
            if(params.category)
                whereObj.category = params.category;

            let records = await db.query('SELECT * FROM jewellery_bill_settings WHERE user_id = ?', [params._userId]);
            // let records = await JewelleryBillSettingsCls.find({ where: whereObj });
            if(records && records.length > 0) {
                let rows = [];
                _.each(records, (aRow, index) => {
                    rows.push({
                        selectedTemplate: aRow.selected_template,
                        customCss: aRow.custom_css,
                        category: aRow.category,
                        customArgs: aRow.custom_args
                    });
                });
                return rows;
            } else {
                return null;
            }
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    async _getSettingsApiByCategory(params) {
        try {
            if(!params._userId)
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let whereObj = {
                userId: params._userId,
            };

            let sql = `SELECT id, user_id as userId, category, bill_no as billNo, bill_series as billSeries, selected_template as selectedTemplate, custom_css as customCss, custom_args as customArgs FROM jewellery_bill_settings WHERE user_id = ?`;
            let queryParams = [params._userId];

            if(params.category) {
                whereObj.category = params.category;
                sql += ` AND category = ?`;
                queryParams.push(params.category);
            }

            let records = await db.query(sql, queryParams);
            // let records = await JewelleryBillSettingsCls.find({ where: whereObj });
            if(records && records.length > 0)
                return records;
            else
                return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    updateSettingsApi(apiParams, cb) {
        this._updateSettingsApi(apiParams).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    };

    async _updateSettingsApi(apiParams) {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            await this._updateSettingsInDB('gst', {_userId: apiParams._userId, ...apiParams.gst});
            await this._updateSettingsInDB('estimate', {_userId: apiParams._userId, ...apiParams.estimate});
            return true;
        } catch(e) {
            console.log(e);
            throw e;
        }
    };

    async _updateSettingsInDB(category, payload) {
        let sql = `SELECT * FROM jewellery_bill_settings WHERE user_id = ? AND category = ?`;
        let queryParams = [payload._userId, category];
        let records = await db.query(sql, queryParams);
        if(records && records.length > 0) {

            let updateParams = {};
            if(payload.customCss)
                updateParams.custom_css = JSON.stringify(payload.customCss);
            if(payload.selectedTemplate)
                updateParams.selected_template = payload.selectedTemplate;
            if(payload.customArgs)
                updateParams.custom_args = JSON.stringify(payload.customArgs);
            
            if(payload.billSeries)
                updateParams.bill_series = payload.billSeries;
            
            if(payload.billNo)
                updateParams.bill_no = payload.billNo;

            await db.query(`UPDATE jewellery_bill_settings SET ? WHERE user_id = ? AND category = ?`, [updateParams, payload._userId, category]);
        }else
            await db.query(`INSERT INTO jewellery_bill_settings (user_id, category, custom_css, selected_template, bill_series, bill_no) VALUES (?, ?, ?, ?, ?, ?)`, [payload._userId, category, JSON.stringify(payload.customCss), payload.selectedTemplate, payload.billSeries, payload.billNo]);
        return true;
    }

    getAvlJewelleryBillSettingssApi(cb) {
        this._getAvlJewelleryBillSettingssApi().then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _getAvlJewelleryBillSettingssApi() {
        return new Promise((resolve, reject) => {
            db.query(SQL.LIST, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    _.each(res, (aRow, index) => {
                        aRow.screenshot_url = utils.constructImageUrl(aRow.screenshot_url);
                    });
                    let gst = [];
                    let estimate = [];
                    for(let i in res) {
                        if(res[i].category == 'gst') {
                            gst.push(res[i]);
                        } else if(res[i].category == 'estimate') {
                            estimate.push(res[i]);
                        }
                    }
                    return resolve({gst, estimate});
                }
            });
        });
    }

    incrementSerialAndNumber(userId, billNo, category) {
        return new Promise((resolve, reject) => {
            db.query(SQL.INCR_INVOICE_NO, [billNo, category, userId], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

}
const router = express.Router();

const JewelleryBillSettings = new JewelleryBillSettingsCls();


// module.exports = function(JewelleryBillSettings) {
    JewelleryBillSettings.remoteMethod('getSettingsApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'category', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let category = req && req.query.category;
                    return category;
                },
                description: 'Arguments goes here',
            }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/get-settings', verb: 'get'},
        description: 'Jewellery Bill Header Setting.',
    });
    JewelleryBillSettings.remoteMethod('updateSettingsApi', {
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
        http: {path: '/update-settings', verb: 'post'},
        description: 'Loan Bill Setting.',
    });
    JewelleryBillSettings.remoteMethod('getAvlJewelleryBillSettingssApi', {
        accepts: [],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/fetch-avl-jewellery-bill-templates', verb: 'get'},
        description: 'Get ALL avl Loan Bill Templates.',
    });
// }

let SQL = {
    LIST: `SELECT * FROM jewellery_bill_avl_template_list`,
    INCR_INVOICE_NO: `UPDATE jewellery_bill_settings SET bill_no = ? WHERE (category = ? AND user_id = ?)`,
    UPDATE_ARGS: `UPDATE jewellery_bill_settings SET custom_args=? WHERE (category = ? AND user_id = ?)`
}

export default router;

export { JewelleryBillSettings };