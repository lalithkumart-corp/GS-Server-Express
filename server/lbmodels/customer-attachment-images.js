'use strict';
var fs = require('fs');
let utils = require('../utils/commonUtils.js');
import express from 'express';
import db from '../db/index.js';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

export class CustAttachmentImageCls {
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    saveImage(picture) {
        return new Promise( (resolve, reject) => {
            db.query('INSERT INTO customer_attachment_images (Hashkey, Image, Format, Path, StorageMode, Optional, Caption) VALUES (?,?,?,?,?,?,?)', [
                picture.hashKey,
                picture.value,
                picture.format,
                picture.path,
                picture.storageMode,
                picture.options,
                picture.caption
            ], (err, result) => {
                if(err) {
                    //TODO: log the error
                    let error = new Error('Customer Attachment Image upload Failed: ');
                    error += err.message;
                    return reject(error);
                } else {
                    // let url = `http://${app.get('domain')}:${app.get('port')}${result.path.replace('client', '')}`;
                    let url = utils.constructImageUrl(result.path);
                    return resolve({id: result.id, url: url});
                }
            });
        });        
    }

    getImage(imageId) {
        return new Promise( (resolve, reject) => {
            db.query('SELECT * FROM customer_attachment_images WHERE Id = ?', [imageId], (err, result) => {
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
                    db.query('DELETE FROM customer_attachment_images WHERE Id = ?', [imageRec.Id], (err, response) => {
                        if(err)
                            return reject(err);
                        else
                            return resolve(true);
                    });
                });
            } else {
                db.query('DELETE FROM customer_attachment_images WHERE Id = ?', [imageRec.Id], (err, response) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(true);
                });
            }
            
        });
    };

}

export const CustomerAttachmentImage = new CustAttachmentImageCls();

export default router;