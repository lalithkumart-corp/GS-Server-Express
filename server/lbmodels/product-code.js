'use strict';

const { remoteMethod } = require('../routes/remoteMethod.js');

import db from '../db/index.js';
import express from 'express';
const router = express.Router();
export default router;

export class ProductCodeCls {
    constructor() {
        
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }
    
    getCodeId(code, userId) {
        code = code.toUpperCase();
        return new Promise((resolve, reject) => {
            let rowData = {code, userId, nextSerial: 1};
            db.query(`SELECT id, next_serial FROM product_code WHERE code = ? AND user_id = ?`, [code, userId], (err, result) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else if(result && result.length > 0) {
                    return resolve({id: result[0].id, nextSerial: result[0].next_serial});
                } else {
                    db.query(`INSERT INTO product_code (code, user_id, next_serial) VALUES (?, ?, ?)`, [code, userId, 1], (err, result) => {
                        if(err) {
                            console.log(err);
                            return reject(err);
                        } else {
                            return resolve({id: result.insertId, nextSerial: 1});
                        }
                    });
                }
            });
        });
    }
    
    incrementSerialNumber(id) {
        return new Promise((resolve, reject) => {
            db.query(`UPDATE product_code SET next_serial=next_serial+1 where id=${id}`, (err, result) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }
}

export const ProductCode = new ProductCodeCls();
