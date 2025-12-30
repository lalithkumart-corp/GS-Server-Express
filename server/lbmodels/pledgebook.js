'use strict';

import db from '../db/index.js';
import PledgebookService from '../services/pledgebook.service.js';
import { CustomerCls } from './customer.js';
import { FundTransactionCls } from './fund-transaction.js';
import { Pledgebooksettings, PledgebooksettingsCls } from './pledgebook-settings.js';
import express from 'express';

let utils = require('../utils/commonUtils');
let _ = require('lodash');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
let path = require('path');
const { remoteMethod } = require('../routes/remoteMethod.js');

const ANALYTICS = {
    TOP_CUSTOMERS_LIMIT: 2
};
const PAYMENT_MODE = {
    'cash': 1,
    'cheque': 2,
    'online': 3
};

const router = express.Router();

export class PledgebookCls {

    constructor() {
        this.customer = new CustomerCls();
        this.fundTransaction = new FundTransactionCls();
        this.service = new PledgebookService();
        this.pledgebookSettings = new PledgebooksettingsCls();
    }

    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

    getPendingBillsAPIHandler(accessToken, params, cb) {
        this.getPendingBills(accessToken, params)
            .then(
                (success) => {
                    try {
                        // console.log('***getPendingBills api 4');
                        _.each(success.results, (aRec, index) => {
                            if(aRec && typeof aRec == 'object') {
                                aRec.OrnImagePath = utils.constructImageUrl(aRec.OrnImagePath); // aRec.OrnImagePath = `http://${app.get('domain')}:${app.get('port')}${aRec.OrnImagePath.replace('client', '')}`; 
                                aRec.UserImagePath = utils.constructImageUrl(aRec.UserImagePath); // aRec.UserImagePath = `http://${app.get('domain')}:${app.get('port')}${aRec.UserImagePath.replace('client', '')}`;
                            }
                        });
                        // console.log('***getPendingBills api 5');
                        return cb(null, success);
                    } catch(e) {
                        console.error(e);
                        return cb(null, success);
                    }
                },
                (error) => {
                    console.error(error);
                    return cb(error, null);
                }
            )
            .catch(
                (exception) => {
                    console.error(exception);
                    return cb(exception, null);
                }
            )        
    };    

