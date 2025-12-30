'use strict';
let _ = require('lodash');
import db from '../db/index.js';
import express from 'express';
import { PledgebookCls } from './pledgebook.js';
let utils = require('../utils/commonUtils');
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

class AlertCls {
    constructor() {
        this.pledgebook = new PledgebookCls();
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    async createNew(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._userId = userId;
            let dbParams = {userId, triggerTime: params.triggerTime, code: params.code, title: params.title, message: params.message, extraCtx: params.extraCtx, module: params.module};
            let alertRes = await this._create(dbParams);
            if(params.link) {
                if(params.link.to == 'pledgebook') {
                    let pledgebookTableName = await this.pledgebook.getPledgebookTableName(params._userId);
                    await this._linkToPledgebookBill(pledgebookTableName, params.link.uniqueIdentifier, alertRes.id);
                } else if(params.link.to == 'fund_transaction') {
                    await this._linkToFundTransaction({userId: params._userId, transactionId: params.link.id, alertId: alertRes.id});
                }
            }
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    _create(dbParams) {
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO alerts (user_id, trigger_time, code, title, message, extra_ctx, module) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [dbParams.userId, dbParams.triggerTime, dbParams.code, dbParams.title, dbParams.message, dbParams.extraCtx, dbParams.module],
            (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        })
    }

    _linkToPledgebookBill(pledgebookTableName, uniqueIdentifier, alertId) {
        return new Promise((resolve, reject) => {
            let query = `UPDATE ${pledgebookTableName} SET Alert=${alertId} WHERE UniqueIdentifier=${uniqueIdentifier}`;
            db.query(query, (err, result) => {
                if(err) {
                    reject ( err );
                } else {
                    resolve( result );
                }
            });
        })
    }

    _linkToFundTransaction(params) {
        return new Promise((resolve, reject) => {
            let query = `UPDATE fund_transactions_REPLACE_USERID SET alert=${params.alertId} WHERE id=${params.transactionId}`;
            query = query.replace(/REPLACE_USERID/g, params.userId);
            db.query(query, (err, result) => {
                if(err) {
                    reject ( err );
                } else {
                    resolve( result );
                }
            });
        })
    }

    async updateAlert(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            await this._updateAlert(params);
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    _updateAlert(params) {
        return new Promise(async (resolve, reject) => {
            db.query('UPDATE alerts SET title=?, message=?, trigger_time=? WHERE id=?', [params.title, params.message, params.triggerTime, params.alertId], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    async deleteAlert(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            await this._deleteAlert(params);
            if(params.link.to == 'pledgebook')
                await this._unLinkFromPledgebook(params);
            else if(params.link.to == 'fund_transaction')
                await this._unLinkFromFundTransaction(params);
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    _deleteAlert(params) {
        return new Promise( (resolve, reject) => {
            db.query('DELETE FROM alerts WHERE id=?', [params.alertId], (err, res) => {
                if(err)
                    return reject(err);
                else
                    return resolve(res);
            });
        });
    }

    _unLinkFromPledgebook(params) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._userId = userId;
            let pledgebookTableName = await this.pledgebook.getPledgebookTableName(params._userId);
            let query = `UPDATE ${pledgebookTableName} SET Alert=NULL WHERE UniqueIdentifier=${params.link.uniqueIdentifier}`;
            db.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    _unLinkFromFundTransaction(params) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            let query = `UPDATE fund_transactions_REPLACE_USERID SET alert=NULL WHERE id=${params.link.id}`;
            query = query.replace(/REPLACE_USERID/g, userId);
            db.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async getAlertsList(accessToken, params) {
        try {
            if(!accessToken)
                throw 'Access Token is missing';
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let alertsList = await this._getAlertList(userId, params);
            return {STATUS: 'SUCCESS', ALERTS: alertsList};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    _getAlertList(userId, params) {
        return new Promise( (resolve, reject) => {
            let sql = `SELECT * FROM alerts WHERE user_id=${userId} AND archived=0 AND trigger_time <= UTC_TIMESTAMP() ORDER BY trigger_time DESC LIMIT 100`;
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    async archiveAlert(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let status = await this._archiveAlert(params);
            return {STATUS: 'SUCCESS', ARCHIVED_STATUS: status};
        } catch(e) {
            return {STATUS: 'ERROR', ARCHIVED_STATUS: false, ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    _archiveAlert(params) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE alerts SET has_read=1, archived=1 WHERE id=${params.id}`;
            db.query(sql, (err, resp) => {
                if(err)
                    return reject(err);
                else
                    return resolve(true);
            });
        });
    }

}

export const Alert = new AlertCls();


Alert.remoteMethod('createNew', {
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
    http: {path: '/create-new', verb: 'post'},
    description: 'Create New Alert'
});

Alert.remoteMethod('updateAlert', {
    accepts: {
        arg: 'data',
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
    http: {path: '/update-alert', verb: 'put'},
    description: 'Updates an Alert'
});

Alert.remoteMethod('deleteAlert', {
    accepts: {
        arg: 'data',
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
    http: {path: '/delete-alert', verb: 'del'},
    description: 'Delete an Alert'
});

Alert.remoteMethod('getAlertsList', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken = req && req.query.access_token;
                return accessToken;
            },
            description: 'Arguments goes here',
        }, {
            arg: 'params', type: 'object', http: (ctx) => {
                let req = ctx && ctx.req;
                let params = req && req.query.params;
                params = params ? JSON.parse(params) : {};
                return params;
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
    http: {path: '/get-alerts-list', verb: 'get'},
    description: 'For fetching alerts list.',
});

Alert.remoteMethod('archiveAlert', {
    accepts: {
        arg: 'data',
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
    http: {path: '/archive-an-alert', verb: 'put'},
    description: 'Archives an Alert'
});


export default router;