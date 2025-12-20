import db from '../db/index.js';

// let app = require('../server.js')
import {appConfig} from '../config/index.js';
// let admin = require('../firebase-service');
let path = require('path');
const crypto = require('crypto');
const { verifyJwtToken } = require('../components/jwt.js');

// Getting userId ie., Store owner's user id
// const getStoreOwnerUserId = (accessToken) => {
//     return new Promise( (resolve, reject) => {
//         app.models.AccessToken.find({where: {id: accessToken}}, (err, res) => {
//             if(err) {
//                 console.error(err);
//                 return reject(err);
//             } else {
//                 if(res && res[0]) {
//                     let userId = res[0].userId;
//                     app.models.GsUser.findOne({where: {id: userId}}, (error, result) => {
//                         if(error){
//                             console.error(err);
//                             return reject(err);
//                         } else {
//                             if(result && result.ownerId != 0)
//                                 return resolve(result.ownerId);
//                             else
//                                 return resolve(res[0].userId);
//                         }
//                     });
//                 } else {
//                     return reject(new Error('SESSION EXPIRED. Login Again...'));
//                 }
//             }
//         });
//     });
// }

const getStoreOwnerUserIdNew = (req) => {
  return req.userId || null;
}

export const getStoreOwnerUserId = async (jwtToken) => {
    let validationRes = await verifyJwtToken(jwtToken);
    if(validationRes.status == 'VALID') {
        return validationRes.payload.id;
    } else {
        return null;
    }
}


export const executeSqlQuery = (dataSource, sql, arrValues) => {
    return new Promise((resolve, reject) => {
        // console.log(sql);
        if(arrValues) {
            db.query(sql, arrValues, (err, result) => {
                if(err) {
                    console.error(err);
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        } else {
            db.query(sql, (err, result) => {
                if(err) {
                    console.error(err);
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        }
    });   
}

export const getAppStatus = (ownerUserId) => {
    return new Promise((resolve, reject) => {
        console.log('Method: getAppStatus, ownerUserId:', ownerUserId);
        // app.models.AppManager.find({where: {userId: ownerUserId}}, (err, res) => {
        db.query('SELECT status FROM app WHERE user_id = ?', [ownerUserId], (err, res) => {
            if(err) {
                console.error(err);
                return reject(err);
            } else {
                if(res && res.length>0)
                    return resolve(res[0].status);
                else
                    return reject('NO user application found');
            }
        });
    });
}

// export const validateSSOAuthToken = (token) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let userInfo= await admin
//                                 .auth()
//                                 .verifyIdToken(token);
//             return resolve(userInfo);
//         } catch(e) {
//             console.error(e);
//             return resolve(null);
//         }
//     });
// }

export const getPictureUploadPath = () => {
    let path;
    try {
        if(process.env.NODE_ENV == 'offlineprod')
            path = process.cwd() + appConfig.clientUploadsPath
        else
            path = __dirname + appConfig.clientUploadsPath
        // console.log(`**** getPictureUploadPath -  process.env.NODE_ENV: ${process.env.NODE_ENV}, process.cwd(): ${process.cwd()}, __dirname: ${__dirname}, path: ${path}`);
    } catch(e) {
        console.error(e);
    }
    return path;
}

export const getCsvStorePath = () => {
    let csvPath;
    try {
        if(process.env.NODE_ENV == 'offlineprod')
            csvPath = path.join(process.cwd(), appConfig.get('clientCsvFolderPath'));
        else
            csvPath = path.join(__dirname, appConfig.get('clientCsvFolderPath'));
        // console.log(`getCsvStorePath -  process.env.NODE_ENV: ${process.env.NODE_ENV}, process.cwd(): ${process.cwd()}, __dirname: ${__dirname}, path: ${csvPath}`);
    } catch(e) {
        console.error(e);
    }
    return csvPath;
}

export const constructImageUrl = (path) => {
    if(path) {
        let url = '';
        try {
            url = `${appConfig.get('externalProtocol')}://${appConfig.get('externalDomain')}`;
            if(process.env.NODE_ENV == 'development')
                url += `:${appConfig.get('externalPort')}${path.substring(path.indexOf('/uploads'), path.length)}`;
            else if(process.env.NODE_ENV == 'offlineprod')
                url += `:${appConfig.get('externalPort')}${path.substring(path.indexOf('/uploads'), path.length)}`;
            else
                url += path.substring(path.indexOf('/client'), path.length);
            // console.log(`---- constructImageUrl-ForUI-Response- process.env.NODE_ENV: ${process.env.NODE_ENV}, externalProtocol: ${appConfig.get('externalProtocol')}, externalDomain: ${appConfig.get('externalDomain')}, pathDB: ${path}, url: ${url} `);
        } catch(e) {
            console.error(e);
        }
        return url;
    } else {
        return null;
    }
}

export const constructConsoleLogFolder = () => {
    let consoleLogFolder;
    try {
        console.log(appConfig.get('consoleLogFolder'), appConfig.get('clientCsvFolderPath'));
        if(process.env.NODE_ENV == 'offlineprod')
            consoleLogFolder = process.cwd() + appConfig.get('consoleLogFolder');
        else
            consoleLogFolder = __dirname + appConfig.get('consoleLogFolder');
        // console.log(`constructConsoleLogFolder -  process.env.NODE_ENV: ${process.env.NODE_ENV}, process.cwd(): ${process.cwd()}, __dirname: ${__dirname}, path: ${consoleLogFolder}`);
    } catch(e) {
        console.error(e);
    }
    return consoleLogFolder;
} 

// from DB, DATETIME col values will be as "Date Obj" in db response. So, lets make it as string
// DateTime in DB might be saved in UTC, but while retriving it from DB will be in GMT. (Ex: Pledgebbok table "Date")
// Ex: Input: DateOBJ(Sun Jul 31 2022 12:08:11 GMT+0530 (India Standard Time)),  Output: '31-07-2022 12:08:11'
export const convertDatabaseDateTimetoDateStr = (dateObj, options) => {
    if(typeof dateObj !== 'object')
        return dateObj;
    if(!dateObj)
        return;
    const twoDigitFormat = (val) => {
        val = parseInt(val);
        if(val < 10)
            val = '0'+val;
        return val;
    };
    let dd = twoDigitFormat(dateObj.getDate());
    let mm = twoDigitFormat(dateObj.getMonth() + 1);        
    let yyyy = dateObj.getFullYear();
    let hr = twoDigitFormat(dateObj.getHours());
    let min = twoDigitFormat(dateObj.getMinutes());
    let sec = twoDigitFormat(dateObj.getSeconds());
    let localDate = `${dd}-${mm}-${yyyy} ${hr}:${min}:${sec}`;
    if(options && options.skipTime)
        localDate = `${dd}-${mm}-${yyyy}`;
    return localDate;
}

// if current local time is Jul 31 2022 13:00:24, then output will be '2022-07-31 07:29:15'
export const getCurrentDateTimeInUTCForDB = () => {
    return new Date().toISOString().replace('T', ' ').slice(0,19);
}

// Encryption function
export const encrypt = (text, password) => {
    const cipher = crypto.createCipher('aes-256-cbc', password);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decryption function
export const decrypt = (encryptedText, password) => {
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export const safeParseJson = (jsonStr) => {
    if(!jsonStr) return null;
    let returnVal = null;
    try {
        returnVal = JSON.parse(jsonStr);
    } catch(e) {
        returnVal = null;
    }
    return returnVal;
}
