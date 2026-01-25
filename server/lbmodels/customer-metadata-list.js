'use strict';
let _ = require('lodash');
import db from '../db/index.js';
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

export class CustomerMetaDatalistCls {
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    getList(userId, offset) {
        return new Promise( (resolve, reject) => {
            db.query('SELECT * FROM customer_metadata_list WHERE userId = 0', (err, result) => {
            // CustomerMetaDatalistCls.find({where: {userId: 0}}, (err, result) => {
                if(err) {
                    // TODO: Mig Refactor
                    return reject(err);
                } else {
                    let formatted = [];
                    _.each(result, (aRes, index) => {
                        let obj = {
                            displayText: aRes.DisplayText,
                            key: aRes.Key,
                            serialNo: aRes.SerialNo
                        }
                        formatted.push(obj);
                    });
                    return resolve(formatted);
                }
            });
        });
    }
}

export const CustomerMetaDatalist = new CustomerMetaDatalistCls();

export default router;