    async insertNewBillAPIHandler(data, cb) {
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            let parsedArg = this.parseInputData(params);
            parsedArg._userId = await utils.getStoreOwnerUserId(params.accessToken);
            console.log('ParsedArg:', parsedArg);
            let isActiveUser = await utils.getAppStatus(parsedArg._userId);
            if(!isActiveUser)
                throw 'User is Not Active';

            let pledgebookTableName = await this.service.getPledgebookTableName(parsedArg._userId);
            let validation = await this.doValidation(parsedArg, pledgebookTableName);
            if(validation.status) {
                parsedArg.userPicture.id = parsedArg.userPicture?parsedArg.userPicture.imageId:null;
                parsedArg.ornPicture.id = parsedArg.ornPicture?parsedArg.ornPicture.imageId:null;
                let customerObj = await this.customer.handleCustomerData(parsedArg); //Save customer information in Customer Table
                parsedArg.customerId = customerObj.customerId;


                if(parsedArg.mobile) {
                    if(!customerObj.record.mobile || customerObj.record.mobile == 'null') {
                        await this.customer._updatePrimaryMobile(parsedArg.mobile, parsedArg.customerId, parsedArg._userId);
                    } else if(customerObj.record.mobile !== parsedArg.mobile){ //CUSTOM: Mobile number Handling:  ---- > If the given phone number in Bill is different, then save the number given in bill as Comment)
                        
                        let oldPrimaryNumber = customerObj.record.mobile;
                        await this.customer._updatePrimaryMobile(parsedArg.mobile, parsedArg.customerId, parsedArg._userId);
                        if(!customerObj.record.secMobile || customerObj.record.secMobile == 'null')
                            await this.customer._updateSecMobile(oldPrimaryNumber, parsedArg.customerId, parsedArg._userId);
                        else {
                            let oldSecNumber = customerObj.record.secMobile;
                            await this.customer._updateSecMobile(oldPrimaryNumber, parsedArg.customerId, parsedArg._userId);

                            if(customerObj.record.secMobile == parsedArg.mobile) {
                                console.log('Mobile number shiffling only happened. So, dont add in BillRemarks section');
                            } else if(parsedArg.billRemarks.indexOf(parsedArg.mobile) == -1)
                                parsedArg.billRemarks += ` Other Mobile: ${oldSecNumber}`;
                        }
                    }
                }

                // //CUSTOM: Mobile number Handling:  ---- > If the given phone number in Bill is different, then save the number given in bill as Comment)
                // if(parsedArg.mobile && customerObj.record.mobile !== parsedArg.mobile) {
                //     if(!customerObj.record.mobile || customerObj.record.mobile == 'null')
                //         await this.customer._updatePrimaryMobile(parsedArg.mobile, parsedArg.customerId, parsedArg._userId);
                //     else if(!customerObj.record.secMobile)
                //         await this.customer._updateSecMobile(parsedArg.mobile, parsedArg, parsedArg._userId.customerId);
                //     else if(customerObj.record.secMobile == parsedArg.mobile)
                //         console.log('Sec mobile is already filled, so do nothing now');
                //     else
                //         parsedArg.billRemarks += ` Other Mobile: ${parsedArg.mobile}`;
                // }

                await this.saveBillDetails(parsedArg, pledgebookTableName); //Save ImageId, CustomerID, ORNAMENT and other Bill details in Pledgebook
                await this.pledgebookSettings.updateLastBillDetail(parsedArg);
                this.fundTransaction.add({parsedArg, pledgebookTableName}, 'pledgebook');
                return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully inserted new bill'};
            } else {
                throw validation.errors;
            }
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }        
    }    

    saveBillDetails(params, pledgebookTableName) {
        return new Promise( (resolve, reject) => {
            let dbInputValues = [
                params.uniqueIdentifier,
                params.billNoWithSeries,
                params.amount,
                params.presentValue,
                params.date,
                params.customerId,
                params.orn,
                params.billRemarks,
                params.ornPicture.id,
                params.ornCategory, 
                params.totalWeight,
                params.interestPercent,
                params.interestValue,
                params.otherCharges,
                params.landedCost,
                params.paymentMode,
                1,
                JSON.stringify({}), 
                params.pledgedForCustomerId,
                params.secJewelRedeemerCustomerId,
                params.expiryDate,
                params.isRenewalBill || 0,
                params.isRenewalOfBillNo || '',
                params.isRenewalOfUID || '',
                params.createdDate,
                params.modifiedDate,
            ];
            //
            let query = this.getQuery('insert', dbInputValues, pledgebookTableName);
            db.query(query, dbInputValues, (err, result) => {
                if(err) {
                    reject ( err );
                } else {
                    resolve( result );
                }
            });
        });        
    }

    getPendingBills(accessToken, params) {
        return new Promise( async (resolve, reject) => {
            try {
                // console.log('***getPendingBills api 1');
                let queryValues = [(params.offsetEnd - params.offsetStart), params.offsetStart];
                let userId = await utils.getStoreOwnerUserId(accessToken);
                
                // CHECK FOR USER ACTIVE STATUS
                let isActiveUser = await utils.getAppStatus(userId);
                if(!isActiveUser)
                    throw 'User is Not Active';

                let pledgebookTableName = await this.service.getPledgebookTableName(userId);
                let pledgebookClosedBillTableName = await this.service.getPledgebookClosedTableName(userId);
                
                let query = this.getQuery('normal', {...params, getAlerts: true}, pledgebookTableName, pledgebookClosedBillTableName);  
                query = query.replace(/REPLACE_USERID/g, userId);
                let promise1 = new Promise((resolve, reject) => {
                    db.query(query, queryValues, (err, result) => {
                        if(err) {
                            console.error(err);
                            reject(err);
                        } else {
                            if(params.totals_only) 
                                result = this._calculateTotals(result, params.filters);
                            resolve(result);
                        }
                    });
                });


                let countQuery = this.getQuery('countQuery', params, pledgebookTableName, pledgebookClosedBillTableName); 
                countQuery = countQuery.replace(/REPLACE_USERID/g, userId);           
                let promise2 = new Promise((resolve, reject) => {
                    db.query(countQuery, queryValues, (err, result) => {
                        if(err) {
                            console.error(err);
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
                // console.log('***getPendingBills api 2');
                Promise.all([promise1, promise2])
                    .then(
                        (results) => {
                            // console.log('***getPendingBills api 3');
                            try {
                                let obj = {
                                    results: results[0],
                                    totalCount: results[1][0]['count']
                                }
                                resolve(obj);
                            } catch(e) {
                                console.out(e);
                                return {};
                            }
                        },
                        (error) => {
                            console.error(error);
                            reject(error);
                        }
                    )
                    .catch(
                        (exception) => {
                            console.error(exception);
                            reject(exception);
                        }
                    )
            } catch(e) {
                console.error(e);
                reject(e);
            }
        });
    }

    _calculateTotals(billsList, filters) {
        let amount = 0;
        let intVal= 0;
        let totalWeight = 0.00;
        let totalRecords = 0;
        try {
            _.each(billsList, (aBill, index) => {
                amount += aBill.Amount;
                if(filters.include != 'closed')
                    intVal += aBill.IntVal;
                else
                    intVal += (parseFloat(aBill.interest_amt) - parseFloat(aBill.discount_amt));
                totalWeight += aBill.TotalWeight;
                totalRecords++;
            });
        } catch(e) {
            console.error(e);
        }
        return {amount, intVal, totalWeight, totalRecords};
    }

    async redeemPendingBillAPIHandler(data) {
        try {
            let params = {
                data: data.requestParams
            };
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._pledgebookTableName = await this.service.getPledgebookTableName(params._userId);
            params._pledgebookClosedBillTableName = await this.service.getPledgebookClosedTableName(params._userId);
            params._status = 0;
            if(data.requestParams[0].isRenewal) {
                await this.updatePledgebookBillDetails(params);
            } else {
                await this.updatePledgebookBillStatus(params);
            }
            
            this.fundTransaction.add(params, 'redeem');
            return {STATUS: 'success', RESPONSE: {}, STATUS_MSG: ''};
        } catch(e) {
            console.log(e);
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    updatePledgebookBillStatus(params) {
        return new Promise( (resolve, reject) => {
            let query = this.getQuery('redeem-status-update', params, params._pledgebookTableName);
            db.query(query, async (err, result) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                } else {
                    if(result.affectedRows > 0) {
                        await this._insertRowInClosedBillList(params);
                        return resolve(true);
                    } else {
                        return reject({msg: 'Not Inserted record in bill closing table'});
                    }
                }
            });
        });        
    }

    updatePledgebookBillDetails(params) {
        return new Promise( (resolve, reject) => {
            let query = this.getQuery('renewal-details-update', params, params._pledgebookTableName);
            db.query(query, async (err, result) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                } else {
                    if(result.affectedRows > 0) {
                        await this._insertRowInClosedBillList(params);
                        return resolve(true);
                    } else {
                        return reject({msg: 'Not Inserted record in bill closing table'});
                    }
                }
            });
        });        
    }

    _insertRowInClosedBillList(params) {
        return new Promise( (resolve, reject) => {
            /*let dbInputValues = [];
            for(let i=0; i<params.data.length; i++) {
                let aRowObj = params.data[i];
                dbInputValues.push(aRowObj.pledgeBookUID, aRowObj.billNo, aRowObj.pledgedDate, aRowObj.closedDate,
                    aRowObj.principalAmt, aRowObj.noOfMonth, aRowObj.roi, aRowObj.interestPerMonth,
                    aRowObj.interestValue, aRowObj.estimatedAmount, aRowObj.discountValue, aRowObj.paidAmount,
                    aRowObj.handedTo);
            } */           
            let query = this.getQuery('redeem-insert', params, params._pledgebookClosedBillTableName); 
            db.query(query, (err, result) => {
                if(err) {
                    console.log('ERROR in inserting rec in closingTableList===');
                    console.log(err);
                    return reject(err);                    
                } else {
                    if(result.affectedRows > 0) {
                        return resolve(true);
                    } else {
                        return reject({msg: 'Not insertedd record in Bill closed list table'});
                    }
                }
            });
        });
    }

    reOpenBill(params) {
        return new Promise( (resolve, reject) => {
            let query = this.getQuery('reopen-status-update', params, params._pledgebookTableName);

            db.query(query, async (err, result) => {
                if (err) {
                    return reject(err);
                } else {
                    if(result.affectedRows > 0) {
                        this.fundTransaction.removeEntry(params, 'redeem');
                        let query = this.getQuery('reopen-bill', params, params._pledgebookClosedBillTableName);
                        db.query(query, (err, result) => {
                            if(err) {
                                return reject(err);
                            } else {
                                if(result.affectedRows > 0)
                                    return resolve(true);
                                else
                                    return reject({msg: 'Not removed the record from Bill closed list table'});
                            }
                        });                        
                    } else {
                        return reject({msg: 'Not Updated'});
                    }
                }
            });
        });
    }

    getQuery(queryIdentifier, params, pledgebookTableName, pledgebookClosedBillTableName) {
        let query = '';
        switch(queryIdentifier) {
            case 'insert':
                query = `INSERT INTO 
                            ${pledgebookTableName} 
                                (UniqueIdentifier, BillNo, 
                                Amount, PresentValue,
                                Date, 
                                CustomerId, 
                                Orn, Remarks, 
                                OrnPictureId,
                                OrnCategory, TotalWeight,
                                IntPercent, IntVal, OtherCharges, LandedCost, PaymentMode,
                                Status, History, 
                                PledgedFor, SecJewelRedemeer,
                                ExpiryDate, 
                                IsRenewalBill, IsRenewalOfBillNo, IsRenewalOfUID,
                                CreatedDate, ModifiedDate) 
                            VALUES
                                (?, ?,
                                ?, ?, 
                                ?, ?,
                                ?, ?, 
                                ?,
                                ?, ?,
                                ?, ?, ?, ?, ?,
                                ?, ?,
                                ?, ?, 
                                ?, 
                                ?, ?, ?,
                                ?, ?);`
                break;
            case 'normal':
                query = `SELECT                         
                                ${pledgebookTableName}.*,
                                customer_REPLACE_USERID.*,
                                ${pledgebookClosedBillTableName}.*,
                                ${pledgebookTableName}.Date AS PledgedDate,
                                ${pledgebookTableName}.ExpiryDate AS LoanExpiryDate,
                                ${pledgebookTableName}.Archived AS PledgebookBillArchived,
                                ${pledgebookTableName}.Trashed AS PledgebookBillTrashed,
                                image.Id AS ImageTableID,
                                image.Image AS UserImageBlob,
                                orn_images.Id AS OrnImageTableID,
                                image.Path AS UserImagePath,
                                image.Format AS UserImageFormat,
                                orn_images.Image AS OrnImageBlob,
                                orn_images.Path AS OrnImagePath,
                                orn_images.Format AS OrnImageFormat,
                                alerts.id AS alertId,
                                alerts.title AS alertTitle,
                                alerts.message AS alertMsg,
                                alerts.extra_ctx AS alertExtraCtx,
                                alerts.has_read AS alertReadFlag,
                                alerts.archived AS alertArchivedFlag,
                                alerts.module AS alertModule,
                                alerts.trigger_time AS alertTriggerTime,
                                alerts.created_date AS alertCreatedDate,
                                fund_accounts.id AS fund_accounts_id,
                                fund_accounts.name AS fundAccount_name,
                                fund_transactions_REPLACE_USERID.id AS fundTransaction_id,
                                fund_transactions_REPLACE_USERID.account_id AS fundTransaction_account_id,
                                fund_transactions_REPLACE_USERID.transaction_date AS fundTransaction_transaction_date,
                                fund_transactions_REPLACE_USERID.cash_out AS fundTransaction_cash_out,
                                fund_transactions_REPLACE_USERID.cash_out_mode AS fundTransaction_cash_out_mode,
                                fund_transactions_REPLACE_USERID.cash_out_to_bank_acc_no AS fundTransaction_cash_out_to_bank_acc_no,
                                fund_transactions_REPLACE_USERID.cash_out_to_bank_ifsc AS fundTransaction_cash_out_to_bank_ifsc,
                                fund_transactions_REPLACE_USERID.id AS fundTransaction_Id
                            FROM
                                ${pledgebookTableName}
                                    LEFT JOIN
                                customer_REPLACE_USERID ON ${pledgebookTableName}.CustomerId = customer_REPLACE_USERID.CustomerId
                                    LEFT JOIN
                                image ON customer_REPLACE_USERID.ImageId = image.Id
                                    LEFT JOIN
                                orn_images ON ${pledgebookTableName}.OrnPictureId = orn_images.Id
                                    LEFT JOIN
                                ${pledgebookClosedBillTableName} ON ${pledgebookClosedBillTableName}.pledgebook_uid = ${pledgebookTableName}.UniqueIdentifier
                                    LEFT JOIN
                                alerts ON (${pledgebookTableName}.alert = alerts.id AND alerts.archived=0)
                                    LEFT JOIN
                                fund_transactions_REPLACE_USERID ON (${pledgebookTableName}.UniqueIdentifier = fund_transactions_REPLACE_USERID.gs_uid && fund_transactions_REPLACE_USERID.category_id IN (select id from fund_transaction_categories where category IN ('girvi' , 'redeem') ))
                                    LEFT JOIN
                                fund_accounts ON fund_transactions_REPLACE_USERID.account_id = fund_accounts.id
                                `;
                
                query = this.appendFilters(params, query, pledgebookTableName, pledgebookClosedBillTableName, queryIdentifier);
                
                // if(params.filters.include && params.filters.include == 'closed')
                //     query += ` ORDER BY uid DESC`;
                // else
                //     query += ` ORDER BY UniqueIdentifier DESC`;
                
                if(params.sortOrder) {
                    params.sortOrder.sortBy = params.sortOrder.sortBy || "DESC";
                    if(params.sortOrder.sortByColumn == "closedDate")
                        query += ` ORDER BY uid ${params.sortOrder.sortBy}`;
                    else
                        query += ` ORDER BY PledgedDate ${params.sortOrder.sortBy}, UniqueIdentifier ${params.sortOrder.sortBy}`;
                } else {
                    query += ` ORDER BY PledgedDate DESC, UniqueIdentifier DESC`;
                }

                if(!params.totals_only)
                    query += ` LIMIT ? OFFSET ?`;
                break;
            case 'countQuery':
                query = `SELECT                         
                            COUNT(*) AS count
                        FROM
                            ${pledgebookTableName}
                                LEFT JOIN
                            customer_REPLACE_USERID ON ${pledgebookTableName}.CustomerId = customer_REPLACE_USERID.CustomerId
                                LEFT JOIN
                            image ON customer_REPLACE_USERID.ImageId = image.Id
                                LEFT JOIN
                            ${pledgebookClosedBillTableName} ON ${pledgebookClosedBillTableName}.pledgebook_uid = ${pledgebookTableName}.UniqueIdentifier`;
                query = this.appendFilters(params, query, pledgebookTableName, pledgebookClosedBillTableName, queryIdentifier);
                break;
            case 'byCustomerId':
                query = `SELECT                         
                            *,                                                    
                            ${pledgebookTableName}.Date AS PledgedDate,
                            orn_images.Path AS OrnImagePath
                        FROM
                            ${pledgebookTableName}
                                LEFT JOIN
                            customer_REPLACE_USERID ON ${pledgebookTableName}.CustomerId = customer_REPLACE_USERID.CustomerId      
                                LEFT JOIN
                            orn_images ON ${pledgebookTableName}.OrnPictureId = orn_images.Id
                                LEFT JOIN
                            ${pledgebookClosedBillTableName} ON ${pledgebookClosedBillTableName}.pledgebook_uid = ${pledgebookTableName}.UniqueIdentifier
                        WHERE
                            ${pledgebookTableName}.CustomerId = ?`;

                    if(params.includeOnly == "pending")
                        query +=  ` AND Status=1`;
                    else if(params.includeOnly == "closed")
                        query += ` AND Status=0`;
                
                    if(params.filters && typeof params.filters.includeArchived !== 'undefined' && params.filters.includeArchived == false)
                        query += ` AND ${pledgebookTableName}.Archived=0`;

                query += ` ORDER BY PledgedDate DESC`;
                break;
            case 'billAlreadyExist':
                query = `SELECT 
                            *
                        FROM
                            ${pledgebookTableName}
                        WHERE
                            BillNo = ?;`
                break;
            case 'redeem-status-update':
            /* UPDATE gs.pledgebook_4
                        SET Status = CASE BillNo 
                                            WHEN 'K.1' THEN 0 
                                            WHEN 'K.2' THEN 0 
                                            ELSE Status
                                            END
                        WHERE BillNo IN('K.1', 'K.2'); */
                if(params.data.length == 1) {
                    query = `UPDATE ${pledgebookTableName} SET Status= ${params._status} WHERE UniqueIdentifier = ${params.data[0].pledgeBookUID}`; 
                } else {
                    query = `SET SQL_SAFE_UPDATES = 0;`;
                    for(let i=0; i<params.data.length; i++) {
                        query += `UPDATE ${pledgebookTableName} SET STATUS = ${params._status} WHERE UniqueIdentifier = '${params.data[i].pledgeBookUID}'`;
                    }
                    query += `SET SQL_SAFE_UPDATES = 1;`;

                    /*
                    query = `UPDATE ${pledgebookTableName} SET STATUS = CASE Id`;
                    for(let i=0; i<params.ids.length; i++) {
                        query += ` WHEN '${params.ids[i]}' THEN 0`;
                    }
                    query += ` ELSE Status 
                            END
                            WHERE Id IN (${params.ids.join(', ')})`;
                    */
                }
                break;
            case 'reopen-status-update':
                if(params.data.length == 1) {
                    query = `UPDATE ${pledgebookTableName} SET Status= ${params._status}, Renewed=0, RenewedNewBillNo='', RenewedNewUID='' WHERE UniqueIdentifier = ${params.data[0].pledgeBookUID}`; 
                }
                break;
            case 'renewal-details-update':
                query = `UPDATE ${pledgebookTableName} SET Status= ${params._status}, Renewed=1, RenewedNewBillNo='${params.data[0].redemmedNewBillNo}', RenewedNewUID='${params.data[0].redeemedNewBillUid}' WHERE UniqueIdentifier = ${params.data[0].pledgeBookUID}`; 
                break;
            case 'redeem-insert':
                query = ''; //`SET SQL_SAFE_UPDATES = 0;`;
                for(let i=0; i<params.data.length; i++) {
                    let aRowObj = params.data[i];
                    query += `INSERT INTO 
                                ${pledgebookTableName} 
                                    (uid,
                                    pledgebook_uid, bill_no, 
                                    pledged_date, closed_date, 
                                    principal_amt, no_of_month, 
                                    rate_of_interest, int_rupee_per_month, 
                                    interest_amt, actual_estimated_amt, 
                                    discount_amt, paid_amt, 
                                    handed_over_to_person,
                                    payment_mode, remarks) 
                                VALUES (${aRowObj.redeemUID}, '${aRowObj.pledgeBookUID}', '${aRowObj.billNo}', '${aRowObj.pledgedDate}', '${aRowObj.closedDate}',
                                    '${aRowObj.principalAmt}', '${aRowObj.noOfMonth}', '${aRowObj.roi}', '${aRowObj.interestPerMonth}',
                                    '${aRowObj.interestValue}', '${aRowObj.estimatedAmount}', '${aRowObj.discountValue}', '${aRowObj.paidAmount}',
                                    '${aRowObj.handedTo}', ${PAYMENT_MODE[aRowObj.paymentMode]}, '${aRowObj.billRemarks}');`;
                }
                //query += `SET SQL_SAFE_UPDATES = 1;`;
                break;
            case 'reopen-bill':
                query = ''; //`SET SQL_SAFE_UPDATES = 0;`;
                for(let i=0; i<params.data.length; i++) {
                    let aRowObj = params.data[i];
                    query += `DELETE FROM ${pledgebookTableName} WHERE pledgebook_uid='${aRowObj.pledgeBookUID}';`;
                }
                //query += `SET SQL_SAFE_UPDATES = 1;`;
                break;
            case 'pendingBillNumbers':
                query = `SELECT BillNo, UniqueIdentifier from ${pledgebookTableName} where Status=1`;
                break;
            case 'billDetails':                
                query = `SELECT                         
                            ${pledgebookTableName}.*,
                            customer_REPLACE_USERID.*,
                            image.Id AS ImageTableID,
                            image.Image AS UserImageBlob,
                            orn_images.Id AS OrnImageTableID,
                            image.Path AS UserImagePath,
                            image.Format AS UserImageFormat,
                            orn_images.Image AS OrnImageBlob,
                            orn_images.Path AS OrnImagePath,
                            orn_images.Format AS OrnImageFormat,
                            fund_accounts.id AS fund_accounts_id,
                            fund_accounts.name AS fundAccount_name,
                            fund_transactions_REPLACE_USERID.id AS fundTransaction_id,
                            fund_transactions_REPLACE_USERID.account_id AS fundTransaction_account_id,
                            fund_transactions_REPLACE_USERID.transaction_date AS fundTransaction_transaction_date,
                            fund_transactions_REPLACE_USERID.cash_out AS fundTransaction_cash_out,
                            fund_transactions_REPLACE_USERID.cash_out_mode AS fundTransaction_cash_out_mode,
                            fund_transactions_REPLACE_USERID.cash_out_to_bank_acc_no AS fundTransaction_cash_out_to_bank_acc_no,
                            fund_transactions_REPLACE_USERID.cash_out_to_bank_ifsc AS fundTransaction_cash_out_to_bank_ifsc,
                            fund_transactions_REPLACE_USERID.id AS fundTransaction_Id
                        FROM
                            ${pledgebookTableName}
                                LEFT JOIN
                            customer_REPLACE_USERID ON ${pledgebookTableName}.CustomerId = customer_REPLACE_USERID.CustomerId
                                LEFT JOIN
                            image ON customer_REPLACE_USERID.ImageId = image.Id
                                LEFT JOIN
                            orn_images ON ${pledgebookTableName}.OrnPictureId = orn_images.Id
                                LEFT JOIN
                            fund_transactions_REPLACE_USERID ON (${pledgebookTableName}.UniqueIdentifier = fund_transactions_REPLACE_USERID.gs_uid AND fund_transactions_REPLACE_USERID.is_internal = 1)
                                LEFT JOIN
                            fund_accounts ON fund_transactions_REPLACE_USERID.account_id = fund_accounts.id
                        WHERE `;
                let filterPart = [];
                for(let i=0; i<params.length; i++) {
                    filterPart.push(`BillNo="${params[i]}"`);
                }
                query += filterPart.join(' OR ');                
                break;
            case 'update-bill':
                query = `UPDATE
                            ${pledgebookTableName}
                                SET
                            BillNo=?,
                            Amount=?,
                            PresentValue=?,
                            Date=?,
                            CustomerId=?,
                            Orn=?,
                            Remarks=?,                            
                            OrnPictureId=?,
                            OrnCategory=?,
                            TotalWeight=?,
                            IntPercent=?,
                            IntVal=?,
                            OtherCharges=?,
                            LandedCost=?,
                            PledgedFor=?, 
                            SecJewelRedemeer=?,
                            ExpiryDate=?,
                            PaymentMode=?,
                            ModifiedDate=?
                                WHERE
                            UniqueIdentifier=?`;
                break;
            // case 'pending-bill-list':
            //     query = `SELECT * FROM ${pledgebookTableName} WHERE CustomerId=${params.custId} AND Status=1`;
            //     break;
        }
        return query;
    }

    appendFilters(params, query, pledgebookTableName, pledgebookClosedBillTableName, identifier) {
        let filterQueries = [];
        if(params.filters) {
            if(params.filters.billNo)
                filterQueries.push(`BillNo like '${params.filters.billNo}%'`);
            // if(params.filters.amount && params.filters.amount > 0)
            //     filterQueries.push(`amount >= ${params.filters.amount}`);
            if(params.filters.cName)
                filterQueries.push(`customer_REPLACE_USERID.Name like '${params.filters.cName}%'`);
            if(params.filters.gName)
                filterQueries.push(`customer_REPLACE_USERID.GaurdianName like '${params.filters.gName}%'`);
            if(params.filters.address)
                filterQueries.push(`customer_REPLACE_USERID.Address like '%${params.filters.address}%'`);
            if(params.filters.include && params.filters.include == 'pending')
                filterQueries.push(`${pledgebookTableName}.Status=1`);
            else if(params.filters.include && params.filters.include == 'closed')
                filterQueries.push(`${pledgebookTableName}.Status=0`);
            if(params.filters.date) {
                if(params.filters.include == "closed")
                    filterQueries.push(`(${pledgebookClosedBillTableName}.closed_date BETWEEN '${params.filters.date.startDate}' AND '${params.filters.date.endDate}')`);
                else
                    filterQueries.push(`(${pledgebookTableName}.Date BETWEEN '${params.filters.date.startDate}' AND '${params.filters.date.endDate}')`);
            }
            if(params.filters.custom) {
                if(params.filters.custom.pledgeAmt)
                    filterQueries.push(`(${pledgebookTableName}.Amount BETWEEN ${parseInt(params.filters.custom.pledgeAmt.grt)} AND ${parseInt(params.filters.custom.pledgeAmt.lsr)})`);
                if(params.filters.custom.pledgeAmtPerGram)
                    filterQueries.push(`(${pledgebookTableName}.Amount BETWEEN (${pledgebookTableName}.TotalWeight*${parseInt(params.filters.custom.pledgeAmtPerGram.grt)}) AND (${pledgebookTableName}.TotalWeight*${parseInt(params.filters.custom.pledgeAmtPerGram.lsr)}))`);
                if(params.filters.custom.intPercent)
                    filterQueries.push(`(${pledgebookTableName}.IntPercent BETWEEN ${parseFloat(params.filters.custom.intPercent.grt)} AND ${parseFloat(params.filters.custom.intPercent.lsr)})`);
            }
            if(params.filters.custom && params.filters.custom.mobile)
                filterQueries.push(`(Mobile like '${params.filters.custom.mobile}%' OR SecMobile like '${params.filters.custom.mobile}%')`)
            if(params.filters.custom && params.filters.custom.ornCategory) {
                if(params.filters.custom.ornCategory.length < 3 && params.filters.custom.ornCategory.length > 0) {
                    let temp = [];
                    _.each(params.filters.custom.ornCategory, (aCateg, index) => {
                        temp.push(`OrnCategory = "${aCateg}"`);
                    });
                    filterQueries.push(`(${temp.join(' OR ')})`);
                }
            }
            // Dont include archived bills
            if(typeof params.filters.includeArchived !== 'undefined' && params.filters.includeArchived == false)
                filterQueries.push(`${pledgebookTableName}.Archived=0`);

            // Show only archived bills
            if(params.filters.showOnlyArchived)
                filterQueries.push(`${pledgebookTableName}.Archived=1`);

            // Dont include Trashed bills
            if(typeof params.filters.includeTrashed !== 'undefined' && params.filters.includeTrashed == false)
                filterQueries.push(`${pledgebookTableName}.Trashed=0`);

            // Show only Trashed bills
            if(params.filters.showOnlyTrashed)
                filterQueries.push(`${pledgebookTableName}.Trashed=1`);
            
            // Left Join the fund_transaction rows which are related to "loan", and "Redeem"
            // if(identifier == 'normal') filterQueries.push(`fund_transactions_REPLACE_USERID.category IN ("girvi", "redeem")`)

            if(filterQueries.length != 0)
                query += ' WHERE ' + filterQueries.join(' AND ');
        }
        return query;
    }

    parseInputData(params = {}) {
        let parsedArg = JSON.parse(JSON.stringify(params));
        let billNo = params.billNo;
        if(params.billSeries !== "")
            billNo = params.billSeries + "." + billNo;
        parsedArg.accessToken = params.accessToken;
        parsedArg.billNoWithSeries = billNo;
        parsedArg.uniqueIdentifier=  (+ new Date()); //TEMPORARY: for migration:  params.uniqueIdentifier;
        parsedArg.orn = JSON.stringify(params.orn);
        parsedArg.createdDate = params.createdDate || new Date().toISOString().replace('T', ' ').slice(0,23);
        parsedArg.modifiedDate= new Date().toISOString().replace('T', ' ').slice(0,23);
        if(parsedArg.mobile && parsedArg.mobile == 'null')
            parsedArg.mobile = null;
        parsedArg.paymentMode = PAYMENT_MODE[parsedArg.paymentMode] || 1;
        return parsedArg;
    }

    parseInputDataForUpdate(params = {}) {
        let parsedArg = JSON.parse(JSON.stringify(params));
        let billNo = params.billNo;
        if(params.billSeries !== "")
            billNo = params.billSeries + "." + billNo;
        parsedArg.accessToken = params.accessToken;
        parsedArg.billNoWithSeries = billNo;
        parsedArg.orn = JSON.stringify(params.orn);
        parsedArg.modifiedDate= new Date().toISOString().replace('T', ' ').slice(0,23);
        if(parsedArg.mobile && parsedArg.mobile == 'null')
            parsedArg.mobile = null;
        parsedArg.paymentMode = PAYMENT_MODE[parsedArg.paymentMode] || 1;
        return parsedArg;
    }

    doValidation(params, pledgebookTableName) {
        return new Promise( async (resolve, reject) => {
            let userId = params._userId
            let returnVal = {
                status: 1,
                errors: []
            }
            const insertError = (error) => {
                returnVal.status = 0;
                returnVal.errors.push(error);
            }
            try{
                if(params.billNo) {
                    let isAlreadyExist = await this._isBillNoAlreadyExist(userId, params.billNoWithSeries, pledgebookTableName);
                    if(isAlreadyExist)
                        insertError('Bill Number already Exists');
                } else {
                    insertError('Bill Number is missing');
                }                
            } catch(e) {
                insertError(e);
            } finally {
                resolve(returnVal);
            }
        });        
    }

    _isBillNoAlreadyExist(userId, billNoWithSeries, pledgebookTableName) {
        return new Promise( (resolve, reject) => {
            let query = this.getQuery('billAlreadyExist', {}, pledgebookTableName);
            db.query(query, [billNoWithSeries], (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    if(result.length > 0)
                        resolve(true);
                    else
                        resolve(false);
                }
            });
        });
    }

    async getPendingBillNosAPIHandler(accessToken, cb) {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let list = await this._getPendingBillNumbers(accessToken);
            return {STATUS: 'SUCCESS', list};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }
    _getPendingBillNumbers(accessToken) {
        return new Promise( async (resolve, reject) => {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let pledgebookTableName = await this.service.getPledgebookTableName(_userId);
            let query = this.getQuery('pendingBillNumbers', {}, pledgebookTableName);
            db.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    let theBuffer = [];
                    _.each(result, (anResultItem, index) => {
                        theBuffer.push(anResultItem);
                    });
                    resolve(theBuffer);
                }                    
            });
        });
    }

    async getBillDetailsAPIHandler(accessToken, billNoWithUUIDArray, fetchOnlyPending, fetchFundTrns, cb) {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let billDetails = await this._getBillDetails(accessToken, billNoWithUUIDArray, fetchOnlyPending, fetchFundTrns);
            return {STATUS: 'SUCCESS', billDetails};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }

    _getBillDetails(accessToken, billNoWithUUIDArray, fetchOnlyPending, fetchFundTrns) {
        return new Promise ( async (resolve, reject) => {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let res;
            if(fetchFundTrns) {
                let uuidArray = billNoWithUUIDArray.map((anObj) => anObj.uuid);
                res = await this.fundTransaction._fetchTransactionsByBillIdApi(accessToken, uuidArray);
            }
            let billNoArray = billNoWithUUIDArray.map((anObj) => anObj.billNo);
            let pledgebookTableName = await this.service.getPledgebookTableName(_userId);
            let query = this.getQuery('billDetails', billNoArray, pledgebookTableName);
            if(fetchOnlyPending)
                query +=` AND STATUS=1`;
            query = query.replace(/REPLACE_USERID/g, _userId);
            db.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    if(result.length > 0) {
                        _.each(result, (aRec, index) => {
                            aRec.UserImagePath = utils.constructImageUrl(aRec.UserImagePath); // aRec.UserImagePath = `http://${app.get('domain')}:${app.get('port')}${aRec.UserImagePath.replace('client', '')}`;
                        });                    
                        resolve({...result[0], fundTrns: res});
                    } else {
                        resolve(null);
                    }
                }
            });            
        });
    }

    async reOpenClosedBillsAPIHandler(data) {
        try {
            let params = {
                data: data.requestParams
            };
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._pledgebookTableName = await this.service.getPledgebookTableName(params._userId);
            params._pledgebookClosedBillTableName = await this.service.getPledgebookClosedTableName(params._userId);
            params._status = 1;
            await this.reOpenBill(params);
            return {STATUS: 'success', RESPONSE: {}, STATUS_MSG: ''};
        } catch(e) {
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    async fetchUserHistoryAPIHandler(accessToken, customerId, include_only, filters, cb) {
        try {
            let billList = await this.fetchHistory({accessToken: accessToken, customerId: customerId, includeOnly: include_only, filters});
            return {STATUS: 'success', RESPONSE: billList, STATUS_MSG: ''};
        } catch(e) {
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    async fetchHistory(data) {
        return new Promise( async (resolve, reject) => {
            data._userId = await utils.getStoreOwnerUserId(data.accessToken);
            data._pledgebookTableName = await this.service.getPledgebookTableName(data._userId);
            data._pledgebookClosedBillTableName = await this.service.getPledgebookClosedTableName(data._userId);
            let query = this.getQuery('byCustomerId', data, data._pledgebookTableName, data._pledgebookClosedBillTableName);
            query = query.replace(/REPLACE_USERID/g, data._userId); 
            db.query(query, [data.customerId], (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    _.each(result, (aRec, index) => {
                        if(aRec && typeof aRec == 'object')
                            aRec.OrnImagePath = utils.constructImageUrl(aRec.OrnImagePath); // aRec.OrnImagePath = `http://${app.get('domain')}:${app.get('port')}${aRec.OrnImagePath.replace('client', '')}`;
                    })
                    resolve(result);
                }
            });
        });
    }

    async updateBillAPIHandler(data) {
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            let parsedArg = this.parseInputDataForUpdate(params);            
            parsedArg._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let pledgebookTableName = await this.service.getPledgebookTableName(parsedArg._userId);                        
            parsedArg.ornPicture.id = parsedArg.ornPicture?parsedArg.ornPicture.imageId:null;
            let customerObj = await this.customer.handleCustomerData(parsedArg); //Save customer information in Customer Table
            parsedArg.customerId = customerObj.customerId;

            if(parsedArg.mobile) {
                if(!customerObj.record.mobile || customerObj.record.mobile == 'null') {
                    await this.customer._updatePrimaryMobile(parsedArg.mobile, parsedArg.customerId, parsedArg._userId);
                } else if(customerObj.record.mobile !== parsedArg.mobile){ //CUSTOM: Mobile number Handling:  ---- > If the given phone number in Bill is different, then save the number given in bill as Comment)
                    
                    let oldPrimaryNumber = customerObj.record.mobile;
                    await this.customer._updatePrimaryMobile(parsedArg.mobile, parsedArg.customerId, parsedArg._userId);
                    if(!customerObj.record.secMobile || customerObj.record.secMobile == 'null')
                        await this.customer._updateSecMobile(oldPrimaryNumber, parsedArg.customerId, parsedArg._userId);
                    else {
                        let oldSecNumber = customerObj.record.secMobile;
                        await this.customer._updateSecMobile(oldPrimaryNumber, parsedArg.customerId, parsedArg._userId);
                        
                        if(customerObj.record.secMobile == parsedArg.mobile) {
                            console.log('Mobile number shiffling only happened. So, dont add in BillRemarks section');
                        } else if(parsedArg.billRemarks.indexOf(parsedArg.mobile) == -1)
                            parsedArg.billRemarks += ` Other Mobile: ${oldSecNumber}`;
                    }
                }
            }

            
            // if(parsedArg.mobile && customerObj.record.mobile !== parsedArg.mobile) {
            //     if(!customerObj.record.mobile || customerObj.record.mobile == 'null')
            //         await this.customer._updatePrimaryMobile(parsedArg.mobile, parsedArg.customerId, parsedArg._userId);
            //     else if(!customerObj.record.secMobile)
            //         await this.customer._updateSecMobile(parsedArg.mobile, parsedArg, parsedArg._userId.customerId);
            //     else if(customerObj.record.secMobile == parsedArg.mobile)
            //         console.log('Sec mobile is already filled, so do nothing now');
            //     else if(parsedArg.billRemarks.indexOf(parsedArg.mobile) == -1)
            //         parsedArg.billRemarks += ` Other Mobile: ${parsedArg.mobile}`;
            // };

            await this.updateBillDetails(parsedArg, pledgebookTableName); //Save ImageId, CustomerID, ORNAMENT and other Bill details in Pledgebook                
            this.fundTransaction.update({parsedArg, pledgebookTableName}, 'pledgebook');
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully Updated the bill'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }        
    }

    updateBillDetails(parsedArg, pledgebookTableName) {
        return new Promise( (resolve, reject) => {
            let sql = this.getQuery('update-bill', parsedArg, pledgebookTableName);
            let values = [
                parsedArg.billNoWithSeries,
                parsedArg.amount,
                parsedArg.presentValue,
                parsedArg.date,
                parsedArg.customerId,
                parsedArg.orn,
                parsedArg.billRemarks,
                parsedArg.ornPicture.id,
                parsedArg.ornCategory,
                parsedArg.totalWeight,
                parsedArg.interestPercent,
                parsedArg.interestValue,
                parsedArg.otherCharges,
                parsedArg.landedCost,
                parsedArg.pledgedForCustomerId,
                parsedArg.secJewelRedeemerCustomerId,
                parsedArg.expiryDate,
                parsedArg.paymentMode,
                parsedArg.modifiedDate,
                parsedArg.uniqueIdentifier
            ]
            db.query( sql, values, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    if(result.affectedRows > 0)
                        resolve(true);
                    else
                        reject({msg: 'Not Updated'});
                }
            });
        });        
    }

    async exportAPIHandler(accessToken, params, res, cb) {
        try {
            let pledgebook = await this.getPledgebookData(accessToken, params);
            let exportDataJSON = this._constructExportDataJSON(pledgebook);
            let csvStr = this._convertToCsvString(exportDataJSON);
            let fileLocation = utils.getCsvStorePath();
            let status = await this._writeCSVfile(exportDataJSON, fileLocation);
            res.download(fileLocation, 'PledgebookCls.csv');

            //let updatedResponse = PledgebookCls._setResponseHeaders(res);
            //updatedResponse.download(csvStr);                                        

            // let filePath = path.join('../../client/csvfiles','file.csv');
            // res.download(filePath, 'downld.csv');
            
            // fs.readFile('client/csvfiles/file.csv', (err, stream) => {
            //     if(err) {
            //         return cb(err);
            //     } else {
            //         cb(null, stream, 'application/octet-stream');
            //     }
            // });
            // res.send({STATUS: 'Downloading file'});
            // return true;
        } catch(e) {
            res.send({STATUS: 'error', ERROR: e});
        }
    }

    
    /*PledgebookCls.afterRemote('exportAPIHandler', (ctx, results, next) => {
        var options = {
            root: 'client/csvfiles',
            headers: {
              'content-type': 'text/comma-separated-values, text/csv, application/csv, application/excel, application/vnd.ms-excel, application/vnd.msexcel, text/anytext',
              //'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', //'application/vnd.ms-excel', //'text/csv',
              'x-timestamp': Date.now(),
              'x-sent': true
            }
        };
        
        ctx.res.sendFile('file.csv', options, function (err) {
            if (err) { 
                console.log(err); 
                ctx.res.status(err.status).end();
            } else {
                ctx.res.end();
            }
        });
    });*/
    

    getPledgebookData(accessToken, params) {
        return new Promise( async (resolve, reject) => {
            let queryValues = [(params.offsetEnd - params.offsetStart), params.offsetStart];
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let pledgebookTableName = await this.service.getPledgebookTableName(userId);
            let pledgebookClosedBillTableName = await this.service.getPledgebookClosedTableName(userId);
            
            let query = this.getQuery('normal', params, pledgebookTableName, pledgebookClosedBillTableName);
            query = query.replace(/REPLACE_USERID/g, userId);
            db.query(query, queryValues, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });        
    }
    _constructExportDataJSON(rawData) {
        let mainBucket = [];
        let pendingBillsBucket = [];
        let closedBillsBucket = [];
        _.each(rawData, (aRec, index) => {
            let anObj = {
                Date: utils.convertDatabaseDateTimetoDateStr(aRec.Date),
                BillNo: aRec.BillNo,
                Amount: aRec.Amount,
                Name: aRec.Name,
                GaurdianName: aRec.GaurdianName,
                NameFull: `${aRec.Name}`,
                OrnWithWt: this._constructOrnString(aRec.Orn, true),
                Orn: this._constructOrnString(aRec.Orn, false),
                TotalWeight: aRec.TotalWeight || 0,
                Status: (aRec.Status)?'PENDING':'CLOSED',
                Address: aRec.Address,
                Place: aRec.Place,
                City: aRec.City,
                Pincode: aRec.Pincode,
                AddressFull: '',
                Mobile: aRec.Mobile,
                ClosedDate: aRec.closed_date?utils.convertDatabaseDateTimetoDateStr(new Date(aRec.closed_date + ' UTC')):''
            };
            if(aRec.GaurdianName) {
                let rel = aRec.GuardianRelation || 'c/o';
                anObj.NameFull += `  ${rel}  ${aRec.GaurdianName}`;
            }

            let fullAddrArr = [];
            if(aRec.Address) fullAddrArr.push(aRec.Address);
            if(aRec.Place) fullAddrArr.push(aRec.Place);
            if(aRec.City) fullAddrArr.push(aRec.City);
            if(aRec.Pincode) fullAddrArr.push(aRec.Pincode);
            anObj.AddressFull = fullAddrArr.join(', ');

            if(aRec.Status) {
                let temp = {
                    ...anObj,
                }
                pendingBillsBucket.push(temp);
            } else {
                let temp = {
                    ...anObj,
                    RedeemedDate: aRec.closed_date,
                }
                closedBillsBucket.push(temp);
            }
        });

        mainBucket = [...pendingBillsBucket, ...closedBillsBucket];
        return mainBucket;
    }

    _constructOrnString(jsonStr, withWt) {
        let ornStr = '';
        if(jsonStr) {
            let jsonObj;
            try {
                jsonObj = JSON.parse(jsonStr);
            } catch(e) {
                console.error(e);
            }
            if(jsonObj) {
                let bucket = [];
                _.each(jsonObj, (anOrnObj, index) => {
                    let ornamentCellData = `${anOrnObj.ornItem}-${anOrnObj.ornNos}`;
                    if(withWt && anOrnObj.ornNWt) 
                        ornamentCellData += `-${anOrnObj.ornNWt}`;
                    bucket.push(ornamentCellData);
                });
                ornStr = bucket.join('||');
            }
        }
        return ornStr;
    }    

    
    _writeCSVfile(jsonData, fileLocation) {
        return new Promise( (resolve, reject) => {
            const csvWriter = createCsvWriter({
                path: fileLocation,
                header: [
                    {id: 'Date', title: 'Date'},
                    {id: 'BillNo', title: 'BillNo'},
                    {id: 'Amount', title: 'Amount'},
                    {id: 'Name', title: 'Name'},
                    {id: 'GaurdianName', title: 'GaurdianName'},
                    {id: 'NameFull', title: 'NameFull'},
                    {id: 'OrnWithWt', title: 'OrnWithWt'},
                    {id: 'Orn', title: 'Orn'},
                    {id: 'TotalWeight', title: 'TotalWeight'},
                    {id: 'Status', title: 'Status'},
                    {id: 'Address', title: 'Address'},
                    {id: 'Place', title: 'Place'},
                    {id: 'City', title: 'City'},
                    {id: 'Pincode', title: 'Pincode'},
                    {id: 'AddressFull', title: 'AddressFull'},
                    {id: 'Mobile', title: 'Mobile'},
                    {id: 'ClosedDate', title: 'Closed Date'}
                ]
            });
            csvWriter.writeRecords(jsonData)
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
    

    _convertToCsvString(json) {
        const csvStringifier = createCsvStringifier({
            header: [
                {id: 'Date', title: 'Date'},
                {id: 'BillNo', title: 'BillNo'},
                {id: 'Amount', title: 'Amount'},
                {id: 'Name', title: 'Name'},
                {id: 'GaurdianName', title: 'GaurdianName'},
                {id: 'NameFull', title: 'NameFull'},
                {id: 'Address', title: 'Address'},
                {id: 'Place', title: 'Place'},
                {id: 'City', title: 'City'},
                {id: 'Pincode', title: 'Pincode'},
                {id: 'AddressFull', title: 'AddressFull'},
                {id: 'Mobile', title: 'Mobile'},
                {id: 'OrnWithWt', title: 'OrnWithWt'},
                {id: 'Orn', title: 'Orn'},
                {id: 'TotalWeight', title: 'TotalWeight'}
            ]
        });
         
        const records = json;

        let csvStr = csvStringifier.getHeaderString();
        csvStr += csvStringifier.stringifyRecords(records);
        return csvStr;
    }

    _setResponseHeaders(res) {
        var datetime = +new Date();
        let expiry = datetime + 200000; //extnding the timestamp by around 2minutes
        let expirtyDateString = new Date(expiry).toGMTString();
        res.set('Expires', expirtyDateString);
        res.set('Cache-Control', 'max-age=0, no-cache, must-revalidate, proxy-revalidate');
        res.set('Last-Modified', datetime +'GMT');
        res.set('Content-Type','application/force-download');
        res.set('Content-Type','application/octet-stream');
        res.set('Content-Type','application/download');
        res.set('Content-Disposition','attachment;filename=PledgebookCls.csv');
        res.set('Content-Transfer-Encoding','binary');
        return res;
    }

    async archiveBillsApiHandler(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            if(params.uniqueIdentifiers.length > 0) {
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
                params._pledgebookTableName = await this.service.getPledgebookTableName(params._userId);
                await this._archiveBills(params);
            } else {
                throw 'No bills selected for archiving';
            }
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully archived the bills'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _archiveBills(data) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE ${data._pledgebookTableName} SET Archived=1 WHERE UniqueIdentifier IN (${data.uniqueIdentifiers.join(',')});`;
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    async unArchiveBillsApiHandler(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            if(params.uniqueIdentifiers.length > 0) {
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
                params._pledgebookTableName = await this.service.getPledgebookTableName(params._userId);
                await this._unArchiveBills(params);
            } else {
                throw 'No bills selected for unaArchiving';
            }
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully unArchived the bills'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _unArchiveBills(data) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE ${data._pledgebookTableName} SET Archived=0 WHERE UniqueIdentifier IN (${data.uniqueIdentifiers.join(',')});`;
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    async trashBillsApiHandler(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            if(params.uniqueIdentifiers.length > 0) {
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
                params._pledgebookTableName = await this.service.getPledgebookTableName(params._userId);
                await this._trashBills(params);
            } else {
                throw 'No bills selected for Trash';
            }
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully Trashed the bills'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _trashBills(data) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE ${data._pledgebookTableName} SET Trashed=1 WHERE UniqueIdentifier IN (${data.uniqueIdentifiers.join(',')});`;
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    async restoreTrashedBillsApiHandler(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            if(params.uniqueIdentifiers.length > 0) {
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
                params._pledgebookTableName = await this.service.getPledgebookTableName(params._userId);
                await this._restoreBills(params);
            } else {
                throw 'No bills selected for Trash';
            }
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully Restored the already trashed bills'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _restoreBills(data) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE ${data._pledgebookTableName} SET Trashed=0 WHERE UniqueIdentifier IN (${data.uniqueIdentifiers.join(',')});`;
            db.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    async deleteBillApiHandler(params) {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            if(params.uniqueIdentifiers.length > 0) {
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
                params._pledgebookTableName = await this.service.getPledgebookTableName(params._userId);
                params._pledgebookClosedBillTableName = await this.service.getPledgebookClosedTableName(params._userId);

                await this._copyToRecycleBinTable(params);
                await this._copyClosedBillsToRecycleBinTable(params);
                await this._deleteBillsInClosedPledgebook(params);
                await this._deleteBillsInPledgebook(params);
            } else {
                throw 'No bills selected for deleting';
            }
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully deleted the bills'};
        } catch(e) {
            console.log(e);
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    _copyToRecycleBinTable(params) {
        return new Promise( (resolve, reject) => {
            let sql = SQL.MOVE_PLEDGEBOOK_BILLS_TO_BIN;
            sql = sql.replace(/REPLACE_USER_ID/g, params._userId);
            sql = sql.replace(/PLEDGEBOOK_TABLE_NAME/g, params._pledgebookTableName);
            console.log('COPY TO PLEDGEBOOK RECYCLE BIN');
            console.log(sql);
            console.log(params.uniqueIdentifiers);
            db.query(sql, [params.uniqueIdentifiers], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    _copyClosedBillsToRecycleBinTable(params) {
        return new Promise( (resolve, reject) => {
            let sql = SQL.MOVE_CLOSED_BILLS_TO_BIN;
            sql = sql.replace(/REPLACE_USER_ID/g, params._userId);
            sql = sql.replace(/PLEDGEBOOK_CLOSED_TABLE_NAME/g, params._pledgebookClosedBillTableName);
            console.log('COPY TO PLEDGEBOOK_CLOSED RECYCLE BIN');
            console.log(sql);
            console.log(params.uniqueIdentifiers);
            db.query(sql, [params.uniqueIdentifiers], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    _deleteBillsInPledgebook(params) {
        return new Promise((resolve, reject) => {
            let sql = `DELETE FROM ${params._pledgebookTableName} WHERE UniqueIdentifier IN (?) AND Trashed=1`;
            db.query(sql, [params.uniqueIdentifiers], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }
    
    _deleteBillsInClosedPledgebook(params) {
        return new Promise((resolve, reject) => {
            let sql = `DELETE FROM ${params._pledgebookClosedBillTableName} WHERE pledgebook_uid IN (?)`;
            db.query(sql, [params.uniqueIdentifiers], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    async billRenewalApiHandler(accessToken, payload) {
        try {
            //validate payment arguments
            // if(!payload.paymentDetails)
            //     throw 'Payment mode is not found. Please select any payment mode option';
            // let pd = payload.paymentDetails;
            // let mode = pd.mode;
            // if((mode == '' || mode == null)) {
            //     console.log('Payment mode is null');
            //     throw 'Payment mode is null';
            // }
            // if(pd.mode == 'cash' && (pd.cash.fromAccountId == null || pd.cash.fromAccountId == '')) {
            //     console.log('Payment mode is cash, but account id is null');
            //     throw 'Payment option invalid';
            // } else if(pd.mode == 'cheque' && (pd.cheque.fromAccountId == null || pd.cheque.fromAccountId == '')) {
            //     console.log('Payment mode is cheque, but account id is null');
            //     throw 'Payment option invalid';
            // } else if(pd.mode == 'online' && (pd.online.fromAccountId == null || pd.online.fromAccountId == '')) {
            //     console.log('Payment mode is online, but account id is null');
            //     throw 'Payment option invalid';
            // }
            

            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let pledgebookTableName = await this.service.getPledgebookTableName(_userId);
            let rawPledgebookRecord = await this._getRawPledgebookBillFromDB(pledgebookTableName, payload.redeemParams.pledgeBookUID);
            if(!rawPledgebookRecord)
                throw `Loan Bill ${payload.newBillParams.billSeries} ${payload.newBillParams.billNo} Not found in DB`;

            //Redeem the Bill
            let res = await this.redeemPendingBillAPIHandler({_userId, requestParams: [payload.redeemParams], accessToken});
            if(res.STATUS == 'error')
                throw `Error while closing the bill`;

            // Insert in Pledgebook Table
            let params = this._constructRenewBillPayload(rawPledgebookRecord, payload.newBillParams);
            await this.saveBillDetails(params, pledgebookTableName);

            //Update PledgebookSettings table for LastBillNo
            params._userId = _userId;
            await this.pledgebookSettings.updateLastBillDetail(params);

            //Insert In FundTransaction table
            // params._userId = _userId;
            params.paymentDetails = payload.newBillParams.paymentDetails;
            this.fundTransaction.add({parsedArg: params, pledgebookTableName}, 'pledgebook');

            return {STATUS: 'success', RESPONSE: {}, STATUS_MSG: ''};
        } catch(e) {
            console.log(e);
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    _getRawPledgebookBillFromDB(pledgebookTableName, pledgebookUID) {
        return new Promise(async (resolve, reject) => {
            let theQuery = SQL.RAW_PLEDGEBOOK_RECORD.replace(/PLEDGEBOOK_TABLE_NAME/g, pledgebookTableName);
            db.query(theQuery, [pledgebookUID], (err, res) => {
                if(err) {
                    console.log(err);
                    return resolve(null);
                } else {
                    return resolve(res[0]);
                }
            });
        });
    }

    _constructRenewBillPayload(existingBillFromDB, newBillParams) {
        let billNoWithSeries = newBillParams.billNo;
        if(newBillParams.billSeries) billNoWithSeries = newBillParams.billSeries+"."+newBillParams.billNo;
        let params = {
            uniqueIdentifier: newBillParams.uniqueIdentifier,
            billNo: newBillParams.billNo,
            billNoWithSeries: billNoWithSeries,
            amount: newBillParams.amount,
            presentValue: newBillParams.amount+100, //existingBillFromDB.PresentValue,
            date: newBillParams.date,
            customerId: existingBillFromDB.CustomerId,
            orn: existingBillFromDB.Orn,
            billRemarks: newBillParams.billRemarks,
            ornPicture: {id: existingBillFromDB.OrnPictureId},
            ornCategory: existingBillFromDB.OrnCategory,
            totalWeight: existingBillFromDB.TotalWeight,
            interestPercent: newBillParams.interestPercent,
            interestValue: newBillParams.interestValue,
            otherCharges: 0,
            landedCost: newBillParams.landedCost,
            paymentMode: PAYMENT_MODE[newBillParams.paymentMode] || 1,
            isRenewalBill: true,
            isRenewalOfBillNo: newBillParams.isRenewalOfBillNo,
            isRenewalOfUID: newBillParams.isRenewalOfUID,
            createdDate: utils.getCurrentDateTimeInUTCForDB(),
            modifiedDate: utils.getCurrentDateTimeInUTCForDB(),
            expiryDate: newBillParams.expiryDate,
        }
        return params;
    }

    async  fetchAnalyticsData(accessToken, groupBy, visualizationKey, topCustomerMetric, startDate, endDate) {
        try {
            let _userId = await utils.getStoreOwnerUserId(accessToken, groupBy);
            if(!['date', 'month', 'year'].includes(groupBy)) throw 'Invalid Group by value. Should be either MONTH or YEAR. REceived: '+ groupBy;
            let obj = await this._fetchAnalyticsDataDB(_userId, groupBy, visualizationKey, topCustomerMetric, startDate, endDate);
            return {STATUS: 'success', RESPONSE: obj, STATUS_MSG: ''};
        } catch(e) {
            console.log(e);
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    async _fetchAnalyticsDataDB(_userId, groupBy, visualizationKey, topCustomerMetric, sd, ed) {
        try {
            let responses = await Promise.all([
                // this._fetchCustomerWiseData(_userId, groupBy, visualizationKey, topCustomerMetric, sd, ed),
                // this._fetchCustomerWiseData(_userId, groupBy, visualizationKey, topCustomerMetric, sd, ed, {getAllBills: true}),
                this._fetchBillsCount(_userId, groupBy, visualizationKey, sd, ed)
            ]);
            return {
                topCustomers: [], //[...responses[0], ...responses[1]],
                billsCount: responses[0]
            };
        } catch(e) {
            throw e;
        }
    }

    _fetchCustomerWiseData(_userId, groupBy, visualizationKey, topCustomerMetric, sd, ed, options) {
        return new Promise((resolve, reject) => {
            options = options || {};
            let theQuery = SQL[`P_B_TOP5_CUSTOMER_BY_${groupBy.toUpperCase()}`].replace(/REPLACE_USERID/g, _userId);
            
            let groupByClause = 'GROUP BY p_b.CustomerId, year(p_b.Date)';
            let conditionalStatusCol = '';
            if(!options.getAllBills) {
                conditionalStatusCol = 'p_b.Status as status,';
                groupByClause += ', p_b.Status';
            }

            theQuery = theQuery.replace(/CONDITIONAL_STATUS_COL/g, conditionalStatusCol);

            if(groupBy == 'month') {
                theQuery = theQuery.replace(/GROUP_BY_CLAUSE/g, `${groupByClause}, month(p_b.Date)`);
            } else if(groupBy == 'year') {
                theQuery = theQuery.replace(/GROUP_BY_CLAUSE/g, groupByClause);
            }

            if(topCustomerMetric == 'billCount') theQuery = theQuery.replace(/ORDER_CLAUSE/g, 'ORDER BY billCount desc');
            else if(topCustomerMetric == 'interestCollectedAmt') theQuery = theQuery.replace(/ORDER_CLAUSE/g, 'ORDER BY interestCollectedAmt desc');

            theQuery = theQuery.replace(/TOP_CUSTOMERS_LIMIT/g, ANALYTICS.TOP_CUSTOMERS_LIMIT);

            db.query(theQuery, [sd, ed], (err, res) => {
                if(err) {
                    console.log(err);
                    return resolve(null);
                } else {
                    if(options.getAllBills) {
                        _.each(res, (obj, index) => {
                            obj.status = 'all';
                        })
                    }
                    return resolve(res);
                }
            });
        });
    }
    _fetchBillsCount(_userId, groupBy, visualizationKey, sd, ed) {
        return new Promise((resolve, reject) => {            
            let theQuery = '';
            if(groupBy == 'date') {
                theQuery = SQL.P_B_BILLS_BY_DT.replace(/REPLACE_USERID/g, _userId);
                theQuery = theQuery.replace(/GROUP_BY_CLAUSE/g,`GROUP BY p_b.Status,  year(p_b.Date), month(p_b.Date), date(p_b.Date)`);
            } else if(groupBy == 'month') {
                theQuery = SQL.P_B_BILLS_BY_MNTH.replace(/REPLACE_USERID/g, _userId);
                theQuery = theQuery.replace(/GROUP_BY_CLAUSE/g,`GROUP BY p_b.Status, year(p_b.Date), month(p_b.Date)`);
            } else if(groupBy == 'year') {
                theQuery = SQL.P_B_BILLS_BY_YR.replace(/REPLACE_USERID/g, _userId);
                theQuery = theQuery.replace(/GROUP_BY_CLAUSE/g,`GROUP BY p_b.Status, year(p_b.Date)`);
            }
            db.query(theQuery, [sd, ed], (err, res) => {
                if(err) {
                    console.log(err);
                    return resolve(null);
                } else {
                    let mergedData = {};
                    _.each(res, (val, index) => {
                        let key = '';
                        if(groupBy == "date") key = `${val.date.toLocaleDateString()}`;
                        else if(groupBy == 'month') key = `${val.year}_${val.month}`;
                        else if(groupBy == 'year') key = `${val.year}`;
                        mergedData[key] = mergedData[key] || {...val, amount: 0, bills: 0, interestCollectedAmt: 0};
                        mergedData[key].status = 'all';
                        mergedData[key].amount += val.amount;
                        mergedData[key].bills += val.bills;
                        mergedData[key].interestCollectedAmt += val.interestCollectedAmt;
                        mergedData[key].xAxisName = groupBy == 'date'?`${val.date.toLocaleDateString()}`:groupBy == 'month'?`${val.year}/${val.month}`:val.year;
                        val.xAxisName = groupBy == 'date'?`${val.date.toLocaleDateString()}`:groupBy == 'month'?`${val.year}/${val.month}`:val.year;
                        if(val.status == 1) {
                            mergedData[key].bills_pending = val.bills;
                            mergedData[key].amount_pending = val.amount;
                            mergedData[key].interestCollectedAmt_pending = val.interestCollectedAmt;
                        } else {
                            mergedData[key].bills_closed = val.bills;
                            mergedData[key].amount_closed = val.amount;
                            mergedData[key].interestCollectedAmt_closed = val.interestCollectedAmt;
                        }
                    });
                    return resolve([...res, ...Object.values(mergedData)]);
                }
            });
        });
    }

    async fetchAnalyticsDataByCustomerWise(accessToken, topCustomerMetric, billStatus, startDate, endDate, limit, offset) {
        try {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let respObj = await this._fetchAnalyticsDataByCustomerWise(_userId, topCustomerMetric, billStatus, startDate, endDate, limit, offset);
            return {STATUS: 'success', RESPONSE: respObj, STATUS_MSG: ''};
        } catch(e) {
            console.log(e);
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    async _fetchAnalyticsDataByCustomerWise(_userId, topCustomerMetric, billStatus, sd, ed, limit, offset) {
        try {
            let theQuery = SQL.P_B_BILLS_BY_CUSTOMER.replace(/REPLACE_USERID/g, _userId);
            let orderClause = 'ORDER BY BillsCount DESC';
            if(topCustomerMetric == 'interestCollectedAmt')
                orderClause = 'ORDER BY InterestCollected DESC';
            theQuery = theQuery.replace(/ORDER_CLAUSE/, orderClause);
        
            let whereCondition = "";
            if(billStatus == "pending") {
                whereCondition = 'AND p_b.Status=1';
            } else if(billStatus == "closed") {
                whereCondition = 'AND p_b.Status=0';
            }
            theQuery = theQuery.replace(/WHERE_CONDITION/g, whereCondition);

            let promise1 = new Promise((resolve, reject) => {
                db.query(theQuery, [sd, ed, parseInt(limit), parseInt(offset)], (err, res) => {
                    if(err) {
                        console.log(err);
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
            });
            let cntQuery = SQL.P_B_BILLS_BY_CUSTOMER_CNT.replace(/REPLACE_USERID/g, _userId);
            let promise2 = new Promise((resolve, reject) => {
                db.query(cntQuery, [sd, ed], (err, res) => {
                    if(err) {
                        console.log(err);
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
            });

            let results = await Promise.all([promise1, promise2]);
            _.each(results[0], (aRow, index) => {
                aRow.UserImagePath = utils.constructImageUrl(aRow.UserImagePath);
            })
            return {
                rows: results[0],
                totalCnt: results[1][0].cnt
            }
        } catch(e) {

        }
    }
}

export const Pledgebook = new PledgebookCls();

Pledgebook.remoteMethod('insertNewBillAPIHandler', {
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
    http: {path: '/add-new-billrecord', verb: 'post'},
    description: 'Adding a new record in pledgebook'
});

Pledgebook.remoteMethod('updateBillAPIHandler', {
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
    http: {path: '/update-billrecord', verb: 'post'},
    description: 'Updating the existing bill in pledgebook'
});

Pledgebook.remoteMethod('getPendingBillsAPIHandler', {
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
    http: {path: '/get-pending-bills', verb: 'get'},
    description: 'For fetching pending bills.',
});

Pledgebook.remoteMethod('billRenewalApiHandler', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken;
                if(req && req.headers.authorization)
                    accessToken = req.headers.authorization;
                return accessToken;
            },
            description: 'Arguments goes here',
        },{
            arg: 'payload',
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
    http: {path: '/renew-loan-bill', verb: 'post'},
    description: 'Bill Renewal'
});

Pledgebook.remoteMethod('redeemPendingBillAPIHandler', {
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
    http: {path: '/redeem-pending-bills', verb: 'post'},
    description: 'Updating bill in pledgebook'
});

Pledgebook.remoteMethod('reOpenClosedBillsAPIHandler', {
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
    http: {path: '/re-open-closed-bills', verb: 'post'},
    description: 'Re-opening a closed bill in pledgebook'
});    

Pledgebook.remoteMethod('getPendingBillNosAPIHandler', {
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
    http: {path: '/get-pending-bill-nos', verb: 'get'},
    description: 'For fetching pending bills Numbers.',
});

Pledgebook.remoteMethod('getBillDetailsAPIHandler', {
    accepts: [
        {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken = req && req.query.access_token;
                return accessToken;
            },
            description: 'Arguments goes here',
        },
        // {
        //     arg: 'billNoArray', type: 'array', http: (ctx) => {
        //         let req = ctx && ctx.req;
        //         let billNoArray = req && req.query.bill_nos;
        //         return JSON.parse(billNoArray);
        //     },
        //     description: 'For fetching the bill data based on bill Number'
        // },
        {
            arg: 'billNoWithUUIDArray', type: 'array', http: (ctx) => {
                let req = ctx && ctx.req;
                let billNoWithUuid = req && req.query.bill_no_with_uuid;
                return JSON.parse(billNoWithUuid);
            },
            description: 'For fetching the bill data based on bill Number'
        },
        {
            arg: 'fetchOnlyPending', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let fetchOnlyPending = req && req.query.fetch_only_pending;
                if(typeof fetchOnlyPending == 'undefined')
                    fetchOnlyPending = false;
                return fetchOnlyPending;
            },
            description: 'Fetch bill only if its in pending state'
        },
        {
            arg: 'fetchFundTrns', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let fetchFundTrns = req && req.query.fetch_fund_trns;
                if(typeof fetchFundTrns == 'undefined')
                    fetchFundTrns = false;
                return fetchFundTrns;
            },
            description: 'Fetch cash transaction details associated with this bill.'
        },
    ],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body',
        },
    },
    http: {path: '/get-bill-details', verb: 'get'},
    description: 'For fetching bill data.',
});

Pledgebook.remoteMethod('fetchUserHistoryAPIHandler', {
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
        }, {
            arg: 'filters', type: 'object', http: (ctx) => {
                let req = ctx && ctx.req;
                let filters = req && req.query.filters;
                filters = filters ? JSON.parse(filters) : {};
                return filters;
            },
            description: 'filters arguments goes here',
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
})

Pledgebook.remoteMethod('exportAPIHandler', {
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
        }, {
            arg: 'res', type: 'object', 'http': {source: 'res'}
        }
    ],
    isStatic: true,
    returns: [
        {arg: 'body', type: 'file', root: true},
        {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
        ],
    http: {path: '/export-pledgebook', verb: 'get'},
    description: 'For exporting the pledgebook'
});

Pledgebook.remoteMethod('archiveBillsApiHandler', {
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
    http: {path: '/archive-bills', verb: 'put'},
    description: 'Archive the bills in pledgebook'
});

Pledgebook.remoteMethod('unArchiveBillsApiHandler', {
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
    http: {path: '/un-archive-bills', verb: 'put'},
    description: 'Archive the bills in pledgebook'
});

Pledgebook.remoteMethod('trashBillsApiHandler', {
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
    http: {path: '/trash-bills', verb: 'put'},
    description: 'Trash the bills in pledgebook'
});

Pledgebook.remoteMethod('restoreTrashedBillsApiHandler', {
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
    http: {path: '/restore-trashed-bills', verb: 'put'},
    description: 'Resote the trahsed bills in pledgebook'
});

Pledgebook.remoteMethod('deleteBillApiHandler', {
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
    http: {path: '/delete-bills', verb: 'del'},
    description: 'Delete Bills in Pledgebook'
});

Pledgebook.remoteMethod('fetchAnalyticsData', {
    accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken;
                if(req && req.headers.authorization)
                    accessToken = req.headers.authorization;
                return accessToken;
            },
            description: 'Accesstoken',
        },
        {
            arg: 'groupBy', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let groupBy = req && req.query.groupBy;
                return groupBy;
            },
            description: 'groupBy',
        },
        {
            arg: 'visualizationKey', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let visualizationKey = req && req.query.visualization_key;
                return visualizationKey;
            },
            description: 'visualizationKey',
        },
        {
            arg: 'topCustomerMetric', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let topCustomerMetric = req && req.query.top_customer_metric;
                return topCustomerMetric;
            },
            description: 'topCustomerMetric',
        },
        {
            arg: 'startDate', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let dt = req && req.query.start_date;
                return dt;
            },
            description: 'Start Date',
        },
        {
            arg: 'endDate', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let dt = req && req.query.end_date;
                return dt;
            },
            description: 'End Date',
        },
    ],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body',
        }
    },
    http: {path: '/analytics-data', verb: 'get'},
    description: ''
});

Pledgebook.remoteMethod('fetchAnalyticsDataByCustomerWise', {
    accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken;
                if(req && req.headers.authorization)
                    accessToken = req.headers.authorization;
                return accessToken;
            },
            description: 'Accesstoken',
        },
        {
            arg: 'topCustomerMetric', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let topCustomerMetric = req && req.query.top_customer_metric;
                return topCustomerMetric;
            },
            description: 'topCustomerMetric',
        },
        {
            arg: 'billStatus', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let billStatus = req && req.query.bill_status;
                return billStatus;
            },
            description: 'billStatus',
        },
        {
            arg: 'startDate', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let dt = req && req.query.start_date;
                return dt;
            },
            description: 'Start Date',
        },
        {
            arg: 'endDate', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let dt = req && req.query.end_date;
                return dt;
            },
            description: 'End Date',
        },
        {
            arg: 'limit', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let limit = req && req.query.limit;
                return limit;
            },
            description: 'Limit',
        },
        {
            arg: 'offset', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let offset = req && req.query.offset;
                return offset;
            },
            description: 'Offset',
        },
    ],
    returns: {
        type: 'object',
        root: true,
        http: {
            source: 'body',
        }
    },
    http: {path: '/analytics-data/group-by-customer', verb: 'get'},
    description: ''
})

let SQL = {
    MOVE_PLEDGEBOOK_BILLS_TO_BIN: `INSERT INTO pledgebook_recycle_bin (
        UniqueIdentifier, BillNo, Amount, 
        Date, CustomerId, Orn, OrnPictureId, 
        OrnCategory, TotalWeight, IntPercent, 
        IntVal, OtherCharges, LandedCost, 
        Remarks, Status, closedBillReference, 
        History, Alert, Archived, CreatedDate, 
        ModifiedDate, UserId
      ) 
      SELECT 
        UniqueIdentifier, 
        BillNo, 
        Amount, 
        Date, 
        CustomerId, 
        Orn, 
        OrnPictureId, 
        OrnCategory, 
        TotalWeight, 
        IntPercent, 
        IntVal, 
        OtherCharges, 
        LandedCost, 
        Remarks, 
        Status, 
        closedBillReference, 
        History, 
        Alert, 
        Archived, 
        CreatedDate, 
        ModifiedDate, 
        REPLACE_USER_ID 
      FROM 
        PLEDGEBOOK_TABLE_NAME 
      WHERE 
        UniqueIdentifier IN (?)
      `,
    MOVE_CLOSED_BILLS_TO_BIN: `INSERT INTO pledgebook_closed_bills_recycle_bin (
        uid, pledgebook_uid, bill_no, 
        pledged_date, closed_date, principal_amt, 
        no_of_month, rate_of_interest, 
        int_rupee_per_month, interest_amt, 
        actual_estimated_amt, discount_amt, 
        paid_amt, handed_over_to_person, 
        user_id
      ) 
      SELECT 
        uid, 
        pledgebook_uid, 
        bill_no, 
        pledged_date, 
        closed_date, 
        principal_amt, 
        no_of_month, 
        rate_of_interest, 
        int_rupee_per_month, 
        interest_amt, 
        actual_estimated_amt, 
        discount_amt, 
        paid_amt, 
        handed_over_to_person, 
        REPLACE_USER_ID
      FROM 
        PLEDGEBOOK_CLOSED_TABLE_NAME 
      WHERE 
        pledgebook_uid IN (?)`,
    RAW_PLEDGEBOOK_RECORD: `SELECT * FROM PLEDGEBOOK_TABLE_NAME WHERE 
        UniqueIdentifier=?`,
    P_B_BILLS_BY_DT: `SELECT 
            year(p_b.Date) as year,
            month(p_b.Date) as month,
            date(p_b.Date) as date,
            COUNT(BillNo) AS bills,
            SUM(Amount) AS amount,
            p_b.Status as status,
            sum(COALESCE(p_b.IntVal,0) + COALESCE(p_b_c.interest_amt,0)) as interestCollectedAmt
        FROM
            pledgebook_REPLACE_USERID p_b
                LEFT JOIN
            customer_REPLACE_USERID ON customer_REPLACE_USERID.CustomerId = p_b.CustomerId
                left join
            pledgebook_closed_bills_REPLACE_USERID p_b_c on p_b.UniqueIdentifier=p_b_c.pledgebook_uid
        WHERE
            p_b.Date BETWEEN ? and ?
        GROUP_BY_CLAUSE`,
    P_B_BILLS_BY_MNTH: `SELECT 
            year(p_b.Date) as year,
            month(p_b.Date) as month,
            COUNT(BillNo) AS bills,
            SUM(Amount) AS amount,
            p_b.Status as status,
            sum(COALESCE(p_b.IntVal,0) + COALESCE(p_b_c.interest_amt,0)) as interestCollectedAmt
        FROM
            pledgebook_REPLACE_USERID p_b
                LEFT JOIN
            customer_REPLACE_USERID ON customer_REPLACE_USERID.CustomerId = p_b.CustomerId
                left join
            pledgebook_closed_bills_REPLACE_USERID p_b_c on p_b.UniqueIdentifier=p_b_c.pledgebook_uid
        WHERE
            p_b.Date BETWEEN ? and ?
        GROUP_BY_CLAUSE`,
    P_B_BILLS_BY_YR: `SELECT 
            year(p_b.Date) as year,
            COUNT(BillNo) AS bills,
            SUM(Amount) AS amount,
            p_b.Status as status,
            sum(COALESCE(p_b.IntVal,0) + COALESCE(p_b_c.interest_amt,0)) as interestCollectedAmt
        FROM
            pledgebook_REPLACE_USERID p_b
                LEFT JOIN
            customer_REPLACE_USERID ON customer_REPLACE_USERID.CustomerId = p_b.CustomerId
                left join
            pledgebook_closed_bills_REPLACE_USERID p_b_c on p_b.UniqueIdentifier=p_b_c.pledgebook_uid
        WHERE
            p_b.Date BETWEEN ? and ?
        GROUP_BY_CLAUSE`,
    P_B_BILLS_BY_CUSTOMER: ` 
                SELECT 
                    cust.Name,
                    cust.GaurdianName,
                    cust.Address,
                    cust.City,
                    cust.Mobile,
                    cust.Place,
                    cust.Pincode, 
                    image.Path as UserImagePath,
                    sum(p_b.Amount) as PledgedAmt,
                    sum(COALESCE(p_b.IntVal,0) + COALESCE(p_b_c.interest_amt,0)- COALESCE(p_b_c.discount_amt,0)) as InterestCollected,
                    count(*) as BillsCount,
                    SUM(CASE WHEN P_b.Status = 1 THEN 1 ELSE 0 END) AS PendingBills,
                    SUM(CASE WHEN p_b.Status = 0 THEN 1 ELSE 0 END) AS ClosedBills
                FROM
                    pledgebook_REPLACE_USERID p_b
                        LEFT JOIN
                    pledgebook_closed_bills_REPLACE_USERID p_b_c ON p_b.UniqueIdentifier = p_b_c.pledgebook_uid
                        LEFT JOIN 
                    customer_REPLACE_USERID cust ON cust.CustomerId = p_b.CustomerId
                        LEFT JOIN
                    image ON cust.ImageId = image.Id
                WHERE 
                    p_b.Date BETWEEN ? and ?
                    WHERE_CONDITION
                GROUP BY 
                    cust.CustomerId
                ORDER_CLAUSE
                LIMIT ? OFFSET ?`,
    P_B_BILLS_BY_CUSTOMER_CNT: `SELECT count(*) as cnt from (
        SELECT 
            count(*) as BillsCount
        FROM
            pledgebook_REPLACE_USERID p_b
            LEFT JOIN
            customer_REPLACE_USERID cust ON cust.CustomerId = p_b.CustomerId
        WHERE 
            p_b.Date BETWEEN ? and ?
        GROUP BY 
            cust.CustomerId
            ) A`
}


export default router;