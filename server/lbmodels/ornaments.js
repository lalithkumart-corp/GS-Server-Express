'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
// let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
// let logger = app.get('logger');
const { remoteMethod } = require('../routes/remoteMethod.js');

import db from '../db/index.js';
import express from 'express';
const router = express.Router();
export default router;

export class OrnamentCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    insert(params) {
        return new Promise( (resolve, reject) => {
            db.query('INSERT INTO orn_list (user_id, category, title) VALUES (?,?,?)', [params.userId, params.category, params.title], (err, result) => {
            // Ornament.create({userId: params.userId, category: params.category, title: params.title}, (err, result) => {
                if(err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(true);     
                }
            });
        });        
    }

    async fetchList(accessToken) {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let resp = await this._fetchFromDB(userId);
            return {STATUS: 'SUCCESS', RESPONSE: resp};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }        
    }

    async createOrn(params) {
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await this._insertInDB(params);
            return {
                STATUS: 'success',
                MSG: 'Inserted ornament in DB'
            }
        } catch(e) {
            // logger.error(GsErrorCtrl.create({className: 'Ornament', methodName: 'createOrn', cause: e, message: 'Exception caught while inserting new ornament in DB'}));
            return {
                STATUS: 'error',
                ERROR: e,
                ERR_MSG: e.message
            }
        }
    }

    async updateOrn(params) {
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await this._updateInDB(params);
            return {
                STATUS: 'success',
                MSG: 'Updated ornament in DB'
            }
        } catch(e) {
            // logger.error(GsErrorCtrl.create({className: 'Ornament', methodName: 'updateOrn', cause: e, message: 'Exception caught while updating existing ornament in DB'}));
            return {
                STATUS: 'error',
                ERROR: e,
                ERR_MSG: e.message
            }
        }
    }

    async deleteOrn(params) {
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await this._deleteFromDB(params);
            return {
                STATUS: 'success',
                MSG: 'Successfully deleted the ornament from DB'
            }
        } catch(e) {
            // logger.error(GsErrorCtrl.create({className: 'Ornament', methodName: 'deleteOrn', cause: e, message: 'Exception caught while deleting an ornament from DB'}));
            return {
                STATUS: 'error',
                ERROR: e,
                ERR_MSG: e.message
            }
        }
    }

    _fetchFromDB(userId) {
        return new Promise( (resolve, reject) => {
            db.query('SELECT * from orn_list WHERE user_id = ?', [userId], (err, res) => {
                if(err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });        
    }

    _insertInDB(params) {
        return new Promise( (resolve, reject) => {
            db.query('INSERT INTO orn_list (user_id, title, category) VALUES (?, ?, ?)', [params._userId, params.title, params.category], (err, res) => {
                if(err) {
                    // let e = GsErrorCtrl.create({className: 'Ornament', methodName: '_insertInDB', cause: err, message: 'Error occured while inserting an ornament in DB'});
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    _updateInDB(params) {
        return new Promise( (resolve, reject) => {
            db.query('UPDATE orn_list SET title = ?, category = ? WHERE id = ? AND user_id = ?', [params.title, params.category, params.id, params._userId], (err, res) => {
                if(err) {
                    // let e = GsErrorCtrl.create({className: 'Ornament', methodName: '_updateInDB', cause: err, message: 'Error occured while updating the ornament in DB'});
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    _deleteFromDB(params) {
        return new Promise( (resolve, reject) => {
            db.query('DELETE FROM orn_list WHERE id=? AND user_id=?', [params.id, params._userId], (err, res) => {
                if(err) {
                    // let e = GsErrorCtrl.create({className: 'Ornament', methodName: '_deleteFromDB', cause: err, message: 'Error occured while deleting the ornament from DB'});
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }
}

export const Ornament = new OrnamentCls();

Ornament.remoteMethod('fetchList', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                var req = ctx && ctx.req;
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
    http: {path: '/fetch-list', verb: 'get'},
    description: 'For fetching ornaments list.',
});



Ornament.remoteMethod('createOrn', {
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
            source: 'body',
        },
    },
    http: {path: '/create', verb: 'post'},
    description: 'For Updating an ornament.',
});



Ornament.remoteMethod('updateOrn', {
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
            source: 'body',
        },
    },
    http: {path: '/update-item', verb: 'post'},
    description: 'For Updating an ornament.',
});


Ornament.remoteMethod('deleteOrn', {
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
            source: 'body',
        },
    },
    http: {path: '/delete', verb: 'post'},
    description: 'For Updating an ornament.',
});
