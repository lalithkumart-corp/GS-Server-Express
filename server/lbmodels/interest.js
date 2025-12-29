'use strict';
import express from 'express';
import db from '../db/index.js';
import utils from '../utils/commonUtils';
import { remoteMethod } from '../routes/remoteMethod.js';

const router = express.Router();

class InterestCls {
    constructor() {
        this.dataSource = {
            connector: {
                query: (sql, params) => db.query(sql, params)
            }
        };
    }

    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    async getInterestRatesAPIHanlder(accessToken) {
        try {
            if (!accessToken) throw new Error('Access Token is missing');
            const _userId = await utils.getStoreOwnerUserId(accessToken);
            const interestRatesDetails = await db.query('SELECT * FROM interest_rates WHERE user_id = ?', [_userId]);
            return { STATUS: 'SUCCESS', interestRatesDetails };
        } catch (e) {
            return { STATUS: 'ERROR', MESSAGE: e?.message || e };
        }
    }

    async addNewRateApi(apiParams) {
        try {
            const userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            const row = {
                user_id: userId,
                type: apiParams.metal,
                range_from: apiParams.rangeFrom,
                range_to: apiParams.rangeTo,
                rate_of_interest: apiParams.interestVal
            };
            await db.query('INSERT INTO interest_rates SET ?', row);
            return { STATUS: 'SUCCESS' };
        } catch (e) {
            return { STATUS: 'ERROR', ERROR: e, MSG: e?.message || '' };
        }
    }

    async deleteInterestRateApi(apiParams) {
        try {
            const userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            await db.query('DELETE FROM interest_rates WHERE id = ? AND user_id = ?', [apiParams.id, userId]);
            return { STATUS: 'SUCCESS' };
        } catch (e) {
            return { STATUS: 'ERROR', ERROR: e, MSG: e?.message || '' };
        }
    }
}

export const Interest = new InterestCls();

Interest.remoteMethod('getInterestRatesAPIHanlder', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                return req && req.query.access_token;
            },
            description: 'Arguments goes here',
        }
    ],
    returns: {
        type: 'object',
        root: true,
        http: { source: 'body' },
    },
    http: { path: '/get-interest-rates', verb: 'get' },
    description: 'For fetching interest rates.',
});

Interest.remoteMethod('addNewRateApi', {
    accepts: {
        arg: 'apiParams', type: 'object', default: {}, http: { source: 'body' },
    },
    returns: {
        type: 'object', root: true, http: { source: 'body' }
    },
    http: { path: '/add-new-interest-rate', verb: 'post' },
    description: 'Add new Interest Rate'
});

Interest.remoteMethod('deleteInterestRateApi', {
    accepts: {
        arg: 'apiParams', type: 'object', default: {}, http: { source: 'body' },
    },
    returns: {
        type: 'object', root: true, http: { source: 'body' }
    },
    http: { path: '/del-interest-rate', verb: 'delete' },
    description: 'Delete the interest rate'
});

export default router;
