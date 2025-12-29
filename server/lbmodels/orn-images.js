'use strict';
var fs = require('fs');
let app = require('../server.js');
let utils = require('../utils/commonUtils');

const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

class OrnImageCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}

export const OrnImage = new OrnImageCls();


// module.exports = function(OrnImage) {
    OrnImageCls.prototype.saveImage = (picture) => {
        return new Promise( (resolve, reject) => {
            db.query('INSERT INTO orn_images (HashKey, Image, Format, Path, StorageMode, Optional) VALUES (?,?,?,?,?,?)', [
                picture.hashKey,
                picture.value,
                picture.format,
                picture.path,
                picture.storageMode,
                picture.options
            ], (err, result) => {
                if(err) {
                    //TODO: log the error
                    let error = new Error('ORN Image upload Failed: ');
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

    OrnImageCls.prototype.getImage = (imageId) => {
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

    OrnImageCls.prototype.delImage = (imageRec) => {
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
// };

export default router;
