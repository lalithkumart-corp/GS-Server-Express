'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
import db from '../db/index.js';
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();
export default router;

export class NoteCls {
    constructor() {
        
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    async fetchByCustomerId(accessToken, customerId, includeArchived) {
        try{
            let bucket = await this.fetchNotes(accessToken, customerId, includeArchived);
            return {STATUS: 'SUCCESS', DATA: bucket};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }  
    }

    fetchNotes(accessToken, customerId, includeArchived) {
        return new Promise( async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = '';
            if(includeArchived)
                sql = SQL.FETCH_ALL;
            else
                sql = SQL.FETCH;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [customerId], (err, response) => {
                if(err) {
                    reject(err);
                } else {                   
                    resolve(response);
                }
            });
        });        
    }

    insertNewNote(accessToken, params, cb) {
        this._insertNewNote(accessToken, params.customerId, params.custKey, params.content).then(
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

    _insertNewNote(accessToken, customerId, custKey, content) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.INSERT_NEW_NOTE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [customerId, custKey, content], (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    updateNote(accessToken, params, cb) {
        this._updateNote(accessToken, params.content, params.noteId, params.customerId).then(
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

    _updateNote(accessToken, content, noteId, customerId) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.UPDATE_NOTE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [content, noteId, customerId], (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        })
    }

    archiveNote(accessToken, params, cb) {
        this._archiveNote(accessToken, params.noteId, params.customerId).then(
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

    _archiveNote(accessToken, noteId, customerId) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.ARCHIVE_NOTE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [noteId, customerId], (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        })
    }


}

export const Note = new NoteCls();



Note.remoteMethod('fetchByCustomerId', {
    accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken = req && req.query.access_token;
                return accessToken;
            },
            description: 'Accesstoken',
        },
        {
            arg: 'customerId', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let customerId = req && req.query.customer_id;
                return customerId;
            },
            description: 'customerId',
        },
        {
            arg: 'include_archived', type: 'boolean', http: (ctx) => {
                let req = ctx && ctx.req;
                let includeArchived = req && req.query.include_archived;
                return includeArchived;
            },
            description: 'Include Archived Notes',
        }
    ],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body',
        }
    },
    http: {path: '/fetch-notes', verb: 'get'},
    description: 'For fetching Notes/Remarks of the Customer'
});

Note.remoteMethod('insertNewNote', {
    accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let authToken = null;
                if(req && req.headers.authorization)
                    authToken = req.headers.authorization || req.headers.Authorization;
                return authToken;
            },
            description: 'Access Token',
        }, {
            arg: 'params', type: 'object', default: {}, http: {source: 'body'}
        }
    ],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/insert', verb: 'post'},
    description: 'Adding a new note'
});

Note.remoteMethod('updateNote', {
    accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let authToken = null;
                if(req && req.headers.authorization)
                    authToken = req.headers.authorization || req.headers.Authorization;
                return authToken;
            },
            description: 'Access Token',
        }, {
            arg: 'params', type: 'object', default: {}, http: {source: 'body'}
        }
    ],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/update-note', verb: 'put'},
    description: 'Update note'
});

Note.remoteMethod('archiveNote', {
    accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let authToken = null;
                if(req && req.headers.authorization)
                    authToken = req.headers.authorization || req.headers.Authorization;
                return authToken;
            },
            description: 'Access Token',
        }, {
            arg: 'params', type: 'object', default: {}, http: {source: 'body'}
        }
    ],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/archive-note', verb: 'patch'},
    description: 'Archive note'
});

let SQL = {
    FETCH_ALL: `SELECT * FROM notes_REPLACE_USERID WHERE CustomerId=?`,
    FETCH: `SELECT * FROM notes_REPLACE_USERID WHERE CustomerId=? AND Archived=0`,
    INSERT_NEW_NOTE: `INSERT INTO notes_REPLACE_USERID (CustomerId, CustomerHashKey, Notes) VALUES (?, ?, ?)`,
    UPDATE_NOTE: `UPDATE notes_REPLACE_USERID SET Notes=? WHERE Id=? AND CustomerId=?`,
    ARCHIVE_NOTE: `UPDATE notes_REPLACE_USERID SET Archived=1 WHERE Id=? AND CustomerId=?`
};
