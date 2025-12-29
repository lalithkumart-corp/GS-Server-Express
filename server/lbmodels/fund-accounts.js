'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');

import db from '../db/index.js';
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

class FundAccountCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}

export const FundAccount = new FundAccountCls();




// module.exports = function(FundAccount) {
    FundAccountCls.prototype.remoteMethod('insertNew', {
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
        http: {path: '/insert-account', verb: 'post'},
        description: 'Adding a new fund account'
    });

    FundAccountCls.prototype.remoteMethod('updateAccount', {
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
        http: {path: '/update-account', verb: 'put'},
        description: 'Updates existing fund account'
    });

    FundAccountCls.prototype.remoteMethod('fetchList', {
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
        http: {path: '/get-list', verb: 'get'},
        description: 'For fetching Accounts list.',
    });

    FundAccountCls.prototype.remoteMethod('deleteAccount', {
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
        http: {path: '/delete-account', verb: 'del'},
        description: 'Delete a fund account'
    });

    FundAccountCls.prototype.fetchList = (accessToken, cb) => {
        FundAccountCls.prototype._fetchList(accessToken).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundAccountCls.prototype._fetchList = (accessToken) => {
        return new Promise( async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            db.query(SQL.LIST, [userId], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            })
        })
    }

    FundAccountCls.prototype.insertNew = (apiParams, cb) => {
        FundAccountCls.prototype._insertNew(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundAccountCls.prototype._insertNew = (params) => {
        return new Promise( async (resolve, reject) => {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            db.query(SQL.INSERT, [params._userId, params.name, params.account_id, params.branch], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            })
        })
    }

    FundAccountCls.prototype.updateAccount = (apiParams, cb) => {
        FundAccountCls.prototype._updateAccount(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundAccountCls.prototype._updateAccount = (params) => {
        return new Promise( async (resolve, reject) => {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            db.query(SQL.UPDATE, [params.name, params.account_id, params.branch, params._userId, params.id], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            })
        })
    }

    FundAccountCls.prototype.deleteAccount = (apiParams, cb) => {
        FundAccountCls.prototype._deleteAccount(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundAccountCls.prototype._deleteAccount = (params) => {
        return new Promise( async (resolve, reject) => {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            db.query(SQL.DELETE, [params._userId, params.id], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            })
        })
    }
// }

let SQL = {
    LIST: `SELECT * FROM fund_accounts WHERE user_id=?`,
    INSERT: 'INSERT INTO fund_accounts (user_id, name, account_no, branch) VALUES(?,?,?,?)',
    UPDATE: 'UPDATE fund_accounts SET name=?, account_no=?, branch=? WHERE user_id=? AND id=?',
    DELETE: 'DELETE FROM fund_accounts WHERE user_id=? AND id=?'
}

export default router;