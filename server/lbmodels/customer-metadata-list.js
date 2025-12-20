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
}

export const CustomerMetaDatalist = new CustomerMetaDatalistCls();


CustomerMetaDatalist.getList = (userId, offset) => {
    return new Promise( (resolve, reject) => {
        db.query('SELECT * FROM customer_meta_datalist WHERE userId = 0', (err, result) => {
        // CustomerMetaDatalist.find({where: {userId: 0}}, (err, result) => {
            if(err) {
                // TODO: Log error
                return reject(err);
            } else {
                let formatted = [];
                _.each(result, (aRes, index) => {
                    let obj = {
                        displayText: aRes.displayText,
                        key: aRes.key,
                        serialNo: aRes.serialNo
                    }
                    formatted.push(obj);
                });
                return resolve(formatted);
            }
        });
    });
}

export default router;