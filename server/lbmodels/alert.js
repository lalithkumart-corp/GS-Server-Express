'use strict';
let _ = require('lodash');
import db from '../db/index.js';
import express from 'express';
import { Pledgebook } from './pledgebook.js';
let utils = require('../utils/commonUtils');
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

class AlertCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}

export const Alert = new AlertCls();


// module.exports = function(Alert) {
    AlertCls.prototype.remoteMethod('createNew', {
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

    AlertCls.prototype.remoteMethod('updateAlert', {
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

    AlertCls.prototype.remoteMethod('deleteAlert', {
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

    AlertCls.prototype.remoteMethod('getAlertsList', {
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

    AlertCls.prototype.remoteMethod('archiveAlert', {
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

    AlertCls.prototype.createNew = async (params) => {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._userId = userId;
            let dbParams = {userId, triggerTime: params.triggerTime, code: params.code, title: params.title, message: params.message, extraCtx: params.extraCtx, module: params.module};
            let alertRes = await AlertCls.prototype._create(dbParams);
            if(params.link) {
                if(params.link.to == 'pledgebook') {
                    let pledgebookTableName = await Pledgebook.getPledgebookTableName(params._userId);
                    await AlertCls.prototype._linkToPledgebookBill(pledgebookTableName, params.link.uniqueIdentifier, alertRes.id);
                } else if(params.link.to == 'fund_transaction') {
                    await AlertCls.prototype._linkToFundTransaction({userId: params._userId, transactionId: params.link.id, alertId: alertRes.id});
                }
            }
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    AlertCls.prototype._create = (dbParams) => {
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

    AlertCls.prototype._linkToPledgebookBill = (pledgebookTableName, uniqueIdentifier, alertId) => {
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

    AlertCls.prototype._linkToFundTransaction = (params) => {
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

    AlertCls.prototype.updateAlert = async (params) => {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            await AlertCls.prototype._updateAlert(params);
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    AlertCls.prototype._updateAlert = (params) => {
        return new Promise(async (resolve, reject) => {
            AlertCls.prototype.updateAll({id: params.alertId}, {title: params.title, message: params.message, triggerTime: params.triggerTime}, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    AlertCls.prototype.deleteAlert = async (params) => {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            await AlertCls.prototype._deleteAlert(params);
            if(params.link.to == 'pledgebook')
                await AlertCls.prototype._unLinkFromPledgebook(params);
            else if(params.link.to == 'fund_transaction')
                await AlertCls.prototype._unLinkFromFundTransaction(params);
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    AlertCls.prototype._deleteAlert = (params) => {
        return new Promise( (resolve, reject) => {
            AlertCls.prototype.deleteById(params.alertId, (err, res) => {
                if(err)
                    return reject(err);
                else
                    return resolve(res);
            });
        });
    }

    AlertCls.prototype._unLinkFromPledgebook = (params) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._userId = userId;
            let pledgebookTableName = await AlertCls.prototype.Pledgebook.getPledgebookTableName(params._userId);
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

    AlertCls.prototype._unLinkFromFundTransaction = (params) => {
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

    AlertCls.prototype.getAlertsList = async (accessToken, params) => {
        try {
            if(!accessToken)
                throw 'Access Token is missing';
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let alertsList = await AlertCls.prototype._getAlertList(userId, params);
            return {STATUS: 'SUCCESS', ALERTS: alertsList};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    AlertCls.prototype._getAlertList = (userId, params) => {
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

    AlertCls.prototype.archiveAlert = async (params) => {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let status = await AlertCls.prototype._archiveAlert(params);
            return {STATUS: 'SUCCESS', ARCHIVED_STATUS: status};
        } catch(e) {
            return {STATUS: 'ERROR', ARCHIVED_STATUS: false, ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    AlertCls.prototype._archiveAlert = (params) => {
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
// };

export default router;