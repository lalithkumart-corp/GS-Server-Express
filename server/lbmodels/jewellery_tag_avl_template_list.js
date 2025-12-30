'use strict';

import db from '../db/index.js';
const { remoteMethod } = require('../routes/remoteMethod.js');

let utils = require('../utils/commonUtils');
import express from 'express';

const router = express.Router();
export default router;

export class GsuserCls {
    constructor() {
        
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    async fetchListApiHandler(accessToken) {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let tagTemplates = await this._getTemplateList(accessToken);
            return {STATUS: 'SUCCESS', TAG_TEMPLATES: tagTemplates};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    };

    async _getTemplateList(accessToken) {
        return new Promise(async (resolve, reject) => {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            db.query(SQL.FETCH_TAG_TEMPLATES, [_userId], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
}


    JewelleryTagAvlTemplates.remoteMethod('fetchListApiHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken;
                    if(req && req.headers.authorization)
                        accessToken = req.headers.authorization;
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
        http: {path: '/fetch-list', verb: 'get'},
        description: 'For fetching tag avl list.',
    });
    
    
let SQL = {
    FETCH_TAG_TEMPLATES: `SELECT 
                            templates.template_id, 
                            templates.screenshot_url,
                            templates.parameters_json,
                            settings.selected_tag_template_id,
                            settings.store_name_abbr,
                            settings.customization
                        FROM
                            jewellery_tag_avl_template_list templates 
                                LEFT JOIN
                            jewellery_tag_settings settings ON (settings.selected_tag_template_id = templates.template_id AND settings.user_id = ?)`,
}
