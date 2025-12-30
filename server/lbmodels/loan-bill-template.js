'use strict';
let utils = require('../utils/commonUtils');
let _ = require('lodash');
import db from '../db/index.js';
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

export class LoanBillTemplateCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    getSettingsApi(accessToken, cb) {
        this._getSettingsApi({ accessToken }).then(
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

    async _getSettingsApi(params) {
        try {
            if(!params._userId)
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let records = await db.query('SELECT * FROM loan_bill_tempate_settings WHERE user_id = ?', [params._userId]);
            // let records = await LoanBillTemplateCls.find({where: {userId: params._userId}});
            if(records && records.length > 0) {
                return {
                    templateId: records[0].id,
                    userId: records[0].user_id,
                    header: records[0].header,
                    bodyTemplate: records[0].body_template,
                    other: records[0].other
                }
                // return records[0];
            }
            else
                return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    updateSettingsApi(apiParams, cb) {
        this._updateSettingsApi.call(apiParams).then(
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
            let records = await db.query(`SELECT * FROM loan_bill_tempate_settings WHERE user_id = ?`, [apiParams._userId]);
            // let records = await LoanBillTemplateCls.find({where: {userId: apiParams._userId}});
            if(records && records.length > 0)
                await db.query(`UPDATE loan_bill_tempate_settings SET header = ?, body_template = ?, other = ? WHERE user_id = ?`, [JSON.stringify(apiParams.headerSettings), apiParams.bodyTemplateId, JSON.stringify(apiParams.other), apiParams._userId]);
                // await LoanBillTemplateCls.updateAll({userId: apiParams._userId}, {header: JSON.stringify(apiParams.headerSettings), bodyTemplate: apiParams.bodyTemplateId, other: JSON.stringify(apiParams.other)});
            else
                await db.query(`INSERT INTO loan_bill_tempate_settings (user_id, header, body_template, other) VALUES (?, ?, ?, ?)`, [apiParams._userId, JSON.stringify(apiParams.headerSettings), apiParams.bodyTemplateId, JSON.stringify(apiParams.other)]);
                // await LoanBillTemplateCls.create({userId: apiParams._userId, header: JSON.stringify(apiParams.headerSettings), other: JSON.stringify(apiParams.other) });
            return true;
        } catch(e) {
            console.log(e);
            throw e;
        }
    };

    getAvlLoanBillTemplatesApi(cb) {
        this._getAvlLoanBillTemplatesApi.call().then(
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

    _getAvlLoanBillTemplatesApi() {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM loan_bill_avl_template_list';
            db.query(sql, (err, res) => {
            // LoanBillTemplateCls.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    _.each(res, (aRow, index) => {
                        aRow.screenshot_url = utils.constructImageUrl(aRow.screenshot_url);
                    });
                    return resolve(res);
                }
            });
        });
    }

}

export const LoanBillTemplate = new LoanBillTemplateCls();



LoanBillTemplate.remoteMethod('getSettingsApi', {
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
            source: 'body'
        }
    },
    http: {path: '/get-settings', verb: 'get'},
    description: 'Loan Bill Header Setting.',
});
LoanBillTemplate.remoteMethod('updateSettingsApi', {
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

LoanBillTemplate.remoteMethod('getAvlLoanBillTemplatesApi', {
    accepts: [],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/fetch-avl-loan-bill-templates', verb: 'get'},
    description: 'Get ALL avl Loan Bill Templates.',
});

export default router;
