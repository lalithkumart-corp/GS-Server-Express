'use strict';
let _ = require('lodash');


import db from '../db/index.js';
import express from 'express';
const router = express.Router();
export default router;

export class TouchCls {
    constructor() {
        
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    async fetchList(accessToken) {
        try {
            let resp = await this._fetchTouchListFromDB();
            return {STATUS: 'SUCCESS', RESPONSE: resp};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _fetchTouchListFromDB() {
        return new Promise( (resolve, reject) => {
            db.query(`SELECT * FROM touch`, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    let resp = [];
                    _.each(res, (anObj, index) => {
                        resp.push(anObj);
                    });
                    return resolve(resp);
                }
            });
        });
    }

    getId(touchVal) {
        return new Promise( (resolve, reject ) => {
            db.query(`SELECT id FROM touch WHERE purity = ?`, [touchVal], (err, res) => {
                if(err) {
                    return reject(err);
                } else if(res.length > 0) {
                    return resolve(res[0].id);
                } else {
                    return db.query(`INSERT INTO touch (purity) VALUES (?)`, [touchVal]).then( (result) => {
                        return resolve(result.insertId);
                    }).catch( (e) => {
                        return reject(e);
                    });
                }
            });
        });
    }

}

export const Touch = new TouchCls();

Touch.remoteMethod('fetchList', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let access_token = req && req.query.access_token;
                return access_token;
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
    http: {path: '/list', verb: 'get'},
    description: 'For fetching Touch list.'
});

