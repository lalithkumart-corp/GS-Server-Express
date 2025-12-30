'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
let dateformat = require('dateformat');
const { remoteMethod } = require('../routes/remoteMethod.js');

const UDHAAR_LIST = 'UDHAAR_LIST';
const UDHAAR_LIST_COUNT = 'UDHAAR_LIST_COUNT';

import db from '../db/index.js';
import express from 'express';
import { UdhaarSettingsCls } from './udhaar-settings.js';
import { FundTransactionCls } from './fund-transaction.js';
const router = express.Router();
export default router;

export class UdhaarCls {
    constructor() {
        this.udhaarSettings = new UdhaarSettingsCls();
        this.fundTransaction = new FundTransactionCls();
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    createApi(apiParams, cb) {
        this._createApi(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    _createApi(apiParams) {
        return new Promise(async (resolve, reject) => {
            apiParams._userId = await  utils.getStoreOwnerUserId(apiParams.accessToken);
            let sql = SQL.CREATE_UDHAAR.replace(/REPLACE_USERID/g, apiParams._userId);
            apiParams._uniqId = (+ new Date());
            let billNo = apiParams.billNo;
            if(apiParams.billSeries)
                billNo = apiParams.billSeries + '.' + apiParams.billNo;
            apiParams._billNo = billNo;
            let queryValues = [apiParams._uniqId, billNo, apiParams.amount, dateformat(apiParams.udhaarCreationDate, 'yyyy-mm-dd HH:MM:ss', true), apiParams.accountId, apiParams.customerId, apiParams.notes,
                                apiParams.interestPct, apiParams.interestVal, apiParams.landedCost];
            db.query(sql, queryValues, async (err, res) => {
                if(err){
                    reject(err);
                } else {
                    await this.udhaarSettings.updateNextBillNumber(apiParams._userId, (parseInt(apiParams.billNo)+1));
                    this.fundTransaction.add(apiParams, 'udhaar');
                    resolve(true);
                }
            });
        });
    }

    updateApi(apiParams, cb) {
        this._updateApi(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }
    _updateApi(apiParams) {
        return new Promise(async (resolve, reject) => {
            apiParams._userId = await  utils.getStoreOwnerUserId(apiParams.accessToken);
            let sql = SQL.UPDATE_UDHAAR.replace(/REPLACE_USERID/g, apiParams._userId);
            let billNo = apiParams.billNo;
            if(apiParams.billSeries)
                billNo = apiParams.billSeries + '.' + apiParams.billNo;
            apiParams.modifiedDate = new Date().toISOString().replace('T', ' ').slice(0,23);
            let queryValues = [billNo, apiParams.amount, dateformat(apiParams.udhaarCreationDate, 'yyyy-mm-dd HH:MM:ss', true), apiParams.accountId, apiParams.customerId, apiParams.notes,
                                apiParams.interestPct, apiParams.interestVal, apiParams.landedCost, apiParams.modifiedDate, apiParams.udhaarUid];
            db.query(sql, queryValues, async (err, res) => {
                if(err){
                    reject(err);
                } else {
                    this.fundTransaction.update(apiParams, 'udhaar');
                    resolve(true);
                }
            });
        });
    }

    async fetchCustomerBillHistoryAPIHandler(accessToken, customerId, include_only, cb) {
        try {
            let billList = await this.fetchHistory({accessToken: accessToken, customerId: customerId, includeOnly: include_only});
            return {STATUS: 'success', RESPONSE: billList, STATUS_MSG: ''};
        } catch(e) {
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    async fetchHistory(params) {
        return new Promise( async (resolve, reject) => {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let sql = SQL.CUSTOMER_BILL_HISTORY.replace(/REPLACE_USERID/g, params._userId);
            if(params.includeOnly == "pending")
                sql +=  ` AND status=1`;
            else if(params.includeOnly == "closed")
                sql += ` AND status=0`;
            db.query(sql, [params.customerId], (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    getUdhaarBillsAPIHandler(accessToken, apiParams, cb) {
        this._getUdhaarBillsAPIHandler(accessToken, apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }
    _getUdhaarBillsAPIHandler(accessToken, apiParams) {
        return new Promise(async (resolve, reject) => {
            apiParams._userId = await utils.getStoreOwnerUserId(accessToken);

            let promise1 = new Promise((resolve, reject) => {
                let query = this._constructQuery(UDHAAR_LIST, apiParams);
                db.query(query, (err, res) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(res);
                });
            });

            let promise2 = new Promise((resolve, reject) => {
                let query = this._constructQuery(UDHAAR_LIST_COUNT, apiParams);
                db.query(query, (err, res) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(res);
                });
            });

            Promise.all([promise1, promise2])
            .then(
                (results) => {
                    let obj = {
                        list: results[0],
                        count: results[1][0]['count']
                    }
                    resolve(obj);
                },
                (error) => {
                    reject(error);
                }
            )
            .catch(
                (exception) => {
                    reject(exception);
                }
            )
        });
    }

    _constructQuery(identifier, params) {
        let filterPart = '';
        let whereCondList = [];
        let orderClause = '';
        let limitOffsetClause = '';
        let sql = '';
        switch(identifier) {
            case UDHAAR_LIST:
            case UDHAAR_LIST_COUNT:
                sql = SQL[identifier];
                let filters = params.filters;
                if(filters.startDate && filters.endDate)
                    whereCondList.push(`udhaar_REPLACE_USERID.date BETWEEN '${filters.startDate}' AND '${filters.endDate}'`);
                if(filters.customerName)
                    whereCondList.push(`customer_REPLACE_USERID.Name LIKE '${filters.customerName}%' `);
                if(filters.guardianName)
                    whereCondList.push(`customer_REPLACE_USERID.GuardianName LIKE '${filters.guardianName}%' `);
                if(filters.place)
                    whereCondList.push(`customer_REPLACE_USERID.Place LIKE '${filters.place}%' `);
                if(filters.address)
                    whereCondList.push(`customer_REPLACE_USERID.Address LIKE '${filters.address}%' `);
                if(filters.mobile)
                    whereCondList.push(`customer_REPLACE_USERID.Mobile LIKE '${filters.mobile}%' `);
                if(filters.include && filters.include != 'all') {
                    if(filters.include == 'pending') whereCondList.push(`udhaar_REPLACE_USERID.status=1`);
                    else if(filters.include == 'closed') whereCondList.push(`udhaar_REPLACE_USERID.status=0`);
                } 
                if (whereCondList.length > 0)
                    filterPart = ` WHERE ${whereCondList.join(' AND ')}`;

                if (identifier == UDHAAR_LIST) {
                    if (params.limit !== undefined && params.offsetStart !== undefined)
                      limitOffsetClause = ` LIMIT ${params.limit} OFFSET ${params.offsetStart}`;
          
                    orderClause = 'ORDER BY udhaar_REPLACE_USERID.date DESC';
                }
                break;
        }
        sql = sql.replace('WHERE_CLAUSE', filterPart);

        sql = sql.replace('ORDER_CLAUSE', orderClause);

        sql = sql.replace('LIMIT_OFFSET_CLAUSE', limitOffsetClause);

        sql = sql.replace(/REPLACE_USERID/g, params._userId);
        return sql;
    }

    getUdhaarDetailApi(accessToken, udhaarUid, cb) {
        this._getUdhaarDetailApi(accessToken, udhaarUid).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR-No Response', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }
    _getUdhaarDetailApi(accessToken, udhaarUid) {
        return new Promise(async (resolve, reject) => {
            let _userId = await  utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.UDHAAR_DETAIL.replace(/REPLACE_USERID/g, _userId);
            db.query(sql, [udhaarUid], async (err, res) => {
                if(err){
                    reject(err);
                } else {
                    let detail = Udhaar.constructUdhaarDetailResponse(res);
                    resolve({detail: detail});
                }
            });
        });
    }
    constructUdhaarDetailResponse(res) {
        try {
            if(res && res.length > 0) {
                let detail = {
                    udhaarUid: res[0].udhaarUid,
                    udhaarBillNo: res[0].udhaarBillNo,
                    udhaarAmt: res[0].udhaarAmt,
                    udhaarDate: res[0].udhaarDate,
                    udhaarNotes: res[0].udhaarNotes,
                    udhaarStatus: res[0].udhaarStatus,
                    udhaarTrashedFlag: res[0].udhaarTrashedFlag,
                    udhaarInterestPct: res[0].udhaarInterestPct,
                    udhaarInterestVal: res[0].udhaarInterestVal,
                    udhaarInterestPct: res[0].udhaarInterestPct,
                    customerInfo: {
                        customerId: res[0].customerId,
                        customerName: res[0].customerName,
                        guardianName: res[0].guardianName,
                        address: res[0].address,
                        place: res[0].place,
                        city: res[0].city,
                        pincode: res[0].pincode,
                        mobile: res[0].mobile,
                        secMobile: res[0].secMobile
                    },
                    fundTransactions: []
                };
                _.each(res, (aRow, index) => {
                    detail.fundTransactions.push({
                        fundTrnsDate: aRow.fundTrnsDate,
                        fundTrnsCashIn: aRow.fundTrnsCashIn,
                        fundTrnsCashOut: aRow.fundTrnsCashOut,
                        fundTrnsCategory: aRow.fundTrnsCategory,
                        fundTrnsRemarks: aRow.fundTrnsRemarks,
                        fundTrnsDeleted: aRow.fundTrnsDeleted,
                        fundTrnsCashOutMode: aRow.fundTrnsCashOutMode,
                        fundTrnsCashOutToBankId: aRow.fundTrnsCashOutToBankId,
                        fundTrnsCashOutToBankIfsc: aRow.fundTrnsCashOutToBankIfsc,
                        fundTrnsCashOutToUpi: aRow.fundTrnsCashOutToUpi,
                        fundTrnsCashInMode: aRow.fundTrnsCashInMode,
                        fundHouseName: aRow.fundHouseName
                    });
                });
                return detail;
            } else {
                return null;
            }
        } catch(e) {
            throw e;
        }
    }
    
    closeUdhaarApiHandler(apiParams, cb) {
        apiParams.status = 0;
        this._closeUdhaar(apiParams).then((resp) => {
            if(resp.status)
                cb(null, {STATUS: 'SUCCESS', RESP: resp.data});
            else
                cb(null, {STATUS: 'ERROR-No Response', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    async _closeUdhaar(apiParams) {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);

            let row = await this._fetchUdhaarRowDB(apiParams.uid, apiParams._userId);
            if(!row) {
                throw 'Udhaar data not found in DB. Could not able to close the specific udhaar';
            }

            let params = {
                _userId: apiParams._userId,
                uids: [apiParams.uid],
                excludeInternal: true
            };

            let cashIn = 0;
            let cashOut = 0;
            let list = await this.fundTransaction._fetchTransactionByBillFromDB(params);
            _.each(list, (aTransaction) => {
                cashIn += aTransaction.cash_in;
                cashOut += aTransaction.cash_out;
            });
            let amountReceived = cashIn-cashOut;
            
            if(amountReceived < row.amount)
                throw `Principal Amount Rs:${row.amount} is not yet recovered. Amount recovered is Rs:${amountReceived}. Hence could not able to close the udhaar`;
            let closingBillParams = {
                uid: (+ new Date()),
                closing_amt: amountReceived,
                udhaarTableUid: apiParams.uid,
                principalAmt: row.amount,
                interest_amt: amountReceived-row.amount,
                _userId: apiParams._userId
            }
            await Udhaar._insertIntoClosedBillsTbl(closingBillParams);
            await Udhaar._updateUdhaarStatus(apiParams._userId, 0, apiParams.uid);

            return {status: true};
        } catch(e) {
            console.log(e);
            return {status: false, message: e.message};
        }
    }

    _fetchUdhaarRowDB(uid, _userId) {
        return new Promise((resolve, reject) => {
            let qry = SQL.UDHAAR_LIST_PLAIN.replace(/REPLACE_USERID/g, _userId)
            db.query(qry, [uid], (err, res) => {
                let row = null;
                if(err) {
                    console.log(err);
                } else {
                    row = res[0];
                }
                return resolve(row);
            });
        });
    }

    markResolvedByPaymentClerance(apiParams, cb) {
        this._markResolvedByPaymentClerance(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    _markResolvedByPaymentClerance(apiParams) {
        return new Promise(async (resolve, reject) => {
            try {
                apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                let params = {
                    _userId: apiParams._userId,
                    uids: [apiParams.uid]
                };
                let list = await this.fundTransaction._fetchTransactionByBillFromDB(params);
                let cashIn = 0;
                let cashOut = 0;
                _.each(list, (aTransaction) => {
                    cashIn += aTransaction.cash_in;
                    cashOut += aTransaction.cash_out;
                });
                let bal = cashOut-cashIn;
                if(bal<1)
                    await Udhaar._updateUdhaarStatus(apiParams._userId, 0, apiParams.uid);
                return resolve(true);
            } catch(e) {
                return reject(e);
            }
        });
    }

    _updateUdhaarStatus(userId, status, uid) {
        return new Promise((resolve, reject) => {
            let sql = SQL.UPDATE_STATUS_UDHAAR_TBL;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [status, uid], (err, res) => {
                if(err)
                    return reject(err);
                else
                    return resolve(true);
            });
        });
    }

    _insertIntoClosedBillsTbl(params) {
        return new Promise((resolve, reject) => {
            const queryParams = [
                params.uid, params.udhaarTableUid,
                params.principalAmt, params.closing_amt, params.interest_amt
            ];
            let qry = SQL.INSERT_INTO_CLOSING_BILLS_TBL.replace(/REPLACE_USERID/g, params._userId);
            db.query(qry, queryParams, (err, res) => {
                if(err) return reject(err);
                else return resolve(true);
            });
        });
    }

    reopenUdhaarApiHandler(apiParams, cb) {
        apiParams.status = 1;
        this._reopenUdhaarApiHandler(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR-No Response', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    async _reopenUdhaarApiHandler(apiParams) {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            let row = await Udhaar._fetchUdhaarRowDB(apiParams.uid, apiParams._userId);
            if(!row) {
                throw 'Udhaar data not found in DB. Could not able to close the specific udhaar';
            }
            await Udhaar._deleteEntryFromClosedBillTbl(apiParams.uid, apiParams._userId);
            await Udhaar._updateUdhaarStatus(apiParams._userId, 1, apiParams.uid);
        } catch(e) {
            throw e;
        }
    }

    _deleteEntryFromClosedBillTbl(udhaarTblUid, _userId) {
        return new Promise((resolve, reject) => {
            let qry = SQL.DELETE_ROW_IN_UDHAAR_CLOSED_TBL.replace(/REPLACE_USERID/g, _userId);
            db.query(qry, [udhaarTblUid], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }
}

export const Udhaar = new UdhaarCls();

    Udhaar.remoteMethod('createApi', {
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
        http: {path: '/create-udhaar', verb: 'post'},
        description: 'Udhaar - Creation.',
    });

    Udhaar.remoteMethod('updateApi', {
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
        http: {path: '/update-udhaar', verb: 'post'},
        description: 'Udhaar - Update.',
    });

    Udhaar.remoteMethod('fetchCustomerBillHistoryAPIHandler', {
        accepts: [{
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Accesstoken',
            },
            {
                arg: 'customerId', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let customerId = req && req.query.customer_id;
                    return customerId;
                },
                description: 'customerId',
            },
            {
                arg: 'include_only', type: 'string', http: (ctx) =>  {
                    let req = ctx && ctx.req;
                    let include_only = "all";
                    if(req && req.query && req.query.include_only)
                        include_only = req.query.include_only;
                    return include_only;
                },
                description: "Require only pending or closed or all..."
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            }
        },
        http: {path: '/fetch-customer-history', verb: 'get'},
        description: 'For fetching customer total bill history'
    });

    Udhaar.remoteMethod('getUdhaarBillsAPIHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'params', type: 'object', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let params = req && req.query.params;
                    params = params ? JSON.parse(params) : {};
                    return params;
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
        http: {path: '/get-udhaar-bills', verb: 'get'},
        description: 'For fetching Udhaar bills.',
    });

    Udhaar.remoteMethod('getUdhaarDetailApi', {
        accepts: [{
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Accesstoken',
            },
            {
                arg: 'udhaarUid', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let udhaarUid = req && req.query.uid;
                    return udhaarUid;
                },
                description: 'udhaarUid',
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            }
        },
        http: {path: '/get-udhaar-detail', verb: 'get'},
        description: 'For fetching udhaar detail'
    });

    Udhaar.remoteMethod('markResolvedByPaymentClerance', {
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
        http: {path: '/mark-resolved-by-payment-clearance', verb: 'post'},
        description: 'Udhaar - Mark resolved if all payments cleared.',
    });

    Udhaar.remoteMethod('closeUdhaarApiHandler', {
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
        http: {path: '/close-udhaar', verb: 'post'},
        description: 'Udhaar - Mark closed.',
    });

    Udhaar.remoteMethod('reopenUdhaarApiHandler', {
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
        http: {path: '/reopen-udhaar', verb: 'post'},
        description: 'Udhaar - Reopen',
    });

    


let SQL = {
    CREATE_UDHAAR: `INSERT INTO udhaar_REPLACE_USERID (unique_identifier, bill_no, amount, date, account_id, customer_id, notes, interest_pct, interest_val, landed_cost)
                        VALUES(?,?,?,?,?,?,?,?,?,?)`,
    UPDATE_UDHAAR: `UPDATE
                        udhaar_REPLACE_USERID
                            SET
                        bill_no=?,
                        amount=?,
                        date=?,
                        account_id=?,
                        customer_id=?,
                        notes=?,
                        interest_pct=?,
                        interest_val=?,
                        landed_cost=?,
                        modified_date=?
                            WHERE
                        unique_identifier=?`,
    CUSTOMER_BILL_HISTORY: `SELECT                         
                                udhaar_REPLACE_USERID.unique_identifier AS udhaarUid,
                                udhaar_REPLACE_USERID.bill_no AS udhaarBillNo,
                                udhaar_REPLACE_USERID.amount AS udhaarAmt,
                                udhaar_REPLACE_USERID.date AS udhaarDate,
                                udhaar_REPLACE_USERID.account_id AS udhaarAccId,
                                udhaar_REPLACE_USERID.notes AS udhaarNotes,
                                udhaar_REPLACE_USERID.trashed AS udhaarTrashedFlag,
                                udhaar_REPLACE_USERID.interest_pct AS udhaarInterestPct,
                                udhaar_REPLACE_USERID.interest_val AS udhaarInterestVal,
                                udhaar_REPLACE_USERID.landed_cost AS udhaarLandedCost,
                                udhaar_REPLACE_USERID.status AS udhaarStatus
                            FROM
                                udhaar_REPLACE_USERID
                                    LEFT JOIN
                                customer_REPLACE_USERID ON udhaar_REPLACE_USERID.customer_id = customer_REPLACE_USERID.CustomerId
                            WHERE
                                udhaar_REPLACE_USERID.customer_id = ?`,
    UDHAAR_LIST_PLAIN: `SELECT * FROM udhaar_REPLACE_USERID where udhaar_REPLACE_USERID.unique_identifier = ?`,
    UDHAAR_LIST: `SELECT                         
                                udhaar_REPLACE_USERID.unique_identifier AS udhaarUid,
                                udhaar_REPLACE_USERID.bill_no AS udhaarBillNo,
                                udhaar_REPLACE_USERID.amount AS udhaarAmt,
                                udhaar_REPLACE_USERID.date AS udhaarDate,
                                udhaar_REPLACE_USERID.account_id AS udhaarAccId,
                                udhaar_REPLACE_USERID.notes AS udhaarNotes,
                                udhaar_REPLACE_USERID.interest_pct AS udhaarInterestPct,
                                udhaar_REPLACE_USERID.interest_val AS udhaarInterestVal,
                                udhaar_REPLACE_USERID.landed_cost AS udhaarLandedCost,
                                udhaar_REPLACE_USERID.trashed AS udhaarTrashedFlag,
                                udhaar_REPLACE_USERID.status AS udhaarStatus,
                                customer_REPLACE_USERID.Name AS customerName,
                                customer_REPLACE_USERID.GaurdianName AS guardianName,
                                customer_REPLACE_USERID.Address AS address,
                                customer_REPLACE_USERID.Place AS place,
                                customer_REPLACE_USERID.City AS city,
                                customer_REPLACE_USERID.Pincode AS pincode,
                                customer_REPLACE_USERID.Mobile AS mobile,
                                customer_REPLACE_USERID.SecMobile AS secMobile
                            FROM
                                udhaar_REPLACE_USERID
                                    LEFT JOIN
                                customer_REPLACE_USERID ON udhaar_REPLACE_USERID.customer_id = customer_REPLACE_USERID.CustomerId
                            WHERE_CLAUSE
                            ORDER_CLAUSE
                            LIMIT_OFFSET_CLAUSE`,
    UDHAAR_LIST_COUNT: `SELECT
                                    COUNT(*) AS count
                                FROM
                                    udhaar_REPLACE_USERID
                                        LEFT JOIN
                                    customer_REPLACE_USERID ON udhaar_REPLACE_USERID.customer_id = customer_REPLACE_USERID.CustomerId
                                WHERE_CLAUSE`,
    UDHAAR_DETAIL: `SELECT
                        udhaar_REPLACE_USERID.unique_identifier AS udhaarUid,
                        udhaar_REPLACE_USERID.bill_no AS udhaarBillNo,
                        udhaar_REPLACE_USERID.amount AS udhaarAmt,
                        udhaar_REPLACE_USERID.date AS udhaarDate,
                        udhaar_REPLACE_USERID.notes AS udhaarNotes,
                        udhaar_REPLACE_USERID.status AS udhaarStatus,
                        udhaar_REPLACE_USERID.trashed AS udhaarTrashedFlag,
                        udhaar_REPLACE_USERID.interest_pct AS udhaarInterestPct,
                        udhaar_REPLACE_USERID.interest_val AS udhaarInterestVal,
                        udhaar_REPLACE_USERID.landed_cost AS udhaarLandedCost,
                        fund_transactions_REPLACE_USERID.id AS fundTrnsId,
                        fund_transactions_REPLACE_USERID.account_id AS udhaarAccId,
                        fund_transactions_REPLACE_USERID.transaction_date AS fundTrnsDate,
                        fund_transactions_REPLACE_USERID.cash_in AS fundTrnsCashIn,
                        fund_transactions_REPLACE_USERID.cash_out AS fundTrnsCashOut,
                        fund_transaction_categories.category AS fundTrnsCategory,
                        fund_transactions_REPLACE_USERID.remarks AS fundTrnsRemarks,
                        fund_transactions_REPLACE_USERID.deleted AS fundTrnsDeleted,
                        fund_transactions_REPLACE_USERID.cash_out_mode AS fundTrnsCashOutMode,
                        fund_transactions_REPLACE_USERID.cash_out_to_bank_ifsc AS fundTrnsCashOutToBankIfsc,
                        fund_transactions_REPLACE_USERID.cash_in_mode AS fundTrnsCashInMode,
                        fund_accounts.name AS fundHouseName,
                        customer_REPLACE_USERID.CustomerId AS customerId,
                        customer_REPLACE_USERID.Name AS customerName,
                        customer_REPLACE_USERID.GaurdianName AS guardianName,
                        customer_REPLACE_USERID.Address AS address,
                        customer_REPLACE_USERID.Place AS place,
                        customer_REPLACE_USERID.City AS city,
                        customer_REPLACE_USERID.Pincode AS pincode,
                        customer_REPLACE_USERID.Mobile AS mobile,
                        customer_REPLACE_USERID.SecMobile AS secMobile
                    FROM
                        udhaar_REPLACE_USERID
                        LEFT JOIN fund_transactions_REPLACE_USERID ON (fund_transactions_REPLACE_USERID.gs_uid = udhaar_REPLACE_USERID.unique_identifier)
                        LEFT JOIN fund_transaction_categories ON (fund_transactions_REPLACE_USERID.category_id=fund_transaction_categories.id AND fund_transaction_categories.user_id=REPLACE_USERID)
                        LEFT JOIN fund_accounts ON fund_transactions_REPLACE_USERID.account_id = fund_accounts.id
                        LEFT JOIN customer_REPLACE_USERID ON (customer_REPLACE_USERID.CustomerId = udhaar_REPLACE_USERID.customer_id)
                    WHERE
                        unique_identifier = ? AND fund_transactions_REPLACE_USERID.deleted=0`,
    MARK_RESOLVED: `UPDATE udhaar_REPLACE_USERID SET status=0 WHERE unique_identifier=?`,
    UPDATE_STATUS_UDHAAR_TBL: `UPDATE udhaar_REPLACE_USERID SET status=? WHERE unique_identifier=?`,
    INSERT_INTO_CLOSING_BILLS_TBL: `INSERT INTO udhaar_closed_bills_REPLACE_USERID (uid, udhaar_tbl_uid, principal_amt, closing_amt, interest_amt) 
                    VALUES (?,?,?,?,?)`,
    DELETE_ROW_IN_UDHAAR_CLOSED_TBL: `DELETE FROM udhaar_closed_bills_REPLACE_USERID WHERE udhaar_tbl_uid=?`
};
