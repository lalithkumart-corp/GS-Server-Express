'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
import dateFormat from 'dateformat';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
import db from '../db/index.js';
import express from 'express';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();
const account_id_MAP = {
    shop: 1,
    bank: 2,
}

export class FundTransactionCls {
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    cashInApi(apiParams, cb) {
        this._cashInApi(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    _cashInApi(apiParams) {
        return new Promise( async (resolve, reject) => {
            let userId = await  utils.getStoreOwnerUserId(apiParams.accessToken);
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let categId = await this._getOrCreateCategoryId(userId, apiParams.category);
            let sql = SQL.CASH_TRANSACTION_IN.replace(/REPLACE_USERID/g, userId);
            let queryValues = [userId, apiParams.customerId, apiParams.accountId, dateFormat(apiParams.transactionDate, 'yyyy-mm-dd HH:MM:ss', true), apiParams.amount, 0, categId, apiParams.remarks, apiParams.paymentMode, currentTImeInUTCTimezone, currentTImeInUTCTimezone];
            db.query(sql, queryValues, (err, res) => {
                if(err){
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    cashOutApi(apiParams, cb) {
        this._cashOutApi(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    _cashOutApi(apiParams) {
        return new Promise( async (resolve, reject) => {
            let userId =await  utils.getStoreOwnerUserId(apiParams.accessToken);

            let destAccDetail = apiParams.destinationAccountDetail;
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let categId = await this._getOrCreateCategoryId(userId, apiParams.category);
            let queryValues = [userId, apiParams.customerId, apiParams.accountId, dateFormat(apiParams.transactionDate, 'yyyy-mm-dd HH:MM:ss', true), 0, apiParams.amount, categId, apiParams.remarks,
                apiParams.paymentMode, destAccDetail.accNo, destAccDetail.ifscCode, currentTImeInUTCTimezone, currentTImeInUTCTimezone];

            let sql = SQL.CASH_TRANSACTION_OUT.replace(/REPLACE_USERID/g, userId);
            db.query(sql, queryValues, (err, res) => {
                if(err){
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    fetchTransactionsApi(accessToken, params, cb) {
        this._fetchTransactionsApi(accessToken, params).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    fetchTransactionsApiV2(accessToken, params, cb) {
        this._fetchTransactionsApiV2(accessToken, params).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    fetchTransactionsOverviewApi(accessToken, params, cb) {
        this._fetchTransactionsOverviewApi(accessToken, params).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    fetchConsolTransactionsApi(accessToken, params, cb) {
        this._fetchConsolTransactionsApi(accessToken, params).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            },
            (error) => {
                cb(null, {STATUS: 'ERROR', ERR_RESP: error});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _appendFilters(sql, params, identifier) {
        let filterPart = '';
        let orderClause = '';
        let limitOffsetClause = '';
        let filters = [];
        switch(identifier) {
            case 'FETCH_TRANSACTION_LIST':
                filters.push('deleted = 0');
                if(params._userId)
                    filters.push(`fund_transactions_REPLACE_USERID.user_id=${params._userId}`);
                if(params.accounts) {
                    params.accounts = params.accounts.map((anAccount) => `'${anAccount}'`);
                    let joinedAccounts = params.accounts.join(', ');
                    filters.push(`fund_accounts.id in (${joinedAccounts})`);
                }
                if(params.category && params.category.length > 0) {
                    params.category = params.category.map((aCategory) => `'${aCategory}'`);
                    let joinedCategories = params.category.join(', ');
                    filters.push(`category in (${joinedCategories})`);
                }
                if(params.startDate && params.endDate)
                    filters.push(`(transaction_date BETWEEN '${params.startDate}' AND '${params.endDate}')`);
                
                if(params.orderCol && params.orderBy) {
                    if(params.orderCol == 'TRN_DATE')
                        orderClause = ` ORDER BY transaction_date ${params.orderBy}`;
                    else if(params.orderCol == 'CREATED_DATE')
                        orderClause = ` ORDER BY created_date ${params.orderBy}`;
                    else if(params.orderCol == 'MODIFIED_DATE')
                        orderClause = ` ORDER BY modified_date ${params.orderBy}`;
                } else {
                    orderClause = ` ORDER BY transaction_date ASC`;
                }
                if(params.offsetEnd != undefined || params.offsetStart != undefined) {
                    let limit = params.offsetEnd - params.offsetStart;
                    limitOffsetClause = ` LIMIT ${limit} OFFSET ${params.offsetStart}`;
                }
                break;
            case 'FETCH_TRANSACTION_LIST_V2':
            case 'FETCH_TRANSACTION_LIST_TOT_COUNT':
                filters.push('deleted = 0');
                if(params._userId)
                    filters.push(`fund_trns_tmp_REPLACE_USERID.user_id=${params._userId}`);
                if(params.accounts) {
                    let accountVal = params.accounts.map((anAccount) => `'${anAccount}'`);
                    let joinedAccounts = accountVal.join(', ');
                    filters.push(`fund_accounts.id in (${joinedAccounts})`);
                }
                if(params.category && params.category.length > 0) {
                    let categ = params.category.map((aCategory) => `'${aCategory}'`);
                    let joinedCategories = categ.join(', ');
                    filters.push(`category in (${joinedCategories})`);
                }
                if(params.startDate && params.endDate)
                    filters.push(`(transaction_date BETWEEN '${params.startDate}' AND '${params.endDate}')`);

                if(params.customerVal)
                    filters.push(`customer_REPLACE_USERID.Name like '${params.customerVal}%'`);

                if(params.remarks)
                    filters.push(`fund_trns_tmp_REPLACE_USERID.remarks like '%${params.remarks}%'`);

                if(params.tagId)
                    filters.push(`fund_trns_tmp_REPLACE_USERID.tag_indicator = ${params.tagId}`);

                if(identifier !== 'FETCH_TRANSACTION_LIST_TOT_COUNT') {
                    if(params.orderCol && params.orderBy) {
                        if(params.orderCol == 'TRN_DATE')
                            orderClause = ` ORDER BY transaction_date ${params.orderBy}`;
                        else if(params.orderCol == 'CREATED_DATE')
                            orderClause = ` ORDER BY created_date ${params.orderBy}`;
                        else if(params.orderCol == 'MODIFIED_DATE')
                            orderClause = ` ORDER BY modified_date ${params.orderBy}`;
                    } else {
                        orderClause = ` ORDER BY transaction_date DESC`;
                    }
                    if(params.offsetEnd != undefined || params.offsetStart != undefined) {
                        let limit = params.offsetEnd - params.offsetStart;
                        limitOffsetClause = ` LIMIT ${limit} OFFSET ${params.offsetStart}`;
                    }
                }
                break;
            case 'FETCH_TRANSACTION_LIST_GROUPIFIED': 
                filters.push('deleted = 0');
                if(params._userId)
                    filters.push(`fund_transactions_REPLACE_USERID.user_id=${params._userId}`);
                if(params.accounts) {
                    let accountVal = params.accounts.map((anAccount) => `'${anAccount}'`);
                    let joinedAccounts = accountVal.join(', ');
                    filters.push(`fund_accounts.id in (${joinedAccounts})`);
                }
                if(params.category && params.category.length > 0) {
                    let categ = params.category.map((aCategory) => `'${aCategory}'`);
                    let joinedCategories = categ.join(', ');
                    filters.push(`category in (${joinedCategories})`);
                }
                if(params.startDate && params.endDate) {
                    let sd = params.startDate.replace('T',' ').replace('Z', '');
                    let ed = params.endDate.replace('T',' ').replace('Z', '');
                    filters.push(`(transaction_date BETWEEN '${sd}' AND '${ed}')`);
                }

                if(params.customerVal)
                    filters.push(`customer_REPLACE_USERID.Name like '${params.customerVal}%'`);

                if(params.remarks)
                    filters.push(`fund_transactions_REPLACE_USERID.remarks like '%${params.remarks}%'`);
                if(params.orderCol && params.orderBy) {
                    if(params.orderCol == 'TRN_DATE')
                        orderClause = ` ORDER BY transaction_date ${params.orderBy}`;
                    else if(params.orderCol == 'CREATED_DATE')
                        orderClause = ` ORDER BY created_date ${params.orderBy}`;
                    else if(params.orderCol == 'MODIFIED_DATE')
                        orderClause = ` ORDER BY modified_date ${params.orderBy}`;
                } else {
                    orderClause = ` ORDER BY transaction_date DESC`;
                }
                break;

            case 'FETCH_CONSOL_LIST_FOR_BAL_SHEET':
                filters.push('deleted = 0');
                if(params.startDate && params.endDate) {
                    let sd = params.startDate.replace('T',' ').replace('Z', '');
                    let ed = params.endDate.replace('T',' ').replace('Z', '');
                    filters.push(`(transaction_date BETWEEN '${sd}' AND '${ed}')`);
                }
                break;

            case 'TRANSACTION_LIST_COLLECTIONS':
                filters.push('deleted = 0');
                if(params._userId)
                    filters.push(`fund_transactions_REPLACE_USERID.user_id=${params._userId}`);
                if(params.startDate && params.endDate)
                    filters.push(`(transaction_date BETWEEN '${params.startDate}' AND '${params.endDate}')`);
                break;
            case 'FETCH_TRANSACTION_LIST_BY_BILL':
                if(params._userId)
                    filters.push(`fund_transactions_REPLACE_USERID.user_id=${params._userId}`);
                // if(params.loan_uid) {
                //     if(params.closed_uid)
                //         filters.push(`(fund_transactions_REPLACE_USERID.gs_uid=${params.loan_uid} OR fund_transactions_REPLACE_USERID.gs_uid=${params.closed_uid})`);
                //     else
                //         filters.push(`fund_transactions_REPLACE_USERID.gs_uid=${params.loan_uid}`);
                // }
                if(params.excludeInternal)
                    filters.push(`fund_transactions_REPLACE_USERID.is_internal=0`);
                filters.push(`fund_transactions_REPLACE_USERID.gs_uid IN ('${params.uids.join("', '")}')`);
                break;
        }

        if(filters.length > 0)
            filterPart = ` WHERE ${filters.join(' AND ')}`;

        sql = sql.replace('WHERE_CLAUSE', filterPart);

        sql = sql.replace('ORDER_CLAUSE', orderClause);

        sql = sql.replace('LIMIT_OFFSET_CLAUSE', limitOffsetClause);

        // TABLE NAME REPLACEMENT
        // if(identifier == 'FETCH_TRANSACTION_LIST') sql = sql.replace(/FUND_TRNS_TBL_NAME/g, 'fund_transactions_REPLACE_USERID');
        // else if(identifier == 'FETCH_TRANSACTION_LIST_V2') sql = sql.replace(/FUND_TRNS_TBL_NAME/g, 'fund_trns_tmp_REPLACE_USERID');

        sql = sql.replace(/REPLACE_USERID/g, params._userId);
        return sql;
    }


    _fetchTransactionsApi(accessToken, params) {
        return new Promise(async (resolve, reject) => {
            params._userId =await  utils.getStoreOwnerUserId(accessToken);

            let promiseTasks = [];

            promiseTasks.push(this.fetchPaginatedList(params));
            
            if(params.fetchFundOverview) {
                promiseTasks.push(this.fetchFilterSuggestions(params));
                promiseTasks.push(this.fetchOpeningBalanceFromDB(params._userId, params.startDate));
                promiseTasks.push(this.fetchClosingBalanceFromDB(params._userId, params.endDate));
                promiseTasks.push(this.fetchCashInOutTotalsFromDB(params));
            }
            //  else {
            //     let limit = params.offsetEnd - params.offsetStart;
            //     let offset = params.offsetStart;
            //     promiseTasks.push(this.fetchPageWiseOpeningBalanceFromDB(params._userId, params.startDate, params.endDate, limit, offset));
            // }

            Promise.all(promiseTasks).then(
                (results) => {
                    let obj = this.constructTransactionListApiResponse(results, params);
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
            );
        });
    }

    _fetchTransactionsApiV2(accessToken, params) {
        return new Promise(async (resolve, reject) => {
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let promiseTasks = [];
            promiseTasks.push(this.fetchRecordsWithHelpOfProcedure(params));

            if(params.fetchFilterCollections) 
                promiseTasks.push(this.fetchFilterSuggestions(params));

            // if(params.consolidateCategories && params.consolidateCategories.length > 0)
            //     res = this.consolidate(res, params.consolidateCategories);

            Promise.all(promiseTasks).then(
                (results) => {
                    let obj = {
                        results: results[0].rows,
                        count: results[0].count
                    }
                    if(params.fetchFilterCollections)
                        obj.collections = this._constructCollections(results[1]);
                    
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
            );
        });
    };

    _constructCollections(collRes) {
            let collections = {
            count: collRes.length,
            fundAccounts: [],
            categories: [],
            // totalCashIn: 0,
            // totalCashOut: 0,
        };
        try {
            let categorySet = new Set();
            if(collections.count > 0) {
                _.each(collRes, (aColl, index) => {
                    if(aColl.fundAccountId) {
                        let existsArr = collections.fundAccounts.filter((anObj, index) => {
                            if(anObj.id == aColl.fundAccountId)
                                return true;
                        });
                        if(existsArr.length == 0)
                            collections.fundAccounts.push({id: aColl.fundAccountId, name: aColl.name});
                    }
                    if(aColl.category && collections.categories.indexOf(aColl.category) == -1)
                        categorySet.add(aColl.category);  //collections.categories.push(aColl.category);
                    // if(aColl.cash_in)
                    //     collections.totalCashIn += aColl.cash_in;
                    // if(aColl.cash_out)
                    //     collections.totalCashOut += aColl.cash_out;
                });
                collections.categories = Array.from(categorySet);
            }
        } catch(e) {
            console.error(e);
        }
        return collections;
    }

    _fetchTransactionsOverviewApi(accessToken, params) {
        return new Promise(async (resolve, reject) => {
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            
            let promiseTasks = [];
            promiseTasks.push(this.fetchOpeningBalanceFromDB(params._userId, params.startDate));
            promiseTasks.push(this.fetchClosingBalanceFromDB(params._userId, params.endDate));
            promiseTasks.push(this.fetchCashInOutTotalsFromDB(params));

            Promise.all(promiseTasks).then(
                (results) => {
                    let obj = {};
                        obj.openingBalance = results[0] || 0;
                        obj.closingBalance = results[1].closing_balance || 0;
                        obj.totalCashIn = results[2].total_cash_in || 0;
                        obj.totalCashOut = results[2].total_cash_out || 0;
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
            );
        });
    }

    fetchCategorySuggestionsApi(accessToken, mode, cb) {
        this._fetchCategorySuggestionsApi(accessToken, mode).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _fetchCategorySuggestionsApi(accessToken, mode) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let amountCondition;
            if(mode && mode.length > 0) {
                amountCondition = 'cash_in > 0';
                if(mode == 'cash-out')
                    amountCondition = 'cash_out > 0';
            }
            let sql = SQL.CATEGORY_LIST;
            sql += ` WHERE fund_transactions_REPLACE_USERID.user_id=${userId}`;
            if(amountCondition)
                sql += ` AND ${amountCondition}`;

            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    let arr = [];
                    _.each(res, (anObj, index) => {
                        if(anObj.category && arr.indexOf(anObj.category) == -1)
                            arr.push(anObj.category);
                    });
                    return resolve(arr);
                }
            });
        });
    }

    _fetchConsolTransactionsApi(accessToken, params) {
        return new Promise(async (resolve, reject) => {
            try {
                let userId = await utils.getStoreOwnerUserId(accessToken);
                let res;
                if(params.groupTerms && params.groupTerms.indexOf('COLSOLIDATE_ALL') != -1) {
                    res = await this.getListForBalanceSheet(params, userId);
                } else {
                    await this.truncateTempTable(userId);
                    await this.cloneToTempTable(params, userId);
                    await this.addGroupIds(params, userId);
                    res = await this.getListByGroups(params, userId);
                }
                return resolve({results: res});
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    truncateTempTable(userId) {
        return new Promise((resolve, reject) => {
            let sql = SQL.TRUNCATE_TRNS_TEMP_TBL;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    cloneToTempTable(params, userId) {
        return new Promise((resolve, reject) => {
            let sql = SQL.CLONE_FUND_TRNS_TO_TEMP_TBL;
            sql = this._appendFilters(sql, {...params, _userId: userId}, 'FETCH_TRANSACTION_LIST_GROUPIFIED');
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    addGroupIds(params, userId) {
        return new Promise((resolve, reject) => {
            let sql = SQL.ADD_GROUP_IDS;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [params.groupTerms], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    getListByGroups(params, userId) {
        return new Promise((resolve, reject) => {
            let sql = SQL.TRANSACTION_LIST_WITH_GROUPIFIED;
            sql = sql.replace(/REPLACE_USERID/g, userId);

            let limit = params.offsetEnd - params.offsetStart;
            let limitOffsetClause = ` LIMIT ${limit} OFFSET ${params.offsetStart}`;

            sql = sql.replace('LIMIT_OFFSET_CLAUSE', limitOffsetClause);
            
            db.query(sql, [params.groupTerms], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    getListForBalanceSheet(params, userId) {
        return new Promise((resolve, reject) => {
            try {
                let sql = SQL.CONSOLIDATED_LIST_FOR_BALANCE_SHEET;
                sql = this._appendFilters(sql, {...params, _userId: userId}, 'FETCH_CONSOL_LIST_FOR_BAL_SHEET');
                db.query(sql, (err, res) => {
                    if(err) {
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
            } catch(e) {
                console.log(e);
            }
        });
    }

    add(params, moduleIdentifier) {
        return new Promise(async (resolve, reject) => {
            try {
                switch(moduleIdentifier) {
                    case 'pledgebook':
                        await this.addGirviEntry(params);
                        break;
                    case 'redeem':
                        await this.addRedeemEntry(params);
                        break;
                    case 'udhaar':
                        await this.addUdhaarEntry(params);
                        break;
                    case 'jwl_sale':
                        await this.addJwlSaleEntry(params);
                        break;
                    case 'jwl_sale_return':
                        await this.addJwlSaleReturnEntry(params);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return resolve(true); // this is backend job, so allways returning true.
            }
        });
    }

    addGirviEntry(params) {
        return new Promise(async (resolve, reject) => {
            let parsedArg = params.parsedArg;
            let mode = null;
            let fromAcc = null;
            let toAcc = null;
            let accountNo = null;
            let upiId = null;
            let ifscCode = null;
            if(parsedArg.paymentDetails) {
                let pd = parsedArg.paymentDetails;
                mode = pd.mode;
                if(pd.mode == 'cash') {
                    fromAcc = pd.cash.fromAccountId;
                } else if(pd.mode == 'cheque') {
                    fromAcc = pd.cheque.fromAccountId;
                } else if(pd.mode == 'online') {
                    fromAcc = pd.online.fromAccountId;
                    toAcc = pd.online.toAccount.toAccountId;
                    accountNo = pd.online.toAccount.accNo;
                    upiId = pd.online.toAccount.upiId;
                    ifscCode = pd.online.toAccount.ifscCode;
                }
            }
            let categId = await this._getOrCreateCategoryId(parsedArg._userId, 'Girvi');
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let interestAndOtherCharges = parseFloat(parsedArg.interestValue) + parseFloat(parsedArg.otherCharges);
            let qv = [parsedArg._userId, parsedArg.customerId, 
                fromAcc, parsedArg.uniqueIdentifier, 
                parsedArg.date, interestAndOtherCharges, 
                parsedArg.amount, categId, 
                parsedArg.billNoWithSeries, mode, 
                accountNo, ifscCode,
                currentTImeInUTCTimezone, currentTImeInUTCTimezone];

            let sql = SQL.INTERNAL_GIRVI_TRANSACTION;
            sql = sql.replace(/REPLACE_USERID/g, parsedArg._userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    addRedeemEntry(params) {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<params.data.length; i++) {
                    let datum = params.data[i];
                    // let qv = [params._userId, 1, datum.redeemUID, datum.closedDate, datum.paidAmount, 0, 'Redeem', datum.billNo];

                    let mode = null;
                    let toAcc = null;
                    if(datum.paymentDetails) {
                        let pd = datum.paymentDetails;
                        mode = pd.mode;
                        toAcc = pd[mode].toAccountId;
                    }
                    let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
                    let categId = await this._getOrCreateCategoryId(params._userId, 'Redeem');
                    let qv = [params._userId, datum.customerId, toAcc, datum.redeemUID, datum.closedDate, datum.paidAmount, 0, categId, datum.billNo, mode, currentTImeInUTCTimezone, currentTImeInUTCTimezone];
                    
                    await this._addRedeemEntry(qv);
                }
                return resolve(true);
            } catch(e) {
                return reject(e);
            }
        });
    }

    _addRedeemEntry(qv) {
        return new Promise((resolve, reject) => {
            let sql = SQL.INTERNAL_REDEEM_TRANSACTION;
            sql = sql.replace(/REPLACE_USERID/g, qv[0]);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    addUdhaarEntry(params) {
        return new Promise(async (resolve, reject) => {
            let destAccDetail = params.destinationAccountDetail;
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let interestAndOtherCharges = parseFloat(params.interestVal);
            let categId = await this._getOrCreateCategoryId(params._userId, 'Udhaar');
            let qv = [params._userId, params.customerId, params.accountId, params._uniqId, dateFormat(params.udhaarCreationDate, 'yyyy-mm-dd HH:MM:ss', true), interestAndOtherCharges, params.amount, categId, params._billNo,
            params.paymentMode, destAccDetail.accNo, destAccDetail.ifscCode, currentTImeInUTCTimezone, currentTImeInUTCTimezone];

            let sql = SQL.INTERNAL_UDHAAR_TRANSACTION;
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    addJwlSaleEntry(params) {
        return new Promise(async (resolve, reject) => {
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let categId = await this._getOrCreateCategoryId(params.userId, 'Jwl Sale');
            let qv = [params.userId, params.customerId, params.accountId, params.gsUid, params.transactionDate, params.cashIn, 
                0, categId, params.remarks, params.cashInMode, currentTImeInUTCTimezone, currentTImeInUTCTimezone];
            
            let sql = SQL.INTERNAL_JWL_SALE_TRANSACTION;
            sql = sql.replace(/REPLACE_USERID/g, params.userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    addJwlSaleReturnEntry(params) {
        return new Promise(async (resolve, reject) => {
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let categId = await this._getOrCreateCategoryId(params.userId, 'Jwl Sale Return');
            let qv = [params.userId, params.customerId, params.accountId, params.gsUid, params.transactionDate, 0, 
                params.cashOut, categId, params.remarks, params.cashInMode, currentTImeInUTCTimezone, currentTImeInUTCTimezone];
            
            let sql = SQL.INTERNAL_JWL_SALE_TRANSACTION;
            sql = sql.replace(/REPLACE_USERID/g, params.userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    update(params, moduleIdentifier) {
        return new Promise(async (resolve, reject) => {
            try {
                switch(moduleIdentifier) {
                    case 'pledgebook':
                        await this.updateGirviEntry(params);
                        break;
                    case 'redeem':
                        await this.updateRedeemEntry(params);
                        break;
                    case 'udhaar':
                        await this.updateUdhaarEntry(params);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return resolve(true); // this is backend job, so allways returning true.
            }
        });
    }

    updateGirviEntry(params) {
        return new Promise((resolve, reject) => {
            let parsedArg = params.parsedArg;
            let mode = null;
            let fromAcc = null;
            let toAcc = null;
            let accountNo = null;
            let upiId = null;
            let ifscCode = null;
            if(parsedArg.paymentDetails) {
                let pd = parsedArg.paymentDetails;
                mode = pd.mode;
                if(pd.mode == 'cash') {
                    fromAcc = pd.cash.fromAccountId;
                } else if(pd.mode == 'cheque') {
                    fromAcc = pd.cheque.fromAccountId;
                } else if(pd.mode == 'online') {
                    fromAcc = pd.online.fromAccountId;
                    toAcc = pd.online.toAccount.toAccountId;
                    accountNo = pd.online.toAccount.accNo;
                    upiId = pd.online.toAccount.upiId;
                    ifscCode = pd.online.toAccount.ifscCode;
                }
            };

            let interestAndOtherCharges = parseFloat(parsedArg.interestValue) + parseFloat(parsedArg.otherCharges);
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let qv = [parsedArg.customerId, fromAcc, parsedArg.date, interestAndOtherCharges, parsedArg.amount, parsedArg.billNoWithSeries, mode, accountNo, ifscCode, currentTImeInUTCTimezone, parsedArg.uniqueIdentifier, parsedArg._userId];

            let sql = SQL.INTERNAL_GIRVI_TRANSACTION_UPDATE;
            sql = sql.replace(/REPLACE_USERID/g, parsedArg._userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    updateRedeemEntry(params) {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<params.data.length; i++) {
                    let datum = params.data[i];
                    // let qv = [params._userId, 1, datum.redeemUID, datum.closedDate, datum.paidAmount, 0, 'Redeem', datum.billNo];

                    let mode = null;
                    let toAcc = null;
                    if(datum.paymentDetails) {
                        let pd = datum.paymentDetails;
                        mode = pd.mode;
                        toAcc = pd[mode].toAccountId;
                    }
                    let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
                    let qv = [ datum.customerId, toAcc, datum.closedDate, datum.paidAmount, datum.billNo, mode, currentTImeInUTCTimezone, datum.redeemUID, params._userId];
                    await this._updateRedeemEntry(qv, params);
                }
                return resolve(true);
            } catch(e) {
                return reject(e);
            }
        });
    }

    _updateRedeemEntry(qv, options) {
        return new Promise((resolve, reject) => {
            let sql = SQL.INTERNAL_REDEEM_TRANSACTION_UPDATE;
            sql = sql.replace(/REPLACE_USERID/g, options._userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    updateUdhaarEntry(params) {
        return new Promise((resolve, reject) => {
            let destAccDetail = params.destinationAccountDetail;
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let interestAndOtherCharges = parseFloat(params.interestVal);
            let qv = [params.customerId, params.accountId, dateFormat(params.udhaarCreationDate, 'yyyy-mm-dd HH:MM:ss', true), interestAndOtherCharges, params.amount, params._billNo,
            params.paymentMode, destAccDetail.accNo, destAccDetail.ifscCode, currentTImeInUTCTimezone, params.udhaarUid, params._userId];

            let sql = SQL.INTERNAL_UDHAAR_TRANSACTION_UPDATE;
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }


    removeEntry(params, moduleIdentifier) {
        return new Promise(async (resolve, reject) => {
            try {
                switch(moduleIdentifier) {
                    case 'redeem':
                        await this.markRedeemEntryAsDeleted(params);
                        break;
                    case 'jwl_sale':
                        await this.markJwlSaleEntryAsDeleted(params);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return resolve(true); // this is backend job, so allways returning true.
            }
        });
    }

    markRedeemEntryAsDeleted(params) {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<params.data.length; i++) {
                    let datum = params.data[i];
                    let params2 = {_userId: params._userId, closedBillReference: datum.closedBillReference};
                    await this._markRedeemEntryAsDeleted(params2);
                }
                return resolve(true);
            } catch(e) {
                return reject(e);
            }
        });
    }

    _markRedeemEntryAsDeleted(params) {
        return new Promise( async (resolve, reject) => {
            let qv = [params._userId, params.closedBillReference];
            let sql = SQL.MARK_AS_DELETED;
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    markJwlSaleEntryAsDeleted(params) {
        return new Promise( async (resolve, reject) => {
            let qv = [params.userId, params.gsUid];
            let sql = SQL.MARK_AS_DELETED;
            sql = sql.replace(/REPLACE_USERID/g, params.userId);
            db.query(sql, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    getOpeningBalanceApi(accessToken, dateVal, cb) {
        this._getOpeningBalanceApi(accessToken, dateVal).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _getOpeningBalanceApi(accessToken, dateVal) {
        return new Promise( async (resolve, reject) => {
            try {
                let userId = await utils.getStoreOwnerUserId(accessToken);
                let openingBal = await this.fetchOpeningBalanceFromDB(userId, dateVal);
                return resolve(openingBal);
            } catch(e) {
                return reject(e);
            }
        });
    }

    fetchOpeningBalanceFromDB(userId, dateVal) {
        return new Promise( async (resolve, reject) => {
            let sql = SQL.OPENING_BALANCE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [userId, dateVal], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    if(res && res.length >0)
                        resolve(res[0].opening_balance);
                    else
                        resolve(0);
                }
            });
        });
    }

    fetchClosingBalanceFromDB(userId, dateVal) {
        return new Promise( async (resolve, reject) => {
            let sql = SQL.CLOSING_BALANCE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [userId, dateVal], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    if(res && res.length >0)
                        resolve({
                            closing_balance: res[0].closing_balance
                        });
                    else
                        resolve(0);
                }
            });
        });
    }

    fetchCashInOutTotalsFromDB(params) {
        return new Promise( async (resolve, reject) => {
            let sql = SQL.CASH_IN_OUT_TOTALS;
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, [params._userId, params.startDate, params.endDate], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    if(res && res.length >0)
                        resolve({
                            total_cash_in: res[0].total_cash_in,
                            total_cash_out: res[0].total_cash_out
                        });
                    else
                        resolve(0);
                }
            });
        });
    }


    deleteTransactionsApi(params, cb) {
        this._deleteTransactionsApi(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _deleteTransactionsApi(params) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            let sql = SQL.DELETE_TRANSACTIONS;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, [params.transactionIds, userId], (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            })
        });
    }

    addCashInForBill(params, cb) {
        this._addCashInForBill(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _addCashInForBill(params) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            let mode = null;
            let toAcc = null;
            if(params.paymentDetails) {
                let pd = params.paymentDetails;
                mode = pd.mode;
                toAcc = pd[mode].toAccountId;
            }
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let categId = await this._getOrCreateCategoryId(userId, params.category);

            let queryValues = [userId, params.customerId, toAcc, params.uniqueIdentifier, dateFormat(params.dateVal, 'yyyy-mm-dd HH:MM:ss', true),
                 params.paymentDetails.value, 0, categId, params.remarks, mode, currentTImeInUTCTimezone, currentTImeInUTCTimezone];
            
            let sql = SQL.ADD_CASH_FOR_BILL;
            sql = sql.replace(/REPLACE_USERID/g, userId);

            db.query(sql, queryValues, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    fetchTransactionsByBillIdApi(accessToken, uids, cb) {
        this._fetchTransactionsByBillIdApi(accessToken, uids).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _fetchTransactionsByBillIdApi(accessToken, uids) {
        return new Promise(async (resolve, reject) => {
            if(uids.length == 0)
                return reject('Bill ID is not passed.');
            let params = {uids: uids};
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let res = await this._fetchTransactionByBillFromDB(params);
            return resolve(res);
        });
    }

    _fetchTransactionByBillFromDB(params) {
        return new Promise((resolve, reject) => {
            let sql = SQL.TRANSACTION_LIST;
            sql = this._appendFilters(sql, params, 'FETCH_TRANSACTION_LIST_BY_BILL');
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    updateCashInDataApi(params, cb) {
        this._updateCashInDataApi(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _updateCashInDataApi(params) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            let categId = await this._getOrCreateCategoryId(userId, params.category);
            let queryValues = [params.accountId, params.customerId, dateFormat(params.transactionDate, 'yyyy-mm-dd HH:MM:ss', true), params.amount, categId, params.remarks, params.paymentMode, params.transactionId, userId];
            let sql = SQL.UPDATE_TRANSACTION_FOR_CASH_IN;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, queryValues, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    updateCashOutDataApi(params, cb) {
        this._updateCashOutDataApi(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    _updateCashOutDataApi(params) {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            let destAccDetail = params.destinationAccountDetail;
            let categId = await this._getOrCreateCategoryId(userId, params.category);
            let queryValues = [params.accountId, params.customerId, dateFormat(params.transactionDate, 'yyyy-mm-dd HH:MM:ss', true), 
                params.amount, categId, params.remarks, 
                params.paymentMode, destAccDetail.accNo, destAccDetail.ifscCode, params.transactionId, userId];
            let sql = SQL.UPDATE_TRANSACTION_FOR_CASH_OUT;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, queryValues, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    fetchPaginatedList(params) {
        return new Promise((resolve, reject) => {
            let sql = SQL.TRANSACTION_LIST;
            sql = this._appendFilters(sql, params, 'FETCH_TRANSACTION_LIST');
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    fetchFilterSuggestions(params) {
        return new Promise((resolve, reject) => {
            let totalSql = SQL.TRANSACTION_LIST_COLLECTIONS;
            totalSql = this._appendFilters(totalSql, params, 'TRANSACTION_LIST_COLLECTIONS');
            totalSql = totalSql.replace(/REPLACE_USERID/g, params._userId);
            db.query(totalSql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    // _.each()
                    return resolve(res);
                }
            });
        });
    }

    constructTransactionListApiResponse(results, reqParams) {
        let resp = {
            results: results[0]
        };
        if(reqParams.fetchFundOverview) {
            resp.collections = this._constructCollections(results[1]);
            resp.openingBalance = results[2] || 0;
            resp.closingBalance = results[3].closing_balance || 0;
            resp.totalCashIn = results[4].total_cash_in || 0;
            resp.totalCashOut = results[4].total_cash_out || 0;
        }
        return resp;
    }

    checkTempTableLoclStatus() {
        return new Promise((resolve, reject) => {
            let sql = SQL.TEMP_TABLE_LOCK_STATUS;
            sql = sql.replace(/WHERE_CLAUSE/g, `WHERE table_name="fund_trns_tmp_REPLACE_USERID"`);
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, (err, res) => {
                if(err) return reject(err);
                else return resolve(res[0].is_locked);
            });
        });
    }

    setLockStatus(status) {
        return new Promise((resolve, reject) => {
            let sql = SQL.SET_TEMP_TABLE_LOCK_STATUS;
            sql = sql.replace(/WHERE_CLAUSE/g, `WHERE table_name="fund_trns_tmp_REPLACE_USERID"`);
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, [status], (err, res) => {
                if(err) console.log(err);
                return resolve(true);
            });
        });
    }

    invokeStoredProcedure(params) {
        return new Promise((resolve, reject) => {
            let stDate = params.startDate.replace(/Z/, '').replace(/T/, ' ');
            let endDate = params.endDate.replace(/Z/, '').replace(/T/, ' ');
            let sql = `CALL fund_trns_procedure_REPLACE_USERID('${stDate}', '${endDate}', ${params._userId})`;
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });        
        });
    };

    // addGroupIds(params) {
    //     return new Promise((resolve, reject) => {
    //         let sql = SQL.ADD_GROUP_IDS;
    //         sql = sql.replace(/REPLACE_USERID/g, params._userId);
    // db.query(sql, [params.groupTerms], (err, res) => {
    //             if(err) {
    //                 return reject(err);
    //             } else {
    //                 return resolve(true);
    //             }
    //         });
    //     });
    // }

    fetchRecordsFromTempTable(params) {
        return new Promise((resolve, reject) => {
            let sql = SQL.TRANSACTION_LIST_V2;
            sql = this._appendFilters(sql, params, 'FETCH_TRANSACTION_LIST_V2');
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    fetchTotCountFromTempTable(params) {
        return new Promise((resolve, reject) => {
            let sql = SQL.TRANSACTION_LIST_TOT_COUNT;
            sql = this._appendFilters(sql, params, 'FETCH_TRANSACTION_LIST_TOT_COUNT');
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res[0].count);
                }
            });
        });
    }

    fetchRecordsWithHelpOfProcedure(params) {
        return new Promise(async (resolve, reject) => {

            let isLocked = 0;// await this.checkTempTableLoclStatus();
            if(isLocked) {
                params._retryAttemptForProcedureCall = params._retryAttemptForProcedureCall || 0;
                params._retryAttemptForProcedureCall++;
                if(params._retryAttemptForProcedureCall < 10) {
                    setTimeout(() => {
                        return this.fetchRecordsWithHelpOfProcedure(params);
                    }, 1000);
                } else {
                    // await this.setLockStatus(0);
                    return this.fetchRecordsWithHelpOfProcedure(params);
                }
            } else {
                // await this.setLockStatus(1);
                await this.invokeStoredProcedure(params);
                let res = await this.fetchRecordsWithTotCountFromTempTbl(params);
                // this.setLockStatus(0);
                return resolve(res);
            } 
        });
    }

    fetchRecordsWithTotCountFromTempTbl(params) {
        return new Promise((resolve, reject) => {
            let promiseTasks = [];
            promiseTasks.push(this.fetchRecordsFromTempTable(params));
            promiseTasks.push(this.fetchTotCountFromTempTable(params));
            Promise.all(promiseTasks).then(
                (results) => {
                    let obj = {
                        rows: results[0],
                        count: results[1]
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
            );
        });
    }

    /*this.getUdhaarListApi = (params, cb) => {
        this._getUdhaarListApi(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    this._getUdhaarListApi = (params) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            
            let promise1 = new Promise((resolve, reject) => {
                db.query()
            });
        });
    }*/

    addTag(apiParams) {
        return new Promise(async (resolve, reject) => {
            let sql = SQL.ADD_TAG;
            sql = sql.replace(/REPLACE_USERID/g, apiParams._userId);
            db.query(sql, [apiParams.tagNumber, apiParams.ids], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve('Tagged Successfully!');
                }
            });
        });
    }

    removeTag(apiParams) {
        return new Promise(async (resolve, reject) => {
            let sql = SQL.REMOVE_TAG;
            sql = sql.replace(/REPLACE_USERID/g, apiParams._userId);
            db.query(sql, [apiParams.ids], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve('Removed Tags Successfully!');
                }
            });
        });
    }

    async transactionsExportAPI(accessToken, params, res, cb) {
        try {
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let {rows} = await this.fetchRecordsWithHelpOfProcedure(params);
            rows = this.parseRecordsObtainedFromDB(rows);
            let fileLocation = utils.getCsvStorePath();
            let status = await this._writeCSVfile(rows, fileLocation);
            res.download(fileLocation, 'Fund Transactions.csv');
        } catch(e) {
            res.send({STATUS: 'error', ERROR: e});
        }
    }

    parseRecordsObtainedFromDB(rows) {
        try {
            return rows.map(row => {
                row.transaction_date = utils.convertDatabaseDateTimetoDateStr(row.transaction_date)
                return row;
            });
        } catch(e) {
            console.log(e);
            return rows;
        }
    }

    _writeCSVfile(jsonObj, fileLocation) {
        return new Promise((resolve, reject) => {
            const csvWriter = createCsvWriter({
                path: fileLocation,
                header: [
                    {id: 'transaction_date', title: 'Date'},
                    {id: 'fund_house_name', title: 'Account'},
                    {id: 'CustomerName', title: 'Customer'},
                    {id: 'category', title: 'Category'},
                    {id: 'remarks', title: 'Remarks'},
                    {id: 'cash_in', title: 'Cash In'},
                    {id: 'cash_out', title: 'Cash Out'},
                    {id: 'afterBal', title: 'Balance'}
                ]
            });
            csvWriter.writeRecords(jsonObj)
                .then(
                    () => {
                        resolve(true);
                        console.log('...Done');
                    },
                    (err) => {
                        console.log('ERROR occured.....');
                        console.error(err);
                        reject(err);
                    }
                )
                .catch(
                    (e) => {
                        console.log('Exception occured.....');
                        console.error(e);
                        reject(e);
                    }
                )
        });
    }

    async _getOrCreateCategoryId(userId, categoryText) {
        let res = await this._getCategId(userId, categoryText);
        let categId = null;
        if(res.length == 0) {
            let ins = await this._insertNewCateg(userId, categoryText);
            categId = ins.insertId;
        } else {
            categId = res[0].id;
        }
        return categId;
    }

    _getCategId(userId, categoryText) {
        return new Promise((resolve, reject) => {
            db.query(SQL.GET_CATEG_ID, [userId, categoryText], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    _insertNewCateg(userId, categoryText) {
        return new Promise((resolve, reject) => {
            db.query(SQL.INSERT_NEW_CATEGORY, [userId, categoryText], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }
}

export const FundTransaction = new FundTransactionCls();

// module.exports = function(FundTransaction) {
    FundTransaction.remoteMethod('cashInApi', {
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
        http: {path: '/cash-in', verb: 'post'},
        description: 'Transaction - CashIn.',
    });
    FundTransaction.remoteMethod('cashOutApi', {
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
        http: {path: '/cash-out', verb: 'post'},
        description: 'Transaction - CashOut.',
    });

    FundTransaction.remoteMethod('updateCashInDataApi', {
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
        http: {path: '/update-cash-in', verb: 'put'},
        description: 'Transaction update - CashIn.',
    });

    FundTransaction.remoteMethod('updateCashOutDataApi', {
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
        http: {path: '/update-cash-out', verb: 'put'},
        description: 'Transaction update - CashOut.',
    });

    FundTransaction.remoteMethod('fetchTransactionsApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
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
        http: {path: '/fetch-transactions', verb: 'get'},
        description: 'For fetching fund transactions.',
    });

    FundTransaction.remoteMethod('fetchTransactionsApiV2', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
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
        http: {path: '/fetch-transactions-v2', verb: 'get'},
        description: 'For fetching fund transactions.',
    });

    FundTransaction.remoteMethod('fetchTransactionsOverviewApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
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
        http: {path: '/fetch-transactions-overview', verb: 'get'},
        description: 'For fetching fund transactions overview.',
    });

    FundTransaction.remoteMethod('fetchConsolTransactionsApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
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
        http: {path: '/fetch-consol-transactions', verb: 'get'},
        description: 'For fetching consolidated fund transactions.',
    });

    FundTransaction.remoteMethod('fetchTransactionsByBillIdApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'uids', type: 'array', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let uids = req && req.query.uids;
                    return JSON.parse(uids);
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
        http: {path: '/fetch-transactions-by-bill', verb: 'get'},
        description: 'For fetching fund transactions.',
    });

    FundTransaction.remoteMethod('fetchCategorySuggestionsApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'mode', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let mode = req && req.query.mode;
                    return mode;
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
        http: {path: '/fetch-category-suggestions', verb: 'get'},
        description: 'For fetching fund transactions.',
    });

    FundTransaction.remoteMethod('getOpeningBalanceApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'dateVal', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let date = req && req.query.date;
                    return date;
                },
                description: 'Date Argument goes here',
            }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/get-opening-balance', verb: 'get'},
        description: 'For getting the Opening Balance by date.',
    });

    FundTransaction.remoteMethod('deleteTransactionsApi', {
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
        http: {path: '/delete-by-transactionid', verb: 'del'},
        description: 'Delete transactions by ID'
    });
    
    FundTransaction.remoteMethod('addCashInForBill', {
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
        http: {path: '/cash-in-for-bill', verb: 'post'},
        description: 'Transaction - CashIn.',
    });

    FundTransaction.remoteMethod('transactionsExportAPI', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'params', type: 'object', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let params = req && req.query.params;
                    params = params ? JSON.parse(params) : {};
                    return params;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'res', type: 'object', 'http': {source: 'res'}
            }
        ],
        isStatic: true,
        returns: [
            {arg: 'body', type: 'file', root: true},
            {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
          ],
        http: {path: '/export-transactions', verb: 'get'},
        description: 'For exporting the Fund Transactions'
    });

    /*FundTransaction.remoteMethod('getUdhaarListApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
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
        http: {path: '/fetch-udhaar-list', verb: 'get'},
        description: 'For getting the udhaar list by date.',
    });*/

    

    /*
    FundTransaction.fetchBalanceValByDateAndLimitRange = (userId, dateVal, endDate, limit, offset) => {
        return new Promise((resolve, reject) => {
            let sql = `SELECT
                            SUM(cash_in - cash_out) AS FundBalance
                        FROM (
                            SELECT
                                cash_in,
                                cash_out
                            FROM
                                fund_transactions_REPLACE_USERID
                            WHERE
                                user_id = ${userId}
                                AND transaction_date > '${dateVal}'
                                AND deleted = 0
                            ORDER BY transaction_date ASC
                            LIMIT ${offset}) AS t`;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    if(res && res.length >0)
                        resolve(res[0].FundBalance);
                    else
                        resolve(0);
                }
            })
        });
    }
    */

    // FundTransaction.fetchPageWiseOpeningBalanceFromDB = async (userId, startDate, endDate, limit, offset) => {
    //     let bal1 = await FundTransaction.fetchOpeningBalanceFromDB(userId, startDate);
    //     let bal2 = await FundTransaction.fetchBalanceValByDateAndLimitRange(userId, startDate, endDate, limit, offset);
    //     return bal1+bal2;
    // }

    
// }

let SQL = {
    GET_CATEG_ID: `SELECT id, category FROM fund_transaction_categories where user_id=? and category=?`,
    INSERT_NEW_CATEGORY: `INSERT INTO fund_transaction_categories (user_id, category) VALUES (?,?)`,
    CASH_TRANSACTION_IN: `INSERT INTO fund_transactions_REPLACE_USERID (user_id, customer_id, account_id, transaction_date, cash_in, cash_out, category_id ,remarks, cash_in_mode, created_date, modified_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    CASH_TRANSACTION_OUT: `INSERT INTO fund_transactions_REPLACE_USERID (user_id, customer_id, account_id, transaction_date, cash_in, cash_out, category_id, remarks, cash_out_mode, cash_out_to_bank_acc_no, cash_out_to_bank_ifsc, created_date, modified_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    INTERNAL_GIRVI_TRANSACTION: `INSERT INTO fund_transactions_REPLACE_USERID (user_id, customer_id, account_id, gs_uid, transaction_date, cash_in, cash_out, category_id, remarks, cash_out_mode, cash_out_to_bank_acc_no, cash_out_to_bank_ifsc, is_internal, created_date, modified_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?) ON DUPLICATE KEY UPDATE account_id=VALUES(account_id), transaction_date=VALUES(transaction_date), cash_in=VALUES(cash_in), cash_out=VALUES(cash_out), cash_out_mode=VALUES(cash_out_mode), cash_out_to_bank_acc_no=VALUES(cash_out_to_bank_acc_no), cash_out_to_bank_ifsc=VALUES(cash_out_to_bank_ifsc), modified_date=VALUES(modified_Date)`,
    INTERNAL_REDEEM_TRANSACTION: `INSERT INTO fund_transactions_REPLACE_USERID (user_id, customer_id, account_id, gs_uid, transaction_date, cash_in, cash_out, category_id, remarks, cash_in_mode, is_internal, created_date, modified_date) VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?) ON DUPLICATE KEY UPDATE account_id=VALUES(account_id), transaction_date=VALUES(transaction_date), cash_in=VALUES(cash_in), cash_out=VALUES(cash_out), cash_in_mode=VALUES(cash_in_mode), modified_date=VALUES(modified_date)`,
    INTERNAL_UDHAAR_TRANSACTION: `INSERT INTO fund_transactions_REPLACE_USERID (user_id, customer_id, account_id, gs_uid, transaction_date, cash_in, cash_out, category_id, remarks, cash_out_mode, cash_out_to_bank_acc_no, cash_out_to_bank_ifsc, is_internal, created_date, modified_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    INTERNAL_JWL_SALE_TRANSACTION: `INSERT INTO fund_transactions_REPLACE_USERID (user_id, customer_id, account_id, gs_uid, transaction_date, cash_in, cash_out, category_id, remarks, cash_in_mode, is_internal, created_date, modified_date) VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?) ON DUPLICATE KEY UPDATE account_id=VALUES(account_id), transaction_date=VALUES(transaction_date), cash_in=VALUES(cash_in), cash_out=VALUES(cash_out), cash_in_mode=VALUES(cash_in_mode), modified_date=VALUES(modified_date)`,
    INTERNAL_GIRVI_TRANSACTION_UPDATE: `UPDATE fund_transactions_REPLACE_USERID SET customer_id=?, account_id=?, transaction_date=?, cash_in=?, cash_out=?, remarks=?, cash_out_mode=?, cash_out_to_bank_acc_no=?, cash_out_to_bank_ifsc=?, modified_date=? WHERE gs_uid=? AND user_id=? AND is_internal=1`,
    INTERNAL_REDEEM_TRANSACTION_UPDATE: `UPDATE fund_transactions_REPLACE_USERID SET customer_id=?, account_id=?, transaction_date=?, cash_out=?, remarks=?, cash_in_mode=?, modified_date=? WHERE gs_uid=? AND user_id=? AND is_internal=1`,
    INTERNAL_UDHAAR_TRANSACTION_UPDATE: `UPDATE fund_transactions_REPLACE_USERID SET customer_id=?, account_id=?, transaction_date=?, cash_in=?, cash_out=?, remarks=?, cash_out_mode=?, cash_out_to_bank_acc_no=?, cash_out_to_bank_ifsc=?, modified_date=? WHERE gs_uid=? AND user_id=? AND is_internal=1`,
    ADD_CASH_FOR_BILL: `INSERT INTO fund_transactions_REPLACE_USERID (user_id, customer_id, account_id, gs_uid, transaction_date, cash_in, cash_out, category_id, remarks, cash_in_mode, created_date, modified_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    UPDATE_TRANSACTION_FOR_CASH_IN: `UPDATE fund_transactions_REPLACE_USERID SET account_id=?, customer_id=?, transaction_date=?, cash_in=?, category_id=?, remarks=?, cash_in_mode=? WHERE id=? AND user_id=?`,
    UPDATE_TRANSACTION_FOR_CASH_OUT: `UPDATE fund_transactions_REPLACE_USERID SET account_id=?, customer_id=?, transaction_date=?, cash_out=?, category_id=?, remarks=?, cash_out_mode=?, cash_out_to_bank_acc_no=?, cash_out_to_bank_ifsc=? WHERE id=? AND user_id=?`,
    MARK_AS_DELETED: `UPDATE fund_transactions_REPLACE_USERID SET deleted=1 WHERE user_id=? AND gs_uid=?`,
    TRANSACTION_LIST: `SELECT 
                            fund_accounts.name AS fund_house_name,
                            fund_transactions_REPLACE_USERID.*,
                            fund_transaction_categories.category as category
                        FROM
                            fund_transactions_REPLACE_USERID
                                LEFT JOIN
                            fund_accounts ON fund_transactions_REPLACE_USERID.account_id = fund_accounts.id
                                LEFT JOIN
                            fund_transaction_categories ON fund_transactions_REPLACE_USERID.category_id=fund_transaction_categories.id
                        WHERE_CLAUSE
                        ORDER_CLAUSE
                        LIMIT_OFFSET_CLAUSE`,
    TRANSACTION_LIST_COLLECTIONS: `SELECT
                                        category,
                                        fund_accounts.name,
                                        fund_accounts.id AS fundAccountId,
                                        cash_in,
                                        cash_out
                                    FROM
                                        fund_transactions_REPLACE_USERID
                                            LEFT JOIN
                                        fund_accounts ON fund_transactions_REPLACE_USERID.account_id = fund_accounts.id
                                            LEFT JOIN
                                        fund_transaction_categories ON fund_transactions_REPLACE_USERID.category_id=fund_transaction_categories.id
                                    WHERE_CLAUSE
                                    ORDER_CLAUSE
                                    LIMIT_OFFSET_CLAUSE`,
    CATEGORY_LIST: `SELECT DISTINCT category from fund_transactions_REPLACE_USERID LEFT JOIN fund_transaction_categories ON fund_transactions_REPLACE_USERID.category_id=fund_transaction_categories.id`,
    OPENING_BALANCE: `SELECT SUM(cash_in-cash_out) AS opening_balance from fund_transactions_REPLACE_USERID WHERE user_id = ? AND transaction_date < ? AND deleted = 0`,
    CLOSING_BALANCE: `SELECT SUM(cash_in-cash_out) AS closing_balance from fund_transactions_REPLACE_USERID WHERE user_id = ? AND transaction_date < ? AND deleted = 0`,
    CASH_IN_OUT_TOTALS: `SELECT SUM(cash_in) AS total_cash_in, SUM(cash_out) AS total_cash_out from fund_transactions_REPLACE_USERID WHERE user_id = ? AND (transaction_date BETWEEN ? AND ?) AND deleted = 0`,
    DELETE_TRANSACTIONS: `DELETE FROM fund_transactions_REPLACE_USERID WHERE id IN (?) AND user_id=?`,
    TEMP_TABLE_LOCK_STATUS: `SELECT is_locked FROM temporary_table_manager WHERE_CLAUSE`,
    SET_TEMP_TABLE_LOCK_STATUS: `UPDATE temporary_table_manager SET is_locked=? WHERE_CLAUSE`,
    TRANSACTION_LIST_V2: `SELECT 
                            fund_accounts.name AS fund_house_name,
                            fund_trns_tmp_REPLACE_USERID.*,
                            customer_REPLACE_USERID.Name AS CustomerName,
                            alerts.id AS alertId,
                            alerts.title AS alertTitle,
                            alerts.message AS alertMsg,
                            alerts.extra_ctx AS alertExtraCtx,
                            alerts.has_read AS alertReadFlag,
                            alerts.archived AS alertArchivedFlag,
                            alerts.module AS alertModule,
                            alerts.trigger_time AS alertTriggerTime,
                            alerts.created_date AS alertCreatedDate,
                            fund_transaction_categories.category AS category
                        FROM
                            fund_trns_tmp_REPLACE_USERID
                                LEFT JOIN
                            fund_accounts ON fund_trns_tmp_REPLACE_USERID.account_id = fund_accounts.id
                                LEFT JOIN
                            fund_transaction_categories ON fund_trns_tmp_REPLACE_USERID.category_id=fund_transaction_categories.id
                                LEFT JOIN
                            customer_REPLACE_USERID ON customer_REPLACE_USERID.CustomerId = fund_trns_tmp_REPLACE_USERID.customer_id
                                LEFT JOIN
                            alerts ON (fund_trns_tmp_REPLACE_USERID.alert = alerts.id AND alerts.archived=0)
                        WHERE_CLAUSE
                        ORDER_CLAUSE
                        LIMIT_OFFSET_CLAUSE`,
    TRANSACTION_LIST_WITH_GROUPIFIED: `SELECT
                        fund_house_name,
                        transaction_date,
                        category,
                        GROUP_CONCAT(remarks) AS remarks,
                        SUM(cash_in) AS cash_in,
                        SUM(cash_out) AS cash_out,
                        grp_logic,
                        GROUP_CONCAT(CustomerName)
                    FROM (
                        SELECT
                            fund_accounts.name AS fund_house_name,
                            CAST(fund_trns_tmp_REPLACE_USERID.transaction_date AS DATE) AS transaction_date,
                            fund_transaction_categories.category AS category,
                            fund_trns_tmp_REPLACE_USERID.remarks,
                            fund_trns_tmp_REPLACE_USERID.cash_in,
                            fund_trns_tmp_REPLACE_USERID.cash_out,
                            fund_trns_tmp_REPLACE_USERID.grp_logic,
                            customer_REPLACE_USERID.Name AS CustomerName
                        FROM
                            fund_trns_tmp_REPLACE_USERID
                        LEFT JOIN fund_accounts ON fund_trns_tmp_REPLACE_USERID.account_id = fund_accounts.id
                        LEFT JOIN fund_transaction_categories ON fund_trns_tmp_REPLACE_USERID.category_id=fund_transaction_categories.id
                        LEFT JOIN customer_REPLACE_USERID ON customer_REPLACE_USERID.CustomerId = fund_trns_tmp_REPLACE_USERID.customer_id
                        ) t
                    GROUP BY
                        transaction_date,
                        category,
                        grp_logic,
                        fund_house_name
                    LIMIT_OFFSET_CLAUSE`,
    TRANSACTION_LIST_TOT_COUNT: `SELECT 
                                    Count(*) AS count
                                FROM
                                    fund_trns_tmp_REPLACE_USERID
                                        LEFT JOIN
                                    fund_accounts ON fund_trns_tmp_REPLACE_USERID.account_id = fund_accounts.id
                                        LEFT JOIN
                                    fund_transaction_categories ON fund_trns_tmp_REPLACE_USERID.category_id=fund_transaction_categories.id
                                        LEFT JOIN
                                    customer_REPLACE_USERID ON customer_REPLACE_USERID.CustomerId = fund_trns_tmp_REPLACE_USERID.customer_id
                                WHERE_CLAUSE`,
    TRUNCATE_TRNS_TEMP_TBL: `TRUNCATE TABLE fund_trns_tmp_REPLACE_USERID`,
    CLONE_FUND_TRNS_TO_TEMP_TBL: `INSERT INTO fund_trns_tmp_REPLACE_USERID (id, transaction_date, user_id, account_id, customer_id, gs_uid, category_id, remarks, deleted, cash_in, cash_out, created_date, modified_date, cash_out_mode, cash_out_to_bank_acc_no, cash_out_to_bank_ifsc, cash_in_mode, alert, is_internal, tag_indicator)
                                    SELECT
                                        fund_transactions_REPLACE_USERID.id,
                                        CAST(transaction_date AS DATETIME) AS transaction_date,
                                        fund_transactions_REPLACE_USERID.user_id,
                                        account_id,
                                        customer_id,
                                        gs_uid,
                                        category_id,
                                        remarks,
                                        deleted,
                                        cash_in,
                                        cash_out,
                                        fund_transactions_REPLACE_USERID.created_date,
                                        fund_transactions_REPLACE_USERID.modified_date,
                                        cash_out_mode,
                                        cash_out_to_bank_acc_no,
                                        cash_out_to_bank_ifsc,
                                        cash_in_mode,
                                        alert,
                                        is_internal,
                                        tag_indicator
                                    FROM
                                        fund_transactions_REPLACE_USERID
                                        LEFT JOIN fund_transaction_categories on fund_transaction_categories.id=fund_transactions_REPLACE_USERID.category_id
                                    WHERE_CLAUSE
                                    ORDER_CLAUSE`,
    ADD_GROUP_IDS: `UPDATE fund_trns_tmp_REPLACE_USERID
                        SET
                            grp_logic=id
                        WHERE 
                            category_id NOT IN (select id from fund_transaction_categories where category IN (?));`,
    CONSOLIDATED_TRANSACTION_LIST_DATE_WISE: `SELECT
                                        fund_house_name,
                                        SUM(cash_in) AS cash_in,
                                        SUM(cash_out) AS cash_out,
                                        category,
                                        GROUP_CONCAT(remarks) as remarks,
                                        transaction_date
                                    FROM (
                                        SELECT
                                            fund_accounts.name AS fund_house_name,
                                            account_id,
                                            cash_in,
                                            cash_out,
                                            fund_transaction_categories.category as category,
                                            remarks,
                                            CAST(transaction_date AS DATE) AS transaction_date
                                        FROM
                                            fund_transactions_REPLACE_USERID
                                                LEFT JOIN
                                            fund_accounts ON fund_transactions_REPLACE_USERID.account_id = fund_accounts.id
                                                LEFT JOIN
                                            fund_transaction_categories ON fund_transactions_REPLACE_USERID.category_id=fund_transaction_categories.id
                                        WHERE
                                            deleted = 0
                                            AND transaction_date BETWEEN ?
                                            AND ?) t
                                    GROUP BY
                                        transaction_date,
                                        category,
                                        account_id`,
    CONSOLIDATED_LIST_FOR_BALANCE_SHEET: `SELECT
                                            fund_transaction_categories.category as category,
                                            SUM(cash_in) AS cash_in,
                                            SUM(cash_out) AS cash_out
                                        FROM
                                            fund_transactions_REPLACE_USERID
                                                LEFT JOIN
                                            fund_transaction_categories ON fund_trns_tmp_REPLACE_USERID.category_id=fund_transaction_categories.id
                                        WHERE_CLAUSE
                                        GROUP BY
                                            category;`,
    ADD_TAG: `UPDATE fund_transactions_REPLACE_USERID 
                SET 
                    tag_indicator = ?
                WHERE
                    id IN (?);`,
    REMOVE_TAG: `UPDATE fund_transactions_REPLACE_USERID
                SET 
                    tag_indicator = NULL
                WHERE
                    id IN (?);`
};

export default router;