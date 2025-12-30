'use strict';

let sh = require('shorthash');
var multer = require('multer');
var fs = require('fs');
let utils = require('../utils/commonUtils');
import { OrnImage } from './orn-images.js';
import { CustomerAttachmentImage } from './customer-attachment-images.js';
import db from '../db/index.js';
import express from 'express';

const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

class ImageCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}

export const Image = new ImageCls();


// module.exports = function(Image) {

    Image.saveBase64ImageAPI = async (picData) => {
        let imageStatus = {STATUS: 'SUCCESS'};
        try {
            let picture;
            if(picData.storeAs == 'FILE') {
               let uploadedDetail = await Image.writeImgFromBase64(picData);
                picture = {
                    storageMode: 'PATH',
                    path: uploadedDetail.path,
                    format: uploadedDetail.format,
                    options: {originalName: uploadedDetail.fileName},
                    caption: picData.caption || ''
                }
            } else {
                let hashKey = Image.generateHashKey(picData);
                if(hashKey) {
                    picture = {
                        hashKey: hashKey,
                        value: picData.pic,
                        format: picData.format,
                        storageMode: 'BLOB',
                        caption: picData.caption || ''
                    };
                }
            }

            if(picData.imgCategory == 'ORN') {
                let resp = await OrnImage.saveImage(picture);
                imageStatus.ID = resp.id;
                imageStatus.URL = resp.url;
            } else if (picData.imgCategory == 'CUSTOMER_ATTACHMENT') {
                let resp = await CustomerAttachmentImage.saveImage(picture);
                imageStatus.ID = resp.id;
                imageStatus.URL = resp.url;
            } else {
                let resp = await Image.saveImage(picture);
                imageStatus.ID = resp.id;
                imageStatus.URL = resp.url;
            }

        } catch(e) {
            imageStatus.STATUS = 'ERROR';
            imageStatus.MSG = e.message;
        } finally {
            return imageStatus;
        }
    }

    Image.remoteMethod('saveBase64ImageAPI', {
        accepts: {
            arg: 'picData',
            type: 'object',
            default: {

            },
            http: {
                source: 'body',
            },
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/save-base64-and-get-id', verb: 'post'},
        description: 'Save Image and Get ID'
    });

    Image.saveBinaryImageAPI = async (data, req, res) => {
        let imageStatus = {STATUS: 'SUCCESS'};
        try {
            let uploadedDetail = await Image.upload(req, res);
            let filePathWithName = uploadedDetail.path + uploadedDetail.options.localFile;
            let picture;
            if(req.body.storeAs == 'BASE64') {
                let base64ImgContent = Buffer.from(fs.readFileSync(filePathWithName)).toString("base64");
                let hashKey = Image.generateHashKey({format: uploadedDetail.mimeType, value: base64ImgContent});
                picture = {
                    hashKey: hashKey,
                    storageMode: 'BLOB',
                    value: base64ImgContent,
                    format: uploadedDetail.options.mimeType,
                    caption: req.body.caption || '', //reference error
                }
            } else {
                picture = {
                    path: filePathWithName,
                    storageMode: 'PATH',
                    format: uploadedDetail.options.mimeType,
                    options: {originalName: uploadedDetail.options.originalName},
                    caption: req.body.caption || ''
                };
            }
            if(req.body.imgCategory == 'ORN') {
                let resp = await OrnImage.saveImage(picture);
                imageStatus.ID = resp.id;
                imageStatus.URL = resp.url;
            } else if (req.body.imgCategory == 'CUSTOMER_ATTACHMENT') {
                let resp = await CustomerAttachmentImage.saveImage(picture);
                imageStatus.ID = resp.id;
                imageStatus.URL = resp.url;
            } else {
                let resp = await Image.saveImage(picture);
                imageStatus.ID = resp.id;
                imageStatus.URL = resp.url;
            }
        } catch(e) {
            imageStatus.STATUS = 'ERROR';
            imageStatus.MSG = e.message || e;
        } finally {
            return imageStatus;
        }
    }

    Image.remoteMethod('saveBinaryImageAPI', {
        accepts:
            [{
                arg: 'data',
                type: 'object',
                http: {
                    source: 'body',
                },
            },{
                arg: 'req',
                type: 'object',
                http: {
                    source: 'req'
                }
            }, {
                arg: 'res',
                type: 'object',
                http: {
                    source: 'res'
                }
            }
        ],
        returns: {
            arg: 'data',
            type: 'string',
            root: true
        },
        http: {path: '/save-binary-and-get-id', verb: 'post'},
        description: 'Save Image and Get ID'
    });

    Image.deleteByIdAPI = async (data) => {
        let execStatus = {STATUS: 'SUCCESS'};
        try {
            let imageRec;
            if(data.imgCategory == 'ORN'){
                imageRec = await OrnImage.getImage(data.imageId);
                await OrnImage.delImage(imageRec);
            } else if(data.imgCategory == 'CUSTOMER_ATTACHMENT') {
                imageRec = await CustomerAttachmentImage.getImage(data.imageId);
                await CustomerAttachmentImage.delImage(imageRec);
            } else {
                imageRec = await Image.getImage(data.imageId);
                await Image.delImage(imageRec);
            }
            execStatus.MSG = 'Deleted the image successfully!';
        } catch(e) {
            execStatus.STATUS = 'ERROR';
            execStatus.MSG = e.message;
        } finally {
            return execStatus;
        }
    }

    Image.remoteMethod('deleteByIdAPI', {
        accepts: {
            arg: 'data',
            type: 'object',
            default: {

            },
            http: {
                source: 'body',
            },
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/del-by-id', verb: 'delete'},
        description: 'Delete the saved Image'
    });

    /*Image.storeAndGetImageID = async (picture) => {
        try{
            let imageId = null;

            if(picture.imageId)
                return picture.imageId;

            let hashKey = Image.generateHashKey(picture);
            if(hashKey) {
                let alreadyExists = await Image.checkIfAlreadyExists(hashKey);
                if(alreadyExists) {
                    imageId = alreadyExists.id;
                } else {
                    picture.hashKey = hashKey;
                    imageId = await Image.saveImage(picture);
                }
            }
            return imageId;
        } catch(e) {
            // TODO: Log error
            throw e;
        }
    }*/

    Image.upload = (req, res) => {
        return new Promise( (resolve, reject) => {
            // SOURCE: https://github.com/santhosharuchamy/loopback-file-upload/blob/90a7ac8ece/Loopback%20custom%20fileupload.js
            let serverFile = { localFile: '', originalName: '', mimeType: '' };
            let storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    var dirPath = utils.getPictureUploadPath(); // checking and creating uploads folder where files will be uploaded
                 if (!fs.existsSync(dirPath))
                        fs.mkdirSync(dirPath);
                    cb(null, dirPath + '/');
                },
                filename: function (req, file, cb) {
                    var ext = file.originalname.substring(file.originalname.lastIndexOf(".")); // file will be accessible in `file` variable
                    var fileName = Date.now() + ext;
                    serverFile.localFile = fileName;
                    serverFile.originalName = file.originalname;
                    serverFile.mimeType = file.mimetype;
                    cb(null, serverFile.localFile);
                }
            });
            let upload = multer({
                storage: storage
            }).array('pic', 12);
            upload(req, res, (err) => {
                if (err) {
                    // An error occurred when uploading
                    reject(err);
                } else {
                    let path = utils.getPictureUploadPath();
                    resolve({path: path, options: serverFile});
                }
            });
        });
    }

    Image.writeImgFromBase64 = (picData) => {
        return new Promise( (resolve, reject) => {
            let fileName = Date.now() + '.png';
            let dirPath = utils.getPictureUploadPath();

            let filePathAndName = dirPath + fileName;

            fs.writeFile(filePathAndName, picData.pic, 'base64', function(err) {
                if(err)
                    return reject(err);
                else
                    return resolve({fileName: fileName, path: filePathAndName, format: 'image/png'});
            });
        });
    }

    Image.getImage = (imageId) => {
        return new Promise( (resolve, reject) => {
            db.query('SELECT * FROM image WHERE Id = ?', [imageId], (err, result) => {
            // Image.findById(imageId, (err, result) => {
                if(err)
                    return reject(err);
                else
                    return resolve(result);
            });
        });
    }

    Image.delImage = (imageRec) => {
        return new Promise( (resolve, reject) => {
            if(imageRec.storageMode == 'PATH') {
                fs.unlink(imageRec.path, (error) => {
                    if (error) return reject(error);
                    db.query('DELETE FROM image WHERE Id = ?', [imageRec.id], (err, response) => {
                        if(err)
                            return reject(err);
                        else
                            return resolve(true);
                    });
                });
            } else {
                db.query('DELETE FROM image WHERE Id = ?', [imageRec.id], (err, response) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(true);
                });
            }

        });
    }

    Image.checkIfAlreadyExists = (hashKey) => {
        return new Promise( (resolve, reject) => {
            db.query('SELECT * FROM image WHERE HashKey = ?', [hashKey], (err, result) => {
                if(err) {
                    //TODO: Log the error
                    return reject(err);
                } else {
                    if(result)
                        return resolve(result);
                    else
                        return resolve(false);
                }
            });
        });
    }

    Image.saveImage = (picture) => {
        return new Promise( (resolve, reject) => {
            db.query('INSERT INTO image (HashKey, Image, Format, Path, StorageMode, Optional) VALUES (?,?,?,?,?,?)', [
                picture.hashKey,
                picture.value,
                picture.format,
                picture.path,
                picture.storageMode,
                picture.options
            ], (err, result) => {
                if(err) {
                    //TODO: log the error
                    let error = new Error('Image upload Failed: ');
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

    Image.generateHashKey = (params) => {
        let hashKey = sh.unique(params.value + params.format);
        return hashKey;
    }
// };

export default router;