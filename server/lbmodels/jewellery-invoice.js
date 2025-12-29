'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
let JewelleryInvoiceHelper = require('./modelHelpers/jewelleryInvoice');

import { Stock } from './stock.js';
import db from '../db/index.js';
import express from 'express';
const router = express.Router();
export default router;

export class JwlInvoiceCls {
    constructor() {
        this.userService = new userService();
        this.appManager = new ApplicationManagerCls();
    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }


    async insertInvoiceData(payload) {
        try {
            let invoiceNoFull = payload.apiParams.invoiceNo;
            if(payload.apiParams.invoiceSeries)
                invoiceNoFull = `${payload.apiParams.invoiceSeries}.${payload.apiParams.invoiceNo}`;
            let sql = SQL.INSERT_JWL_INVOICE.replace(/INVOICE_TABLE/g, `jewellery_invoices_${payload._userId}`);
            let queryVal = [
                    payload._uniqString,
                    payload.apiParams.date,
                    invoiceNoFull,
                    payload.apiParams.customerId,
                    payload.apiParams.retailRate,
                    payload.apiParams.itemType,

                    payload.apiParams.calculations.totalInitialPrice,
                    payload.apiParams.calculations.totalCgstVal,
                    payload.apiParams.calculations.totalSgstVal,
                    payload.apiParams.calculations.totalDiscount,
                    payload.apiParams.calculations.totalPurchaseFinalPrice,
                    payload.apiParams.calculations.totalExchangeFinalPrice,
                    payload.apiParams.calculations.roundedOffVal,
                    payload.apiParams.calculations.grandTotal,

                    payload.apiParams.paymentFormData.paid,
                    payload.apiParams.paymentFormData.balance,
                    payload.apiParams.paymentFormData.paymentMode
                ];
            let result = await utils.executeSqlQuery(JwlInvoice.dataSource, sql, queryVal);
            return result;
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'JwlInvoice', methodName: 'insertInvoiceData', cause: e, message: 'Exception in sql query execution'}));
            console.log(e);
            throw e;
        }
    }

    //for pdf bill content
    getInvoiceDataByKey(accessToken, invoiceKeys, cb) {
        JwlInvoice._getInvoiceDataByKey(accessToken, invoiceKeys).then(
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

    async _getInvoiceDataByKey(accessToken, invoiceKeys) {
        try {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.INVOICE_DATA_NEW.replace(/REPLACE_USERID/g, _userId);
            let result = await utils.executeSqlQuery(JwlInvoice.dataSource, sql, [invoiceKeys]);
            if(result && result.length > 0) {
                let invoiceDataObj = JwlInvoice._constructInvoiceData(result);
                return Object.values(invoiceDataObj);
                // return result.map((aDbRow) => JSON.parse(aDbRow.invoice_data));
                // return result[0].invoice_data;
            }
            else
                return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    _constructInvoiceData(dbRows) {
        let finalResp = {};
        for(let i in dbRows) {
            let row = dbRows[i];
            if(!finalResp[row.i_invoice_ref]) {
                finalResp[row.i_invoice_ref] = {
                    itemType: row.t_metal,
                    goldRatePerGm: row.t_metal=='G'?row.i_daily_retail_rate:0,
                    silverRatePerGm: row.t_metal=='S'?row.i_daily_retail_rate:0,
                    billNo: row.i_invoice_no,
                    customerName: row.c_name,
                    customerMobile: row.c_mobile,
                    customerAddr: row.c_address,
                    customerPanNo: new JewelleryInvoiceHelper().getCustomerPan(row.c_other_details),
                    dateVal: row.i_invoice_date,
                    ornaments: [],
                    oldOrnaments: {},
                    calculations: {}
                }
            }
            finalResp[row.i_invoice_ref].ornaments.push({
                title: row.o_item_name,
                huid: row.s_huid,
                prodId: row.s_prod_id,
                qty: row.ii_qty,
                grossWt: row.ii_gross_wt,
                netWt: row.ii_net_wt,
                division: row.t_name,
                wastagePercent: row.ii_wastage_percent,
                pricePerGm: row.i_daily_retail_rate,
                wastageVal: row.ii_wastage_val,
                makingCharge: row.ii_making_charge,
                initialPrice: row.ii_initial_price,
                finalPrice: row.ii_final_price,
                cgstPercent: row.ii_cgst_percent,
                cgstVal: row.ii_cgst_val,
                sgstPercent: row.ii_sgst_percent,
                sgstVal: row.ii_sgst_val,
                discount: row.ii_discount,
                itemType: row.t_metal
            });
            finalResp[row.i_invoice_ref].oldOrnaments = {
                itemType: row.oi_item_type,
                grossWt: row.oi_gross_wt,
                netWt: row.oi_net_wt,
                lessWt: row.oi_wastage_val,
                netAmount: row.oi_price,
                pricePerGram: row.oi_daily_retail_rate
            };
            finalResp[row.i_invoice_ref].calculations = {
                totalInitialPrice: row.i_total_initial_price,
                totalDiscount: row.i_total_discount,
                totalCgstVal: row.i_total_cgst_val,
                totalSgstVal: row.i_total_sgst_val,
                totalPurchaseFinalPrice: row.i_total_purchase_final_price,
                totalExchangeFinalPrice: row.i_total_exchange_final_price,
                roundedOffVal: row.i_roundoff_val,
                grandTotal: row.i_grant_total
            }
        }
        return finalResp;
    };

    // for customer invoice page in UI
    getInvoiceRecordByKey(accessToken, invoiceKeys, cb) {
        JwlInvoice._getInvoiceRecordByKey(accessToken, invoiceKeys).then(
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

    _getInvoiceRecordByKey(accessToken, invoiceKeys) {
        try {
            // let _userId = await utils.getStoreOwnerUserId(accessToken);
            // let sql = SQL.INVOICE_RECORD.replace(/INVOICE_TABLE/g, `jewellery_invoices_${_userId}`);
            // let result = await utils.executeSqlQuery(JwlInvoice.dataSource, sql, [invoiceKeys]);
            // if(result && result.length > 0) {
            //     // return result.map((aDbRow) => JSON.parse(aDbRow.raw_data));
            //     return result;
            // }
            // else
            //     return null;

            // TODO:

            return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    async getCustomerInvoiceListApi(accessToken, filters) {
        try {
            let params = { filters };
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let list = await JwlInvoice._fetchJwlCustInvoiceList(params);
            return {STATUS: 'SUCCESS', CUST_INV_LIST: list};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _fetchJwlCustInvoiceList(params) {
        return new Promise( (resolve, reject) => {
            let sql = SQL.INVOICE_LIST_NEW;
            sql = JwlInvoice._injectFilterQuerypart(sql, params, 'list');
            // sql = sql.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${params._userId}`);
            // sql = sql.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${params._userId}`);
            sql = sql.replace(/REPLACE_USERID/g,  params._userId);
            db.query(sql, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(new JewelleryInvoiceHelper().dbRespToApiRespKeyMapper(res, 'invoice_list'));
                }
            });
        });
    }

    async getCustomerInvoiceListCountApi(accessToken, filters) {
        try {
            let params = { filters };
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let cnt = await this._fetchJwlCustInvoiceListCount(params);
            return {STATUS: 'SUCCESS', CUST_INV_LIST_COUNT: cnt};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _fetchJwlCustInvoiceListCount(params) {
        return new Promise( (resolve, reject) => {
            let sql = SQL.INVOICE_LIST_TOTALS;
            params.filters.fetchTotalCount = true;
            sql = this._injectFilterQuerypart(sql, params, 'count');
            // sql = sql.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${params._userId}`);
            // sql = sql.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${params._userId}`);
            sql = sql.replace(/REPLACE_USERID/g,  params._userId);
            db.query(sql, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res[0].totalInvoiceList);
                }
            });
        });
    }

    _injectFilterQuerypart(sql, params) {
        let whereClause = '';
        let {filters} = params;
        let whereConditionList = [];
        if(!filters.include_archived)
            whereConditionList.push('i.is_archived=0');
        if(filters.date && filters.date.startDate)
            whereConditionList.push(`i.invoice_date BETWEEN "${filters.date.startDate}" AND "${filters.date.endDate}"`);
        if(filters.invoiceNo)
            whereConditionList.push(`i.invoice_no LIKE "${filters.invoiceNo}%"`);
        if(filters.custName)
            whereConditionList.push(`c.Name LIKE "${filters.custName}%"`);
        if(filters.custGarudianName)
            whereConditionList.push(`c.GaurdianName LIKE "${filters.custGarudianName}%"`);
        if(filters.custAddr)
            whereConditionList.push(`c.Address LIKE "${filters.custAddr}%"`);
        
        if(filters.prodId)
            whereConditionList.push(`s.prod_id LIKE "${filters.prodId.toUpperCase()}%"`);

        if(filters.huid) 
            whereConditionList.push(`s.huid LIKE "${filters.huid.toUpperCase()}%"`);

        if(filters.includeReturnedInvoices == 'false' || filters.includeReturnedInvoices == false)
            whereConditionList.push(`i.is_returned=0`);
            
        if(filters.includeGoldOrnType == 'false' || filters.includeGoldOrnType == false)
            whereConditionList.push(`i.item_metal_type != 'G'`);

        if(filters.includeSilverOrnType == 'false' || filters.includeSilverOrnType == false)
            whereConditionList.push(`i.item_metal_type != 'S'`);

        if(filters.customerId)
            whereConditionList.push(`i.cust_id=${filters.customerId}`);

        if(whereConditionList.length > 0)
            whereClause = ` WHERE ${whereConditionList.join(' AND ')}`
        
        sql = sql.replace(/WHERE_CLAUSE/g, whereClause);
        
        if(!filters.fetchTotalCount) {
            sql += ' ORDER BY i.invoice_date DESC';
            if(filters.offsetEnd != undefined && filters.offsetStart != undefined)
                sql += ` LIMIT ${filters.offsetEnd-filters.offsetStart} OFFSET ${filters.offsetStart}`;
        }

        return sql;
    }
    
    async deleteInvoice(accessToken, params) {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let invoiceRef = params.invoiceRef;
            let soldItemDetails = await Stock._fetchSoldItemsByInvoiceId(userId, invoiceRef);
            if(soldItemDetails && soldItemDetails.length>0) {
                for(let i=0; i<soldItemDetails.length; i++) {
                    let anItem = soldItemDetails[i];
                    if(!anItem.is_returned) {
                        let itemDetail = {
                            prodId: anItem.prod_id,
                            qty: anItem.qty,
                            grossWt: anItem.gross_wt,
                            netWt: anItem.net_wt,
                            pureWt: anItem.pure_wt
                        }
                       await Stock._putBackFromInvoice(userId, itemDetail);
                    }
                    
                }
                await Stock._archiveSoldItemByInvoiceRef(userId, invoiceRef);
                await Stock._archiveOldOrnamentRecByInvoiceRef(userId, invoiceRef, 'original');
                await this._archiveByInvoiceRef(userId, invoiceRef);
                await this.app.models.FundTransaction.prototype.removeEntry({
                    userId,
                    gsUid: invoiceRef
                }, 'jwl_sale');
            } else {
                throw new Error("Items not found in DB to update back the qty and weight");
            }
            return { STATUS: 'SUCCESS', MSG: 'Archived the invoice and updated QTY and WT of specific item in stock table.'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    async _archiveByInvoiceRef(userId, invoiceRef) {
        try {
            let sql = SQL.MARK_ARCHIVED;
            sql = sql.replace(/INVOICE_TABLE/g, `jewellery_invoices_${userId}`);
            await utils.executeSqlQuery(this.dataSource, sql, [invoiceRef]);
            return true;
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    async _updateReturnFlagByInvoiceRef(userId, invoiceRef, charges, returnedAmt) {
        try {
            let currentTImeInUTCTimezone = utils.getCurrentDateTimeInUTCForDB();
            let sql = SQL.SET_RETURNED_FLAG_WITH_CHARGES;
            sql = sql.replace(/INVOICE_TABLE/g, `jewellery_invoices_${userId}`);
            await utils.executeSqlQuery(this.dataSource, sql, [charges, returnedAmt, currentTImeInUTCTimezone, invoiceRef]);
            return true;
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    async returnItemsApiHandler(accessToken, params) {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let invoiceRef = params.invoiceRef;
            let soldItemDetails = await Stock._fetchSoldItemsByInvoiceId(userId, invoiceRef);
            if(soldItemDetails && soldItemDetails.length>0) {
                for(let i=0; i<soldItemDetails.length; i++) {
                    let anItem = soldItemDetails[i];
                    let itemDetail = {
                        prodId: anItem.prod_id,
                        qty: anItem.qty,
                        grossWt: anItem.gross_wt,
                        netWt: anItem.net_wt,
                        pureWt: anItem.pure_wt
                    }
                   await Stock._putBackFromInvoice(userId, itemDetail);
                }
                let r = {
                    userId: userId,
                    gsUid: invoiceRef,
                    customerId: params.custId,
                    transactionDate: params.date,
                    remarks: params.invoiceNo,
                    cashInMode: params.paymentSelectionCardData.mode
                };
                await Stock._updateReturnFlagInStockSoldTblByInvoiceRef(userId, invoiceRef);
                await Stock._updateReturnFlagInOldOrnTblByInvoiceRef(userId, invoiceRef);
                await this._updateReturnFlagByInvoiceRef(userId, invoiceRef, params.charges, params.paymentSelectionCardData[r.cashInMode].value);

                if(params.paymentSelectionCardData.mode == 'mixed') {
                    await this.app.models.FundTransaction.prototype.add({
                        ...r,
                        cashOut: params.paymentSelectionCardData.mixed.cash.value,
                        cashOutMode: 'cash',
                        accountId: params.paymentSelectionCardData.mixed.cash.fromAccountId,
                    }, 'jwl_sale_return');
                    await this.app.models.FundTransaction.prototype.add({
                        ...r,
                        cashOut: params.paymentSelectionCardData.mixed.online.value,
                        cashOutMode: 'online',
                        accountId: params.paymentSelectionCardData.mixed.online.fromAccountId,
                    }, 'jwl_sale_return');
                } else {
                    await this.app.models.FundTransaction.prototype.add({
                        ...r,
                        cashOut: params.paymentSelectionCardData[r.cashInMode].value,
                        accountId: params.paymentSelectionCardData[r.cashInMode].fromAccountId,
                    }, 'jwl_sale_return');
                }
            } else {
                throw new Error("Items not found in DB to update back the qty and weight");
            }
            return { STATUS: 'SUCCESS', MSG: 'Marked the Invoice with Return flag and Added back the QTY and WT of specific item in stock table.'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

}

export const JewelleryInvoice = new JwlInvoiceCls();


JwlInvoice.remoteMethod('getInvoiceDataByKey', {
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
            arg: 'invoiceKeys', type: 'array', http: (ctx) => {
                let req = ctx && ctx.req;
                let invoiceKeysArrStr = req && req.query.invoice_keys;
                let invoiceKeyArr = [];
                if(invoiceKeysArrStr) invoiceKeyArr = JSON.parse(invoiceKeysArrStr);
                return invoiceKeyArr;
            },
            description: 'Arguments goes here',
        }],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/get-invoice-data', verb: 'get'},
    description: 'Jewellery Bill Invoice Date.',
});

JwlInvoice.remoteMethod('getInvoiceRecordByKey', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let authToken = null;
                if(req && req.headers.authorization)
                    authToken = req.headers.authorization || req.headers.Authorization;
                return authToken;
            },
            description: 'Arguments goes here',
        },
        {
            arg: 'invoiceKeys', type: 'array', http: (ctx) => {
                let req = ctx && ctx.req;
                let invoiceKeysArrStr = req && req.query.invoice_keys;
                let invoiceKeyArr = [];
                if(invoiceKeysArrStr) invoiceKeyArr = JSON.parse(invoiceKeysArrStr);
                return invoiceKeyArr;
            },
            description: 'Arguments goes here',
        }],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/get-invoice-record', verb: 'get'},
    description: 'Jewellery Bill Invoice Record.',
});

JwlInvoice.remoteMethod('getCustomerInvoiceListApi', {
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
            arg: 'filters', type: 'object', http: (ctx) => {
                let req = ctx && ctx.req;
                let filters = req && req.query.filters;
                filters = filters ? JSON.parse(filters) : {};
                return filters;
            },
            description: 'filters Arguments goes here',
    }],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/fetch-jewellery-cust-invoices-list', verb: 'get'},
    description: 'Jewellery - Customer Invoice List.',
});

JwlInvoice.remoteMethod('getCustomerInvoiceListCountApi', {
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
            arg: 'filters', type: 'object', http: (ctx) => {
                let req = ctx && ctx.req;
                let filters = req && req.query.filters;
                filters = filters ? JSON.parse(filters) : {};
                return filters;
            },
            description: 'filters Arguments goes here',
    }],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/fetch-jewellery-cust-invoices-list-count', verb: 'get'},
    description: 'Jewellery - Customer Invoice List count',
});

JwlInvoice.remoteMethod('deleteInvoice', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let authToken = null;
                if(req && req.headers.authorization)
                    authToken = req.headers.authorization || req.headers.Authorization;
                return authToken;
            },
            description: 'Arguments goes here',
        },
        {
            arg: 'params',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
    }],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/delete', verb: 'del'},
    description: 'Delete an Invoice'
});

