'use strict';

const { remoteMethod } = require('../routes/remoteMethod.js');

import db from '../db/index.js';
import express from 'express';
const router = express.Router();
export default router;

export class SupplierCls {
    constructor() {
        
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    getId(storeName) {
        return new Promise( (resolve, reject ) => {
            db.query(`SELECT id FROM suppliers WHERE name = ?`, [storeName], (err, res) => {
                if(err) {
                    return reject(err);
                } else if(res.length > 0) {
                    return resolve(res[0].id);
                } else {
                    return db.query(`INSERT INTO suppliers (name) VALUES (?)`, [storeName]).then( (result) => {
                        return resolve(result.insertId);
                    }).catch( (e) => {
                        return reject(e);
                    });
                }
            });
        });
    }

}
export const Supplier = new SupplierCls();
