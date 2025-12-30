'use strict';
let utils = require('../utils/commonUtils');
import db from '../db/index.js';
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

class JewelleryTagSettingsCls {
    constructor() {
        
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}

const JewelleryTagSettings = new JewelleryTagSettingsCls();


// module.exports = function(JewelleryTagSettings) {

    JewelleryTagSettingsCls.prototype.getSettingsApiHandler = async (accessToken) => {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let tagSettings = await JewelleryTagSettingsCls.prototype._getSettings(_userId);
            return {STATUS: 'SUCCESS', TAG_SETTINGS: tagSettings};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }

    JewelleryTagSettingsCls.prototype.remoteMethod('getSettingsApiHandler', {
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
        http: {path: '/get-settings', verb: 'get'},
        description: 'For fetching tag settings.',
    });

    JewelleryTagSettingsCls.prototype.remoteMethod('updateTagPreferenceApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken;
                    if(req && req.headers.authorization)
                        accessToken = req.headers.authorization;
                    return accessToken;
                },
                description: 'Authorization from header',
            }, {
                arg: 'payload',
                type: 'object',
                default: {
                    
                },
                http: {
                    source: 'body',
                },
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/update-tag-selection', verb: 'put'},
        description: 'Updates tag selection'
    });

    JewelleryTagSettingsCls.prototype._getSettings = (_userId) => {
        return new Promise(async (resolve, reject) => {
            db.query(SQL.GET_SETTINGS, [_userId], (err, res) => {
            // JewelleryTagSettingsCls.dataSource.connector.query(SQL.GET_SETTINGS, [_userId], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res[0] || null);
                }
            });
        });
    }

    JewelleryTagSettingsCls.prototype.updateTagPreferenceApi = async (accessToken, payload) => {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            await JewelleryTagSettingsCls.prototype._updateTagPreference(accessToken, payload);
            return {STATUS: 'SUCCESS', MESSAGE: 'UPDATED SUCCESSFULLY'};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }

    JewelleryTagSettingsCls.prototype._updateTagPreference = (accessToken, payload) => {
        return new Promise(async (resolve, reject) => {
            try {
                let _userId = await utils.getStoreOwnerUserId(accessToken);
                let records = await db.query(`SELECT * FROM jewellery_tag_settings WHERE user_id = ?`, [_userId]);
                if(records && records.length > 0) {
                    await db.query(`UPDATE jewellery_tag_settings SET selected_tag_template_id = ?, store_name_abbr = ?, store_name_full = ? WHERE user_id = ?`, [payload.selectedTemplateId, payload.storeNameAbbr, payload.storeNameFull, _userId]);
                    // await JewelleryTagSettingsCls.updateAll({userId: _userId}, {selectedTagId: payload.selectedTemplateId, storeNameAbbr: payload.storeNameAbbr});
                } else {
                    await db.query(`INSERT INTO jewellery_tag_settings (user_id, selected_tag_template_id, store_name_abbr, store_name_full) VALUES (?, ?, ?, ?)`, [_userId, payload.selectedTemplateId, payload.storeNameAbbr, payload.storeNameFull]);
                }
                return resolve(true);
            } catch(e) {
                return reject(false);
            }
        });
    }
// };

let SQL = {
    GET_SETTINGS: `SELECT 
                        settings.selected_tag_template_id,
                        settings.store_name_abbr,
                        settings.store_name_full,
                        settings.customization
                    FROM
                        jewellery_tag_settings settings
                            LEFT JOIN
                        jewellery_tag_avl_template_list list ON settings.selected_tag_template_id = list.template_id
                    WHERE
                        settings.user_id = ?`
}

export default router;
export { JewelleryTagSettings };