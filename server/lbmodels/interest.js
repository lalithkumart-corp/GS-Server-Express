'use strict';
let utils = require('../utils/commonUtils');
let app = require('../server.js');
let _ = require('lodash');


import express from 'express';
import db from '../db/index.js';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

class InterestCls {
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }
}

export const Interest = new InterestCls();


InterestCls.prototype.getInterestRatesAPIHanlder = async (accessToken) => {
    try {            
        if(!accessToken)
            throw 'Access Token is missing';
        let interestRatesDetails = await Interest._getInterestRates(accessToken);
        return {STATUS: 'SUCCESS', interestRatesDetails};
    } catch(e) {
        return { STATUS: 'ERROR', MESSAGE: e}
    }
}

InterestCls.prototype.remoteMethod('getInterestRatesAPIHanlder', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken = req && req.query.access_token;
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
    http: {path: '/get-interest-rates', verb: 'get'},
    description: 'For fetching interest rates.',
});

InterestCls.prototype.remoteMethod('addNewRateApi', {
    accepts: {
        arg: 'apiParams',
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
    http: {path: '/add-new-interest-rate', verb: 'post'},
    description: 'Add new Interest Rate'
});

InterestCls.prototype.remoteMethod('deleteInterestRateApi', {
    accepts: {
        arg: 'apiParams',
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
    http: {path: '/del-interest-rate', verb: 'delete'},
    description: 'Delete the interest rate'
});      

InterestCls.prototype._getInterestRates = (accessToken) => {
    return new Promise( async (resolve, reject) => {
        let _userId = await utils.getStoreOwnerUserId(accessToken);
        db.query('SELECT * FROM interest_rates WHERE user_id = ?', [_userId], (err, result) => {
            if(err) {
                return reject(err);
            } else {                   
                return resolve(result);
            }
        });
    });
}

InterestCls.prototype.addNewRateApi = async (apiParams) => {
    try {
        let userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
        // let row = {
        //     userId: userId,
        //     type: apiParams.metal,
        //     rangeFrom: apiParams.rangeFrom,
        //     rangeTo: apiParams.rangeTo,
        //     rateOfInterest: apiParams.interestVal
        // }
        let row = {
            user_id: userId,
            type: apiParams.metal,
            range_from: apiParams.rangeFrom,
            range_to: apiParams.rangeTo,
            rate_of_interest: apiParams.interestVal
        }
        await Interest._createRow(row);
        return {STATUS: 'SUCCESS'};
    } catch(e) {
        return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
    }
}
InterestCls.prototype._createRow = (row) => {
    return new Promise( (resolve, reject) => {
        db.query('INSERT INTO interest_rates SET ?', row, (err, result) => {
            if(err) {
                return reject(err);
            } else {
                return resolve(result);
            }
        });
    });
}

InterestCls.prototype.deleteInterestRateApi = async (apiParams) => {
    try {
        let userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
        await Interest._deleteFromTable(apiParams.id, userId);
        return {STATUS: 'SUCCESS'};
    } catch(e) {
        return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
    }
}

InterestCls.prototype._deleteFromTable = (id, userId) => {
    return new Promise((resolve, reject) => {
        let db = Interest.dataSource.settings.database;
        let sql = `DELETE FROM \`${db}\`.interest_rates WHERE (id=${id} AND user_id=${userId})`;
        db.query(sql, (err, res) => {
            if(err) {
                return reject(err);
            } else {
                return resolve(true);   
            }
        });
    });
}