JwlInvoice.remoteMethod('returnItemsApiHandler', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let authToken = null;
                if(req && req.headers.authorization)
                    authToken = req.headers.authorization || req.headers.Authorization;
                return authToken;
            },
            description: 'Arguments goes here',
        },
        {
            arg: 'params',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
    }],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body'
        }
    },
    http: {path: '/return-items', verb: 'post'},
    description: 'Return items'
});

let SQL = {
    INSERT_INVOICE_DETAIL: `INSERT INTO INVOICE_TABLE (invoice_date, ukey, invoice_no, cust_id, action, paid_amt, balance_amt, raw_data, invoice_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    INVOICE_RECORD: `SELECT * FROM INVOICE_TABLE WHERE ukey IN (?)`,

    INVOICE_LIST_TOTALS_OLD: `SELECT count(*) as totalInvoiceList
                    from 
                        INVOICE_TABLE as i 
                        LEFT JOIN customer_REPLACE_USERID as c ON i.cust_id = c.CustomerId`,
    INVOICE_LIST_TOTALS: `select count(*) as totalInvoiceList from (select 
                        i.invoice_date,
                        i.ukey,
                        i.invoice_no,
                        i.cust_id,
                        i.paid_amt,
                        i.balance_amt,
                        i.payment_mode,
                        i.created_date,
                        i.modified_date,
                        c.Name,
                        c.GaurdianName,
                        c.Address,
                        c.Mobile,
                        GROUP_CONCAT(s.prod_id) as prod_ids,
                        GROUP_CONCAT(s.huid) as huids
                    from
                        jewellery_invoices_REPLACE_USERID AS i
                            LEFT JOIN
                        customer_REPLACE_USERID AS c ON i.cust_id = c.CustomerId
                            LEFT JOIN
                        stock_sold_REPLACE_USERID AS s ON s.invoice_ref = i.ukey
                        WHERE_CLAUSE
                        GROUP BY i.invoice_date, i.ukey, i.invoice_no, i.cust_id, i.paid_amt, i.balance_amt, i.payment_mode, i.created_date, i.modified_date, c.Name, c.GaurdianName, c.Address, c.Mobile) A`,
    MARK_ARCHIVED: `UPDATE INVOICE_TABLE SET is_archived=1 where ukey=?`,
    SET_RETURNED_FLAG_WITH_CHARGES: `UPDATE INVOICE_TABLE SET is_returned=1, return_charges_val=?, returned_amt_val=?, returned_date=? where ukey=?`,
    INVOICE_LIST_NEW: `select 
                        i.invoice_date,
                        i.ukey,
                        i.invoice_no,
                        i.item_metal_type,
                        i.cust_id,
                        i.paid_amt,
                        i.balance_amt,
                        i.payment_mode,
                        i.is_returned,
                        i.return_charges_val,
                        i.returned_amt_val,
                        i.returned_date,
                        i.created_date,
                        i.modified_date,
                        c.Name,
                        c.GaurdianName,
                        c.Address,
                        c.Mobile,
                        GROUP_CONCAT(s.prod_id) as prod_ids,
                        GROUP_CONCAT(s.huid) as huids
                    from
                        jewellery_invoices_REPLACE_USERID AS i
                            LEFT JOIN
                        customer_REPLACE_USERID AS c ON i.cust_id = c.CustomerId
                            LEFT JOIN
                        stock_sold_REPLACE_USERID AS s ON s.invoice_ref = i.ukey
                        WHERE_CLAUSE
                        GROUP BY 
                            i.invoice_date, 
                            i.ukey, 
                            i.invoice_no, 
                            i.item_metal_type, 
                            i.cust_id, 
                            i.paid_amt, 
                            i.balance_amt, 
                            i.payment_mode, 
                            i.is_returned, 
                            i.return_charges_val, 
                            i.returned_amt_val,
                            i.returned_date,
                            i.created_date, 
                            i.modified_date, 
                            c.Name, c.GaurdianName, c.Address, c.Mobile`,
    INVOICE_DATA_NEW: `SELECT 
                        inv.jewellery_invoice_tbl_id AS i_jewellery_invoice_tbl_id,
                        inv.invoice_date AS i_invoice_date,
                        inv.ukey AS i_invoice_ref,
                        inv.invoice_no as i_invoice_no,
                        inv.cust_id AS i_cust_id,
                        inv.item_metal_type AS i_item_metal_type,
                        inv.daily_retail_rate AS i_daily_retail_rate,
                        inv.total_initial_price AS i_total_initial_price,
                        inv.total_cgst_val AS i_total_cgst_val,
                        inv.total_sgst_val AS i_total_sgst_val,
                        inv.total_discount AS i_total_discount,
                        inv.total_purchase_final_price AS i_total_purchase_final_price,
                        inv.total_exchange_final_price AS i_total_exchange_final_price,
                        inv.roundoff_val AS i_roundoff_val,
                        inv.grand_total AS i_grant_total,
                        inv.paid_amt AS i_paid_amt,
                        inv.balance_amt AS i_balance_amt,
                        inv.payment_mode AS i_payment_mode,
                        inv.is_returned AS i_is_returned,
                        inv.returned_amt_val AS i_returned_amt_val,
                        inv.returned_date AS i_returned_date,
                        inv.created_date AS i_created_date,
                        inv.modified_date AS i_modified_date,
                        inv_item.invoice_item_id AS ii_invoice_item_id,
                        inv_item.stock_tbl_item_uid as ii_stock_tbl_item_uid,
                        o.item_name as o_item_name,
                        s.huid as s_huid, 
                        s.prod_id as s_prod_id,
                        t.name as t_name,
                        t.metal as t_metal,
                        inv_item.qty AS ii_qty,
                        inv_item.gross_wt AS ii_gross_wt,
                        inv_item.net_wt AS ii_net_wt,
                        inv_item.wastage_percent AS ii_wastage_percent,
                        inv_item.wastage_val AS ii_wastage_val,
                        inv_item.making_charge AS ii_making_charge,
                        inv_item.initial_price AS ii_initial_price,
                        inv_item.discount AS ii_discount,
                        inv_item.cgst_percent AS ii_cgst_percent,
                        inv_item.cgst_val AS ii_cgst_val,
                        inv_item.sgst_percent AS ii_sgst_percent,
                        inv_item.sgst_val AS ii_sgst_val,
                        inv_item.final_price AS ii_final_price,
                        old_stock.id AS oi_id,
                        old_stock.item_type AS oi_item_type,
                        old_stock.gross_wt AS oi_gross_wt,
                        old_stock.net_wt AS oi_net_wt,
                        old_stock.wastage_val AS oi_wastage_val,
                        old_stock.applied_retail_rate AS oi_applied_retail_rate,
                        old_stock.daily_retail_rate AS oi_daily_retail_rate,
                        old_stock.price AS oi_price,
                        old_stock.created_date AS oi_created_date,
                        old_stock.modified_date AS oi_modified_date,
                        c.Name AS c_name,
                        c.GuardianRelation AS c_guardian_relation,
                        c.GuardianNamePrefix AS c_guardian_name_prefix,
                        c.GaurdianName AS c_gaurdian_name,
                        c.ImageId AS c_image_id,
                        c.Address AS c_address,
                        c.Place AS c_place,
                        c.City AS c_city,
                        c.Pincode AS c_pincode,
                        c.Mobile AS c_mobile,
                        c.OtherDetails AS c_other_details
                    FROM 
                        jewellery_invoices_REPLACE_USERID inv 
                        LEFT JOIN jewellery_invoice_items_REPLACE_USERID inv_item ON inv.ukey=inv_item.invoice_ref
                        LEFT JOIN old_items_stock_REPLACE_USERID old_stock ON inv.ukey=old_stock.invoice_ref
                        LEFT JOIN customer_REPLACE_USERID c ON inv.cust_id = c.CustomerId
                        left join stock_REPLACE_USERID s on s.uid = inv_item.stock_tbl_item_uid
                        left join orn_list_jewellery o on o.id=s.ornament
                        left join touch t on t.id=s.touch_id
                    WHERE inv.ukey IN (?)`,
    INSERT_JWL_INVOICE: `INSERT INTO INVOICE_TABLE (
                        ukey, invoice_date, 
                        invoice_no, cust_id, 
                        daily_retail_rate, item_metal_type, 
                        total_initial_price, total_cgst_val,
                        total_sgst_val, total_discount,
                        total_purchase_final_price, total_exchange_final_price,
                        roundoff_val, grand_total,
                        paid_amt, balance_amt, 
                        payment_mode
                        ) VALUES (
                         ?, ?, 
                         ?, ?, 
                         ?, ?, 
                         ?, ?, 
                         ?, ?, 
                         ?, ?, 
                         ?, ?, 
                         ?, ?, 
                         ?)`,
}
