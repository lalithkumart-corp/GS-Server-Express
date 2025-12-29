'use strict';

let utils = require('../utils/commonUtils');

const { remoteMethod } = require('../routes/remoteMethod.js');
import express from 'express';
import db from '../db/index.js';
class AnalyticsCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}
const router = express.Router();

const Analytics = new AnalyticsCls();



// module.exports = function(Analytics) {
    AnalyticsCls.prototype.remoteMethod('analyticsApiHandler', {
        accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken;
                if(req && req.headers.authorization)
                    accessToken = req.headers.authorization;
                return accessToken;
            },
            description: 'Arguments goes here',
        },{
            arg: 'payload',
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
        http: {path: '/create-event', verb: 'post'},
        description: 'Analytics',
    });

    AnalyticsCls.prototype.analyticsApiHandler = (accessToken, payload, cb) => {
        AnalyticsCls.prototype._analyticsApi(accessToken, payload).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    AnalyticsCls.prototype._analyticsApi = async (accessToken, payload) => {
        return new Promise(async (resolve, reject) => {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.MODULE_USED;
            db.query(sql, [_userId, payload.module, payload.ctx1, payload.ctx2, payload.ctx3], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }
// };

let SQL = {
    MODULE_USED: 'INSERT INTO analytics_module_used (user_id, module, ctx1, ctx2, ctx3) VALUES (?,?,?,?,?)'
}
