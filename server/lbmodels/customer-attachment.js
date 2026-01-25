'use strict';
let utils = require('../utils/commonUtils.js');
let _ = require('lodash');
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');

import db from '../db/index.js';
const router = express.Router();


export class CustAttachmentCls {
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }
}

export const CustAttachment = new CustAttachmentCls();





    CustAttachment.remoteMethod('getCustomerAttachments', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    var req = ctx && ctx.req;
                    let access_token = null;
                    if(req && req.headers.authorization)
                        access_token = req.headers.authorization || req.headers.Authorization;
                    return access_token;                    
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'customerId', type: 'string', http: (ctx) => {
                    var req = ctx && ctx.req;
                    let customer_id = req && req.query.customer_id;
                    return customer_id;                    
                },
                description: 'Arguments goes here',
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/get-customer-attachments', verb: 'get'},
        description: 'For fetching customer attachments.',
    });

    CustAttachment.remoteMethod('insertCustomerAttachment', {
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
        http: {path: '/insert-new-customer-attachment', verb: 'put'},
        description: 'For fetching customer attachments.',
    });


    CustAttachment.remoteMethod('deleteCustomerAttachment', {
        accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken;
                if(req && req.headers.authorization)
                    accessToken = req.headers.authorization;
                return accessToken;
            },
            description: 'Arguments goes here',
        }, {
            arg: 'data',
            type: 'object',
            default: { },
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
        http: {path: '/delete-customer-attachment-entry', verb: 'delete'},
        description: 'For fetching customer attachments.',
    });

    CustAttachment.getCustomerAttachments = (accessToken, customerId, cb) => {
        CustAttachment._getCustomerAttachments(accessToken, customerId).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: {list: resp}});
            else
                cb(null, {STATUS: 'ERROR', RESP: {list: resp}});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    };

    CustAttachment._getCustomerAttachments = (accessToken, customerId) => {
        return new Promise(async (resolve, reject) => {
            let params = { customerId };
            params.userId = await utils.getStoreOwnerUserId(accessToken);
            let query = CustAttachment.getQuery('customer-attachments-list', params);
            query = query.replace(/REPLACE_USERID/g, params.userId);
            db.query(query, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    _.each(res, (aRec, index) => {
                        aRec.imagePath = utils.constructImageUrl(aRec.imagePath);
                    })
                    return resolve(res);
                }
            });
        });
    };

    CustAttachment.getQuery = (identifier, params) => {
        let sql = '';
        let whereCondition = '';
        let limitOffset = '';
        let whereClause = '';
        switch(identifier) {
            case 'customer-attachments-list':
                whereCondition = CustAttachment._getWhereCondition(params);
                sql = `SELECT 
                            customer_attachments_REPLACE_USERID.CustomerAttachmentId as customerAttachmentId,
                            customer_attachments_REPLACE_USERID.UserId as userId,
                            customer_attachments_REPLACE_USERID.CustomerId as customerId,
                            customer_attachments_REPLACE_USERID.ImageId as imageId,
                            customer_attachments_REPLACE_USERID.CreatedDate as createdDate,
                            customer_attachments_REPLACE_USERID.ModifiedDate as modifiedDate,
                            customer_attachment_images.Id AS imageTableId,
                            customer_attachment_images.Path AS imagePath,
                            customer_attachment_images.Format AS imageFormat,
                            customer_attachment_images.Optional AS imageOptionals,
                            customer_attachment_images.StorageMode AS imageStorageMode,
                            customer_attachment_images.Caption AS imageCaption
                        FROM customer_attachments_REPLACE_USERID
                            LEFT JOIN 
                        customer_attachment_images ON customer_attachments_REPLACE_USERID.ImageId = customer_attachment_images.Id
                           ${whereCondition}
                        ORDER BY customer_attachments_REPLACE_USERID.CreatedDate DESC`;
                break;
        }
        return sql;
    }

    CustAttachment._getWhereCondition = (params) => {
        let whereCondition = '';
        let filters = [];
        if(params.userId)
            filters.push(`customer_attachments_REPLACE_USERID.UserId=${params.userId}`);
        if(params.customerId && params.customerId.length>0)
            filters.push(`customer_attachments_REPLACE_USERID.CustomerId = ${params.customerId}`);
        
        if(filters.length)
            whereCondition = ` WHERE ${filters.join(' AND ')}`;
        return whereCondition;
    };

    CustAttachment.insertCustomerAttachment = (accessToken, payload, cb) => {
        CustAttachment._insertCustomerAttachment(accessToken, payload).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    CustAttachment._insertCustomerAttachment = (accessToken, payload) => {
        return new Promise(async (resolve, reject) => {
            payload.userId = await utils.getStoreOwnerUserId(accessToken);
            let query = SQL.INSERT_ATTACHMENT_ENTRY;
            query = query.replace(/REPLACE_USERID/g, payload.userId);
            db.query(query, [payload.userId, payload.customerId, payload.imageId], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve('Successfully Inserted');
                }
            });
        });
    };
 
    CustAttachment.deleteCustomerAttachment = (accessToken, data, cb) => {
        CustAttachment._deleteCustomerAttachment(accessToken, data).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    };

    CustAttachment._deleteCustomerAttachment = (accessToken, payload) => {
        return new Promise(async (resolve, reject) => {
           payload.userId = await utils.getStoreOwnerUserId(accessToken);
           let query = SQL.DELETE_ATTACHMENT_ENTRY;
           query = query.replace(/REPLACE_USERID/g, payload.userId);
           db.query(query, [payload.userId, payload.customerId, payload.imageId], (err, res) => {
               if(err) {
                   return reject(err);
               } else {
                   return resolve('Successfully Deleted attachment entry from Customer_attachment_* table');
               }
           }); 
        });
    }

let SQL = {
    INSERT_ATTACHMENT_ENTRY:  `INSERT INTO 
                            customer_attachments_REPLACE_USERID 
                            (UserId, CustomerId, ImageId)
                        VALUES
                            (?,?,?)`,
    DELETE_ATTACHMENT_ENTRY: `DELETE FROM customer_attachments_REPLACE_USERID where UserId=? and CustomerId=? and ImageId=?`
                    
}

export default router;