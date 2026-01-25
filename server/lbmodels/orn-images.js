'use strict';
var fs = require('fs');
let utils = require('../utils/commonUtils');
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');
import db from '../db/index.js';

const router = express.Router();

export class OrnImageCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    saveImage(picture) {
        return new Promise( (resolve, reject) => {
            db.query('INSERT INTO orn_images (HashKey, Image, Format, Path, StorageMode, Optional) VALUES (?,?,?,?,?,?)', [
                picture.hashKey,
                picture.value,
                picture.format,
                picture.path,
                picture.storageMode,
                JSON.stringify(picture.options)
            ], (err, result) => {
                if(err) {
                    //TODO: log the error
                    let error = new Error('ORN Image upload Failed: ');
                    error += err.message;
                    return reject(error);
                } else {
                    // let url = `http://${app.get('domain')}:${app.get('port')}${result.path.replace('client', '')}`;
                    let url = utils.constructImageUrl(picture.path);
                    return resolve({id: result.insertId, url: url});
                }
            });
        });        
    }

    getImage(imageId) {
        return new Promise( (resolve, reject) => {
            db.query('SELECT * FROM orn_images WHERE Id = ?', [imageId], (err, result) => {
            // OrnImage.findById(imageId, (err, result) => {
                if(err)
                    return reject(err);
                else
                    return resolve(result);
            });
        });        
    }

    delImage(imageRec) {
        return new Promise( (resolve, reject) => {
            if(imageRec.StorageMode == 'PATH') {
                fs.unlink(imageRec.Path, (error) => {
                    if (error) return reject(error);
                    db.query('DELETE FROM orn_images WHERE Id = ?', [imageRec.Id], (err, response) => {
                        if(err)
                            return reject(err);
                        else
                            return resolve(true);
                    });
                });
            } else {
                db.query('DELETE FROM orn_images WHERE Id = ?', [imageRec.Id], (err, response) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(true);
                });
            }
            
        });
    }
}

export const OrnImage = new OrnImageCls();

export default router;
