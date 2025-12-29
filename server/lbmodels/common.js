'use strict';
var DbBackup = require('../jobs/database-backup-job');
const { resolve } = require('app-root-path');
let utils = require('../utils/commonUtils');

import db from '../db/index.js';
import express from 'express';
import { FundTransaction } from './fund-transaction.js';
const { remoteMethod } = require('../routes/remoteMethod.js');

const router = express.Router();

class CommonCls {
    constructor() {

    }
    remoteMethod(apiMeth, config) {
        remoteMethod(router, this, apiMeth, config);
    }

}

export const Common = new CommonCls();


// module.exports = function(Common) {
    CommonCls.prototype.exportDbAPIHandler = async (accessToken, res, cb) => {
        try {
            let filename = Date.now();
            let dbBackupIntance = new DbBackup(filename);
            let response = await dbBackupIntance.start();
            if(response.STATUS == 'success')
                res.download(response.filePath+response.fileName, response.fileName);
            else
                throw new Error(response.ERROR);

        } catch(e) {
            res.send({STATUS: 'ERROR', ERROR: e});
        }
    };

    CommonCls.prototype.remoteMethod('exportDbAPIHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
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
        http: {path: '/export-db', verb: 'get'},
        description: 'For exporting the Full Database'
    });

    CommonCls.prototype.remoteMethod('addTagApi', {
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
        http: {path: '/add-tag', verb: 'post'},
        description: 'Add Tags.',
    });

    CommonCls.prototype.remoteMethod('removeTagApi', {
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
        http: {path: '/remove-tag', verb: 'post'},
        description: 'Add Tags.',
    });


    CommonCls.prototype.remoteMethod('fetchBankList', {
        accepts: [],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/fetch-bank-list', verb: 'get'},
        description: 'For fetching all banks list.',
    });

    CommonCls.prototype.remoteMethod('saveLocation', {
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
        http: {path: '/save-location', verb: 'post'},
        description: 'Save user logged in Location',
    });

    CommonCls.prototype.remoteMethod('syncAnalyticsAppUsage', {
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
        http: {path: '/sync-app-usage', verb: 'post'},
        description: 'sync analytics',
    });

    CommonCls.prototype.remoteMethod('syncAnalyticsAppLogin', {
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
        http: {path: '/sync-app-login', verb: 'post'},
        description: 'sync analytics',
    });

    CommonCls.prototype.remoteMethod('syncAnalyticsPledgebook', {
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
        http: {path: '/sy-analytics-pb', verb: 'post'},
        description: 'sync analytics PB',
    });

    CommonCls.prototype.remoteMethod('syncAnalyticsModulesUsed', {
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
        http: {path: '/sy-analytics-modules', verb: 'post'},
        description: 'sync analytics modules',
    });

    CommonCls.prototype.remoteMethod('coreActionApi', {
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
        http: {path: '/core-action', verb: 'post'},
        description: 'core-action',
    });

    CommonCls.prototype.createNewTablesIfNotExist = async (userId) => {
        try {
            await CommonCls.prototype._createCustomerTable(userId);
            await CommonCls.prototype._createCustomerAttachmentsTable(userId);
            await CommonCls.prototype._createPledgebookTable(userId);
            await CommonCls.prototype._createPledgebookClosingBillTable(userId);
            await CommonCls.prototype._createStockTable(userId);
            await CommonCls.prototype._createStockSoldTable(userId);
            await CommonCls.prototype._createOldItemStockTable(userId);
            await CommonCls.prototype._createJwlInvoiceTable(userId);
            await CommonCls.prototype._createJwlInvoiceItemTable(userId);
            await CommonCls.prototype._createJwlEstimateInvoiceTable(userId);
            await CommonCls.prototype._createJwlEstimateInvoiceItemsTable(userId);
            await CommonCls.prototype._createOldItemEstimateTbl(userId);
            await CommonCls.prototype._createFundTrnsTable(userId);
            // await CommonCls.prototype._createFundTrnsTempTable(userId);
            await CommonCls.prototype._createFundTrnsProcedure(userId);
            
            await CommonCls.prototype._createUdhaarTable(userId);
            await CommonCls.prototype._createUdhaarClosedBillsTable(userId);
                
            await CommonCls.prototype._insertUdhaarDefaults(userId);
            await CommonCls.prototype._createNotesTable(userId);

            await CommonCls.prototype._insertJewelleryTagSettingDefaults(userId);
            await CommonCls.prototype._createTriggers(SQL.TRIGGER_1, userId);
            await CommonCls.prototype._createTriggers(SQL.TRIGGER_2, userId);
            await CommonCls.prototype._createTriggers(SQL.TRIGGER_3, userId);
            await CommonCls.prototype._createTriggers(SQL.TRIGGER_4, userId);
            return true;
        } catch(e) {
            throw e;
        }
    }

    CommonCls.prototype.setupNewUser = async (userId) => {
        try {
            await CommonCls.prototype._createFundAccount(userId);
            return true;
        } catch(e) {
            throw e;
        }
    }

    CommonCls.prototype._createCustomerTable = (userId) => {
        return new Promise( (resolve, reject) => {
            let simpleSql = `SELECT * FROM customer_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
            // db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.CUSTOMER_TABLE.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "customer_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "customer_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"customer_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createCustomerAttachmentsTable = (userId) => {
        return new Promise( (resolve, reject) => {
            let simpleSql = `SELECT * FROM customer_attachments_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.CUSTOMER_ATTACHMENTS_TABLE.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "customer_attachments_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "customer_attachments_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"customer_attachments_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createPledgebookTable = (userId) => {
        return new Promise( (resolve, reject) => {
            let simpleSql = `SELECT * FROM pledgebook_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.PLEDGEBOOK_TABLE.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "pledgebook_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "pledgebook_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"pledgebook_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createPledgebookClosingBillTable = (userId) => {
        return new Promise ( (resolve, reject) => {
            let simpleSql = `SELECT * FROM pledgebook_closed_bills_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.PLEDGEBOOK_CLOSED_BILLS_TABLE.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "pledgebook_closed_bills_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "pledgebook_closed_bills_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"pledgebook_closed_bills_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }


    CommonCls.prototype._createStockTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM stock_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.STOCK_TABLE.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "stock_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "stock_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"stock_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }
    CommonCls.prototype._createStockSoldTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM stock_sold_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.STOCK_SOLD_TABLE.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "stocks_sold_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "stocks_sold_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"stocks_sold_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }
    CommonCls.prototype._createOldItemStockTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM old_items_stock_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.OLD_ITEMS_STOCK.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "old_items_stock_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log('New "old_items_stock_<id>" table created!');
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"old_items_stock_<id>" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }
    CommonCls.prototype._createJwlInvoiceTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM jewellery_invoices_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.JWL_INVOICES.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "jewellery_invoices_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "jewellery_invoices_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"jewellery_invoices_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createJwlInvoiceItemTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM jewellery_invoice_items_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.JWL_INVOICE_ITEMS.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "jewellery_invoice_items_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "jewellery_invoice_items_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"jewellery_invoice_items_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createJwlEstimateInvoiceTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM jewellery_estimate_invoices_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.JWL_ESTIMATE_INVOICES.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "jewellery_estimate_invoices_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "jewellery_estimate_invoices_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"jewellery_estimate_invoices_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createJwlEstimateInvoiceItemsTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM jewellery_estimate_invoices_items_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.JWL_ESTIMATE_INVOICE_ITEM.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "jewellery_estimate_invoices_items_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "jewellery_estimate_invoices_items_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"jewellery_estimate_invoices_items_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createOldItemEstimateTbl = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM old_items_estimates_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.OLD_ITEMS_ESTIMATE.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "old_items_estimates_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "old_items_estimates_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"old_items_estimates_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }
    
    CommonCls.prototype._createFundTrnsTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM fund_transactions_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.FUND_TRANS.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "fund_transactions_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "fund_transactions_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"fund_transactions_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    /*CommonCls.prototype._createFundTrnsTempTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM fund_trns_tmp_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.FUND_TRANS_TMP.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "fund_trns_tmp_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "fund_trns_tmp_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"fund_trns_tmp_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }*/

    CommonCls.prototype._createFundTrnsProcedure = (userId) => {
        return new Promise((resolve, reject) => {
            let sql = SQL.FUND_TRNS_PROCEDURE.replace(/REPLACE_USERID/g, userId);
            db.query(sql, (err, resp) => {
                if(err) {
                    if(err.code == 'ER_SP_ALREADY_EXISTS') {
                        console.log(`Stored Procedure fund_trns_procedure_${userId} already exists`);
                        return resolve(false);
                    } else {
                        console.log(err);
                        console.log(`Error occured while creating a new "fund_trns_procedure_<id>" table for the user: ${userId}`);
                        return reject(err);
                    }
                } else {
                    console.log(`New "fund_trns_procedure_${userId}" table created!`);
                    return resolve(true);
                }
            });
        });
    }

    CommonCls.prototype._createFundAccount = (userId) => {
        return new Promise((resolve, reject) => {
            db.query(SQL.NEW_FUND_ACCOUNT, [userId, 'Shop', 1], (err, resp) => {
                if(err) {
                    console.log(err);
                    console.log(`Error occured while inserting new Fund_account for userId: ${userId}`);
                    return reject(err);
                } else {
                    console.log('Fund Account inserted');
                    return resolve(true);
                }
            });
        });
    }

    CommonCls.prototype._createUdhaarTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM udhaar_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.UDHAAR.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "udhaar_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "udhaar_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"udhaar_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createUdhaarClosedBillsTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM udhaar_closed_bills_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.UDHAAR_CLOSED_LIST.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "udhaar_closed_bills_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "udhaar_closed_bills_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"udhaar_closed_bills_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._insertUdhaarDefaults = (userId) => {
        return new Promise((resolve, reject) => {
            let sql = `INSERT IGNORE INTO udhaar_settings (user_id, bill_series, next_bill_no) VALUES (?,'U',1)`
            db.query(sql, [userId], (err, resp) => {
                if(err) {
                    console.log(err);
                    console.log(`Error occured while creating Udhaar setting defaults for new user : ${userId}`);
                    return reject(err);
                } else {
                    console.log(`Inserted udhaar settings for th enew user: ${userId}`);
                    return resolve(true);
                }
            });
        });
    }

    CommonCls.prototype._createNotesTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM notes_${userId} LIMIT 1`;
            db.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.NOTES.replace(/REPLACE_USERID/g, userId);
                    db.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "notes_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "notes_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"notes_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    CommonCls.prototype._createTriggers = (triggerSQL, userId) => {
        return new Promise((resolve, reject) => {
            let sql = triggerSQL.replace(/REPLACE_USERID/g, userId);
            db.query(sql, (err, resp) => {
                if(err) {
                    console.log(err);
                    console.log(`Error occured while setting "triggers <id>"  for the user: ${userId}`);
                    console.log(triggerSQL);
                    return reject(err);
                } else {
                    console.log(`New "triggers ${userId}" been set!`);
                    return resolve(true);
                }
            });
        });
    }

    CommonCls.prototype.fetchBankList = (cb) => {
        CommonCls.prototype._fetchBankList().then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    CommonCls.prototype._fetchBankList = () => {
        return new Promise( async (resolve, reject) => {
            let query = `SELECT * FROM banks_list`;
            db.query(query, (err, res) => {
                if(err){
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    CommonCls.prototype.addTagApi = (apiParams, cb) => {
        CommonCls.prototype._addTagApi(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    CommonCls.prototype._addTagApi = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                switch(apiParams.identifier) {
                    case 'fund_transaction':
                        await FundTransaction.addTag(apiParams);
                        // await CommonCls.prototype.app.models.FundTransaction.prototype.addTag(apiParams);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    CommonCls.prototype.removeTagApi = (apiParams, cb) => {
        CommonCls.prototype._removeTagApi(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    CommonCls.prototype._removeTagApi = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                switch(apiParams.identifier) {
                    case 'fund_transaction':
                        await FundTransaction.removeTag(apiParams);
                        // await CommonCls.prototype.app.models.FundTransaction.prototype.removeTag(apiParams);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    CommonCls.prototype.saveLocation = (apiParams, cb) => {
        CommonCls.prototype._saveLocation(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    // EXTERNAL CODE - CAN BE SEPARATED
    CommonCls.prototype._saveLocation = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                db.query(SQL.STORE_LOCATION, [apiParams.latitude, apiParams.longitude, apiParams._userId], (err, res) => {
                    if(err){
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
                // return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    CommonCls.prototype.syncAnalyticsAppUsage = (apiParams, cb) => {
        CommonCls.prototype._syncAnalyticsAppUsage(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    CommonCls.prototype._syncAnalyticsAppUsage = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<apiParams.unsyncedMsgs.length; i++) {
                    let msgObj = apiParams.unsyncedMsgs[i];
                    let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
                    db.query(SQL.SYNC_ANALYTICS_APP_USAGE, 
                        [msgObj.id, msgObj.session_uid, msgObj.wmic, msgObj.is_safe, msgObj.server_action, msgObj.created_date, msgObj.modified_date, dt, dt], 
                        (err, res) => {
                        if(err){
                            console.log(err);
                            return reject(err);
                        } else {
                            return resolve(true);
                        }
                    });
                }
                
                // return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }
    CommonCls.prototype.syncAnalyticsAppLogin = (apiParams, cb) => {
        CommonCls.prototype._syncAnalyticsAppLogin(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    CommonCls.prototype._syncAnalyticsAppLogin = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<apiParams.unsyncedMsgs.length; i++) {
                    let msgObj = apiParams.unsyncedMsgs[i];
                    let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
                    db.query(SQL.SYNC_ANALYTICS_APP_LOGIN, 
                        [msgObj.id, msgObj.user_id, msgObj.wmic, msgObj.action, msgObj.resp, msgObj.other, msgObj.created_date, msgObj.modified_date, dt, dt], 
                        (err, res) => {
                        if(err){
                            console.log(err);
                            return reject(err);
                        } else {
                            return resolve(true);
                        }
                    });
                }
                
                // return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    CommonCls.prototype.syncAnalyticsPledgebook = (apiParams, cb) => {
        CommonCls.prototype._syncAnalyticsPledgebook(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    CommonCls.prototype._syncAnalyticsPledgebook = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<apiParams.unsyncedMsgs.length; i++) {
                    let msgObj = apiParams.unsyncedMsgs[i];
                    let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
                    db.query(SQL.SYNC_ANALYTICS_PLEDGEBOOK, 
                        [msgObj.id, msgObj.user_id, msgObj.unique_identifier, msgObj.bill_no, msgObj.bill_date, msgObj.cust_id, msgObj.amount, msgObj.action, msgObj.created_date, msgObj.modified_date, dt], 
                        (err, res) => {
                        if(err){
                            console.log(err);
                            return reject(err);
                        } else {
                            return resolve(true);
                        }
                    });
                }
                
                // return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    CommonCls.prototype.syncAnalyticsModulesUsed = (apiParams, cb) => {
        CommonCls.prototype._syncAnalyticsModulesUsed(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    CommonCls.prototype._syncAnalyticsModulesUsed = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<apiParams.unsyncedMsgs.length; i++) {
                    let msgObj = apiParams.unsyncedMsgs[i];
                    let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
                    db.query(SQL.SYNC_ANALYTICS_MODULES_USAGE, 
                        [msgObj.id, msgObj.user_id, msgObj.module, msgObj.ctx1, msgObj.ctx2, msgObj.ctx3, msgObj.created_date, msgObj.modified_date, dt], 
                        (err, res) => {
                        if(err){
                            console.log(err);
                            return reject(err);
                        } else {
                            return resolve(true);
                        }
                    });
                }
                
                // return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    CommonCls.prototype.coreActionApi = (apiParams, cb) => {
        CommonCls.prototype._coreActionApi(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    CommonCls.prototype._coreActionApi = (apiParams) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM app WHERE `key`=?', [apiParams.appKey], (err, res) => {
                if(err){
                    return reject(err);
                } else if(res && res.length>0) {
                    if(res[0].core_flag == 1 || res[0].core_flag == '1')
                        return resolve('UNLINK');
                    else 
                        return resolve('true');
                } else {
                    return resolve('app_key_not_found');
                }
            });
        });
    }

    CommonCls.prototype._insertJewelleryTagSettingDefaults = (userId) => {
        return new Promise((resolve, reject) => {
            let sql = `INSERT IGNORE INTO jewellery_tag_settings (user_id, selected_tag_template_id) VALUES (?,1)`
            db.query(sql, [userId], (err, resp) => {
                if(err) {
                    console.log(err);
                    console.log(`Error occured while insetting tag defaults for new user : ${userId}`);
                    return reject(err);
                } else {
                    console.log(`Inserted tag defaults for the new user: ${userId}`);
                    return resolve(true);
                }
            });
        })
    }
// };

let SQL = {
    CUSTOMER_TABLE: `CREATE TABLE customer_REPLACE_USERID (
        CustomerId int NOT NULL AUTO_INCREMENT,
        UserId int DEFAULT NULL,
        NamePrefix varchar(45) DEFAULT NULL,
        Name varchar(255) DEFAULT NULL,
        GuardianRelation varchar(45) DEFAULT 'c/o',
        GuardianNamePrefix varchar(45) DEFAULT NULL,
        GaurdianName varchar(255) DEFAULT NULL,
        ImageId int DEFAULT NULL,
        Address varchar(255) DEFAULT NULL,
        Place varchar(255) DEFAULT NULL,
        City varchar(255) DEFAULT NULL,
        Pincode int DEFAULT NULL,
        Mobile bigint DEFAULT NULL,
        SecMobile bigint DEFAULT NULL,
        OtherDetails text,
        Notes text,
        HashKey varchar(45) DEFAULT NULL,
        CustStatus int DEFAULT '1',
        IsBlacklisted int DEFAULT 0,
        CreatedAt datetime DEFAULT NULL,
        ModifiedAt datetime DEFAULT NULL,
        PRIMARY KEY (CustomerId)
      )`,
    CUSTOMER_ATTACHMENTS_TABLE: `
        CREATE TABLE customer_attachments_REPLACE_USERID (
            CustomerAttachmentId INT NOT NULL AUTO_INCREMENT,
            UserId INT NOT NULL,
            CustomerId INT NOT NULL,
            ImageId INT NOT NULL,
            CreatedDate DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
            ModifiedDate DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (CustomerAttachmentId)
        )`,
    PLEDGEBOOK_TABLE: `CREATE TABLE pledgebook_REPLACE_USERID (
                            UniqueIdentifier varchar(45),
                            BillNo varchar(45) DEFAULT NULL,
                            Amount int(11) DEFAULT NULL,
                            PresentValue int(11) DEFAULT 0,
                            Date datetime DEFAULT NULL,
                            CustomerId int(11) DEFAULT NULL,
                            Orn text DEFAULT NULL,
                            OrnPictureId int(11) DEFAULT NULL,
                            OrnCategory varchar(45) NULL,
                            TotalWeight FLOAT NOT NULL DEFAULT 0.00,
                            IntPercent FLOAT NULL DEFAULT 0,
                            IntVal FLOAT NULL DEFAULT 0,
                            OtherCharges FLOAT NULL DEFAULT 0,
                            LandedCost FLOAT NULL DEFAULT 0,
                            PaymentMode int(11) DEFAULT 1,
                            Remarks text,
                            PledgedFor int DEFAULT NULL,
                            SecJewelRedemeer int DEFAULT NULL,
                            Status int(11) NOT NULL DEFAULT 1,
                            closedBillReference varchar(45) DEFAULT NULL,
                            History text,
                            ExpiryDate datetime DEFAULT NULL,
                            Alert int(11) DEFAULT NULL,
                            Archived int(11) DEFAULT 0,
                            Trashed int(11) DEFAULT 0,
                            IsRenewalBill int(11) DEFAULT 0,
                            IsRenewalOfBillNo varchar(45) DEFAULT NULL,
                            IsRenewalOfUID varchar(45) DEFAULT NULL,
                            Renewed int(11) DEFAULT 0,
                            RenewedNewBillNo varchar(45) DEFAULT NULL,
                            RenewedNewUID varchar(45) DEFAULT NULL,
                            CreatedDate datetime DEFAULT NULL,
                            ModifiedDate datetime DEFAULT NULL,
                            PRIMARY KEY (UniqueIdentifier)
                        ) ENGINE=InnoDB DEFAULT CHARSET=latin1`,
    PLEDGEBOOK_CLOSED_BILLS_TABLE: `CREATE TABLE pledgebook_closed_bills_REPLACE_USERID (
                                        uid BIGINT(20) NOT NULL,
                                        pledgebook_uid varchar(45) NOT NULL,
                                        bill_no varchar(45) NOT NULL,
                                        pledged_date varchar(45) DEFAULT NULL,
                                        closed_date varchar(45) DEFAULT NULL,
                                        principal_amt int(50) DEFAULT NULL,
                                        no_of_month int(20) DEFAULT NULL,
                                        rate_of_interest varchar(45) DEFAULT NULL,
                                        int_rupee_per_month varchar(45) DEFAULT NULL,
                                        interest_amt varchar(45) DEFAULT NULL,
                                        actual_estimated_amt varchar(45) DEFAULT NULL,
                                        discount_amt varchar(45) DEFAULT NULL,
                                        paid_amt varchar(45) DEFAULT NULL,
                                        handed_over_to_person varchar(100) DEFAULT NULL,
                                        payment_mode int(11) DEFAULT 1,
                                        remarks text,
                                        PRIMARY KEY (pledgebook_uid),
                                        KEY UniqueIdentifier_idx (pledgebook_uid),
                                        CONSTRAINT pledgebook_closed_bills_ibfk_REPLACE_USERID FOREIGN KEY (pledgebook_uid) REFERENCES pledgebook_REPLACE_USERID (UniqueIdentifier)
                                        ) ENGINE=InnoDB DEFAULT CHARSET=latin1`,
    STOCK_TABLE: `CREATE TABLE stock_REPLACE_USERID (
                    id int NOT NULL AUTO_INCREMENT,
                    uid varchar(45) NOT NULL,
                    date datetime DEFAULT CURRENT_TIMESTAMP,
                    user_id int DEFAULT NULL,
                    ornament int DEFAULT NULL,
                    pr_code varchar(45) DEFAULT NULL,
                    pr_number varchar(45) DEFAULT NULL,
                    huid varchar(200) DEFAULT NULL,
                    prod_id varchar(45) DEFAULT NULL,
                    touch_id int DEFAULT NULL,
                    i_touch varchar(45) DEFAULT NULL,
                    quantity int DEFAULT NULL,
                    gross_wt float DEFAULT NULL,
                    net_wt float DEFAULT NULL,
                    pure_wt float DEFAULT NULL,
                    labour_charge float DEFAULT '0',
                    labour_charge_unit varchar(45) DEFAULT 'FX',
                    calc_labour_amt float DEFAULT '0',
                    sales_wsg_percent float DEFAULT NULL,
                    sales_mc float DEFAULT NULL,
                    metal_rate float DEFAULT NULL,
                    amount float DEFAULT NULL,
                    cgst_percent float DEFAULT NULL,
                    cgst_amt float DEFAULT NULL,
                    sgst_percent float DEFAULT NULL,
                    sgst_amt float DEFAULT NULL,
                    igst_percent float DEFAULT NULL,
                    igst_amt float DEFAULT NULL,
                    total float DEFAULT NULL,
                    supplierId int DEFAULT NULL,
                    personName varchar(255) DEFAULT NULL,
                    avl_qty int DEFAULT NULL,
                    sold_qty int DEFAULT NULL,
                    sold_g_wt decimal(6,3) DEFAULT NULL,
                    sold_n_wt decimal(6,3) DEFAULT NULL,
                    sold_p_wt decimal(6,3) DEFAULT NULL,
                    invoice_ref varchar(45) DEFAULT NULL,
                    avl_g_wt decimal(6,3) DEFAULT NULL,
                    avl_n_wt decimal(6,3) DEFAULT NULL,
                    avl_p_wt decimal(6,3) DEFAULT NULL,
                    archived int DEFAULT 0,
                    created_date datetime DEFAULT CURRENT_TIMESTAMP,
                    modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uid_UNIQUE (uid),
                    UNIQUE KEY prod_id_UNIQUE (prod_id),
                    KEY touch_idx (touch_id),
                    KEY supplier_idx (supplierId),
                    KEY ornament_idx (ornament),
                    CONSTRAINT ornament_ibfk_REPLACE_USERID FOREIGN KEY (ornament) REFERENCES orn_list_jewellery (id),
                    CONSTRAINT supplier_ibfk_REPLACE_USERID FOREIGN KEY (supplierId) REFERENCES suppliers (id),
                    CONSTRAINT touch_ibfk_REPLACE_USERID FOREIGN KEY (touch_id) REFERENCES touch (id)
                )`,
    STOCK_SOLD_TABLE: `CREATE TABLE stock_sold_REPLACE_USERID (
                    id int NOT NULL AUTO_INCREMENT,
                    stock_tbl_uid VARCHAR(45) DEFAULT NULL,
                    date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    prod_id varchar(45) DEFAULT NULL,
                    huid varchar(45) DEFAULT NULL,
                    metal_rate int DEFAULT NULL,
                    retail_rate int DEFAULT NULL,
                    ornament int DEFAULT NULL,
                    qty int DEFAULT NULL,
                    gross_wt float DEFAULT NULL,
                    net_wt float DEFAULT NULL,
                    pure_wt float DEFAULT NULL,
                    wastage float DEFAULT NULL,
                    wastage_val float DEFAULT NULL,
                    labour float DEFAULT NULL,
                    cgst_percent float DEFAULT NULL,
                    cgst_amt float DEFAULT NULL,
                    sgst_percent float DEFAULT NULL,
                    sgst_amt float DEFAULT NULL,
                    discount float DEFAULT NULL,
                    total float DEFAULT NULL,
                    invoice_ref varchar(45) DEFAULT NULL,
                    is_returned int DEFAULT 0,
                    archived int DEFAULT 0,
                    created_date datetime DEFAULT CURRENT_TIMESTAMP,
                    modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY invoice_ref_idx (invoice_ref),
                    KEY prod_id_idx (prod_id)
                )`,
    OLD_ITEMS_STOCK: `CREATE TABLE old_items_stock_REPLACE_USERID (
                        id int NOT NULL AUTO_INCREMENT,
                        item_type varchar(45) DEFAULT NULL,
                        purchased_from_cust_id int NOT NULL,
                        gross_wt float DEFAULT NULL,
                        net_wt float DEFAULT NULL,
                        wastage_val float DEFAULT NULL,
                        applied_retail_rate float DEFAULT NULL,
                        daily_retail_rate float DEFAULT NULL,
                        price float DEFAULT NULL,
                        invoice_ref  varchar(45) DEFAULT NULL,
                        is_returned int DEFAULT 0,
                        archived int DEFAULT 0,
                        created_date datetime DEFAULT CURRENT_TIMESTAMP,
                        modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        KEY invoice_ref_idx (invoice_ref)
                    )`,
    INVOICE_DETAIL_NOTUSED: `CREATE TABLE jewellery_invoice_details_REPLACE_USERID (
                        id int NOT NULL AUTO_INCREMENT,
                        invoice_date datetime DEFAULT CURRENT_TIMESTAMP,
                        ukey varchar(45) DEFAULT NULL,
                        invoice_no varchar(45) DEFAULT NULL,
                        cust_id int DEFAULT NULL,
                        action varchar(45) DEFAULT NULL,
                        paid_amt float DEFAULT NULL,
                        balance_amt float DEFAULT NULL,
                        payment_mode varchar(45) DEFAULT NULL,
                        raw_payment_data text,
                        raw_data TEXT DEFAULT NULL,
                        invoice_data TEXT DEFAULT NULL,
                        archived int DEFAULT 0,
                        created_date datetime DEFAULT CURRENT_TIMESTAMP,
                        modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        UNIQUE KEY uid_UNIQUE (ukey),
                        KEY cust_id_idx (cust_id)
                    )`,
    JWL_INVOICES: `CREATE TABLE jewellery_invoices_REPLACE_USERID (
                    jewellery_invoice_tbl_id int NOT NULL AUTO_INCREMENT,
                    invoice_date datetime DEFAULT CURRENT_TIMESTAMP,
                    ukey varchar(45) DEFAULT NULL,
                    invoice_no varchar(45) NOT NULL,
                    cust_id int DEFAULT NULL,
                    item_metal_type varchar(45) DEFAULT NULL,
                    daily_retail_rate float DEFAULT NULL,
                    total_initial_price float DEFAULT NULL,
                    cgst_avg_percent float DEFAULT NULL,
                    total_cgst_val float DEFAULT NULL,
                    sgst_avg_percent float DEFAULT NULL,
                    total_sgst_val float DEFAULT NULL,
                    total_discount float DEFAULT NULL,
                    total_purchase_final_price float DEFAULT NULL,
                    total_exchange_final_price float DEFAULT NULL,
                    roundoff_val float DEFAULT NULL,
                    grand_total float DEFAULT NULL,
                    paid_amt float DEFAULT NULL,
                    balance_amt float DEFAULT NULL,
                    payment_mode varchar(45) DEFAULT NULL,
                    is_returned int DEFAULT '0',
                    return_charges_val FLOAT DEFAULT NULL,
                    returned_amt_val FLOAT DEFAULT NULL,
                    returned_date datetime DEFAULT NULL,
                    is_archived int DEFAULT '0',
                    created_date datetime DEFAULT CURRENT_TIMESTAMP,
                    modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (jewellery_invoice_tbl_id),
                    UNIQUE KEY uid_UNIQUE (ukey)
                    )`,
    JWL_INVOICE_ITEMS: `CREATE TABLE jewellery_invoice_items_REPLACE_USERID (
                            invoice_item_id int NOT NULL AUTO_INCREMENT,
                            invoice_ref varchar(45) NOT NULL,
                            stock_tbl_item_uid varchar(45) NOT NULL,
                            stock_tbl_prod_id varchar(45) DEFAULT NULL,
                            qty int NOT NULL,
                            gross_wt float NOT NULL,
                            net_wt float NOT NULL,
                            wastage_percent float DEFAULT NULL,
                            wastage_val float DEFAULT NULL,
                            making_charge float DEFAULT NULL,
                            initial_price float DEFAULT NULL,
                            discount float DEFAULT NULL,
                            cgst_percent float DEFAULT NULL,
                            cgst_val float DEFAULT NULL,
                            sgst_percent float DEFAULT NULL,
                            sgst_val float DEFAULT NULL,
                            final_price float DEFAULT NULL,
                            PRIMARY KEY (invoice_item_id)
                            )`,
    JWL_ESTIMATE_INVOICES: `CREATE TABLE jewellery_estimate_invoices_REPLACE_USERID (
                            jewellery_estimate_invoice_tbl_id int NOT NULL AUTO_INCREMENT,
                            invoice_date datetime DEFAULT CURRENT_TIMESTAMP,
                            ukey varchar(45) DEFAULT NULL,
                            invoice_no varchar(45) NOT NULL,
                            cust_id int DEFAULT NULL,
                            item_metal_type varchar(45) DEFAULT NULL,
                            daily_retail_rate float DEFAULT NULL,
                            total_initial_price float DEFAULT NULL,
                            cgst_avg_percent float DEFAULT NULL,
                            total_cgst_val float DEFAULT NULL,
                            sgst_avg_percent float DEFAULT NULL,
                            total_sgst_val float DEFAULT NULL,
                            total_discount float DEFAULT NULL,
                            total_purchase_final_price float DEFAULT NULL,
                            total_exchange_final_price float DEFAULT NULL,
                            roundoff_val float DEFAULT NULL,
                            grand_total float DEFAULT NULL,
                            is_archived int DEFAULT '0',
                            created_date datetime DEFAULT CURRENT_TIMESTAMP,
                            modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (jewellery_estimate_invoice_tbl_id),
                            UNIQUE KEY uid_UNIQUE (ukey)
                            ) `,
    JWL_ESTIMATE_INVOICE_ITEM: `CREATE TABLE jewellery_estimate_invoice_items_REPLACE_USERID (
                                    invoice_item_id int NOT NULL AUTO_INCREMENT,
                                    invoice_ref varchar(45) NOT NULL,
                                    stock_tbl_item_uid varchar(45) NOT NULL,
                                    stock_tbl_prod_id varchar(45) DEFAULT NULL,
                                    qty int NOT NULL,
                                    gross_wt float NOT NULL,
                                    net_wt float NOT NULL,
                                    wastage_percent float DEFAULT NULL,
                                    wastage_val float DEFAULT NULL,
                                    making_charge float DEFAULT NULL,
                                    initial_price float DEFAULT NULL,
                                    discount float DEFAULT NULL,
                                    cgst_percent float DEFAULT NULL,
                                    cgst_val float DEFAULT NULL,
                                    sgst_percent float DEFAULT NULL,
                                    sgst_val float DEFAULT NULL,
                                    final_price float DEFAULT NULL,
                                    PRIMARY KEY (invoice_item_id)
                                    )`,
    OLD_ITEMS_ESTIMATE: `CREATE TABLE old_items_estimates_REPLACE_USERID (
                            id int NOT NULL AUTO_INCREMENT,
                            item_type varchar(45) DEFAULT NULL,
                            cust_id int NOT NULL,
                            gross_wt float DEFAULT NULL,
                            net_wt float DEFAULT NULL,
                            wastage_val float DEFAULT NULL,
                            applied_retail_rate float NOT NULL,
                            daily_retail_rate float NOT NULL,
                            price float DEFAULT NULL,
                            invoice_ref varchar(45) DEFAULT NULL,
                            archived int DEFAULT '0',
                            created_date datetime DEFAULT CURRENT_TIMESTAMP,
                            modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (id)
                            )`,
    FUND_TRANS: `CREATE TABLE fund_transactions_REPLACE_USERID (
                    id int NOT NULL AUTO_INCREMENT,
                    user_id int NOT NULL,
                    customer_id int DEFAULT NULL,
                    account_id int DEFAULT NULL,
                    transaction_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    gs_uid varchar(45) DEFAULT NULL,
                    cash_in int NOT NULL DEFAULT '0',
                    cash_out int DEFAULT '0',
                    category_id int NOT NULL,
                    remarks text,
                    deleted tinyint DEFAULT '0',
                    created_date datetime DEFAULT CURRENT_TIMESTAMP,
                    modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                    cash_out_mode varchar(45) DEFAULT NULL,
                    cash_out_to_bank_acc_no varchar(45) DEFAULT NULL,
                    cash_out_to_bank_ifsc varchar(45) DEFAULT NULL,
                    cash_in_mode varchar(45) DEFAULT NULL,
                    alert int DEFAULT NULL,
                    is_internal int DEFAULT 0,
                    tag_indicator INT NULL,
                    PRIMARY KEY (id),
                    KEY category_id (category_id),
                    KEY gs_uid_idx (gs_uid)
                    )`,
    FUND_TRANS_TMP: `CREATE TABLE fund_trns_tmp_REPLACE_USERID (
                        id int NOT NULL,
                        transaction_date datetime NOT NULL,
                        user_id int NOT NULL,
                        account_id int NOT NULL,
                        gs_uid varchar(45) DEFAULT NULL,
                        category varchar(200) NOT NULL,
                        remarks text,
                        deleted int DEFAULT NULL,
                        cash_in decimal(10,0) DEFAULT NULL,
                        cash_out decimal(10,0) DEFAULT NULL,
                        created_date datetime DEFAULT NULL,
                        modified_date datetime DEFAULT NULL,
                        cash_out_mode varchar(45) DEFAULT NULL,
                        cash_out_to_bank_acc_no varchar(45) DEFAULT NULL,
                        cash_out_to_bank_ifsc varchar(45) DEFAULT NULL,
                        cash_in_mode varchar(45) DEFAULT NULL,
                        alert int DEFAULT NULL,
                        is_internal int DEFAULT 0,
                        beforeBal decimal(10,0) DEFAULT NULL,
                        afterBal decimal(10,0) DEFAULT NULL
                    )`,
    FUND_TRNS_PROCEDURE: `CREATE PROCEDURE fund_trns_procedure_REPLACE_USERID(IN Date1 varchar(100), IN Date2 varchar(100), IN UserId int(20))
            BEGIN
            
            
            DROP TABLE IF EXISTS fund_trns_tmp_REPLACE_USERID;
            
            CREATE TABLE fund_trns_tmp_REPLACE_USERID (
                id INT NOT NULL,
                transaction_date DATETIME NOT NULL,
                user_id INT NOT NULL,
                account_id INT NOT NULL,
                customer_id INT NULL,
                gs_uid VARCHAR(45) NULL,
                category_id VARCHAR(200) NOT NULL,
                remarks TEXT NULL,
                deleted INT NULL,
                cash_in DECIMAL NULL,
                cash_out DECIMAL NULL,
                created_date DATETIME NULL,
                modified_date DATETIME NULL,
                cash_out_mode VARCHAR(45) NULL,
                cash_out_to_bank_acc_no VARCHAR(45) NULL,
                cash_out_to_bank_ifsc VARCHAR(45) NULL,
                cash_in_mode VARCHAR(45) NULL,
                alert INT NULL,
                is_internal INT NULL,
                tag_indicator INT NULL,
                beforeBal DECIMAL NULL,
                afterBal DECIMAL NULL,
                grp_logic INT NULL
            );
            
            
            INSERT INTO fund_trns_tmp_REPLACE_USERID (id, transaction_date, user_id, account_id, customer_id, gs_uid, category_id, remarks, deleted, cash_in, cash_out, created_date, modified_date, cash_out_mode, cash_out_to_bank_acc_no, cash_out_to_bank_ifsc, cash_in_mode, alert, is_internal, tag_indicator)
            SELECT
                id,
                transaction_date,
                user_id,
                account_id,
                customer_id,
                gs_uid,
                category_id,
                remarks,
                deleted,
                cash_in,
                cash_out,
                created_date,
                modified_date,
                cash_out_mode,
                cash_out_to_bank_acc_no,
                cash_out_to_bank_ifsc,
                cash_in_mode,
                alert,
                is_internal,
                tag_indicator
            FROM
                fund_transactions_REPLACE_USERID
            WHERE
                deleted = 0
                AND(transaction_date BETWEEN Date1
                    AND Date2)
            ORDER BY
                transaction_date ASC;
            
            
            SET @bal = (
            SELECT
                IFNULL(SUM(cash_in - cash_out), 0) AS openingBalByPage
                FROM
                    fund_transactions_REPLACE_USERID
                WHERE
                    deleted = 0
                    AND transaction_date < Date1);
            
            UPDATE
                fund_trns_tmp_REPLACE_USERID
            SET
                beforeBal = @bal,
                afterBal = (@bal:=@bal + (fund_trns_tmp_REPLACE_USERID.cash_in - fund_trns_tmp_REPLACE_USERID.cash_out));
            
            END`,
    NEW_FUND_ACCOUNT: `INSERT INTO fund_accounts (user_id, name, is_default) VALUES (?,?,?)`,
    UDHAAR: `CREATE TABLE udhaar_REPLACE_USERID (
                id int NOT NULL AUTO_INCREMENT,
                unique_identifier varchar(45) DEFAULT NULL,
                bill_no varchar(45) DEFAULT NULL,
                amount int DEFAULT NULL,
                date datetime NOT NULL,
                account_id int NOT NULL,
                customer_id int NOT NULL,
                notes text,
                interest_pct float DEFAULT NULL,
                interest_val float DEFAULT NULL,
                landed_cost float DEFAULT NULL,
                status int NULL DEFAULT 1,
                trashed int DEFAULT NULL,
                created_date datetime DEFAULT CURRENT_TIMESTAMP,
                modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_identifier_UNIQUE (unique_identifier),
                UNIQUE KEY bill_no_UNIQUE (bill_no)
              )`,
    UDHAAR_CLOSED_LIST: `CREATE TABLE udhaar_closed_bills_REPLACE_USERID (
            id INT NOT NULL AUTO_INCREMENT,
            uid BIGINT NULL,
            udhaar_tbl_uid BIGINT NULL,
            principal_amt FLOAT NULL,
            closing_amt FLOAT NULL,
            interest_amt FLOAT NULL,
            created_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
            modified_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id))`,
    NOTES: `CREATE TABLE notes_REPLACE_USERID (
        Id int NOT NULL AUTO_INCREMENT,
        CustomerId int NOT NULL,
        CustomerHashKey varchar(45) DEFAULT NULL,
        Notes text,
        Archived tinyint DEFAULT '0',
        CreatedDate datetime DEFAULT CURRENT_TIMESTAMP,
        ModifiedDate datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (Id)
      )`,
    TRIGGER_1: `CREATE TRIGGER analytics_pledgebook_REPLACE_USERID
                AFTER INSERT ON pledgebook_REPLACE_USERID
                FOR EACH ROW
                BEGIN
                    INSERT INTO analytics_pledgebook
                    SET unique_identifier = New.UniqueIdentifier,
                        user_id=REPLACE_USERID,
                        bill_no = New.BillNo,
                        bill_date = New.CreatedDate,
                        action = 'NEW_BILL',
                        cust_id = New.CustomerId,
                        amount = NEW.Amount;
                    INSERT INTO analytics_module_used
                    SET module = 'BILL_CREATION';
                END;`,
    TRIGGER_2: `CREATE TRIGGER analytics_pledgebook_closed_REPLACE_USERID
                AFTER INSERT ON pledgebook_closed_bills_REPLACE_USERID
                FOR EACH ROW
                BEGIN
                    INSERT INTO analytics_pledgebook
                    SET unique_identifier = New.uid,
                        user_id=REPLACE_USERID,
                        bill_no = New.bill_no,
                        bill_date = New.closed_date,
                        action = 'REDEEM_BILL',
                        amount = NEW.paid_amt;
                    INSERT INTO analytics_module_used
                    SET module = 'BILL_REDEEM';
                END;`,
    TRIGGER_3: `CREATE TRIGGER analytics_customer_insert_REPLACE_USERID
                AFTER INSERT ON customer_REPLACE_USERID
                FOR EACH ROW
                BEGIN
                    INSERT INTO analytics_module_used
                    SET module = 'CUSTOMER_INSERT',
                    user_id=REPLACE_USERID;
                END;`,
    TRIGGER_4: `CREATE TRIGGER analytics_customer_update_REPLACE_USERID
                AFTER UPDATE ON customer_REPLACE_USERID
                FOR EACH ROW
                BEGIN
                    INSERT INTO analytics_module_used
                    SET module = 'CUSTOMER_UPDATE',
                    user_id=REPLACE_USERID;
                END;`,
    STORE_LOCATION: `INSERT INTO analytics_locations (latitude, longitude, user_id) VALUES (?,?,?)`,
    LOGIN_NOTIFIER: `INSERT INTO analytics_app_login (wmic, user_id, logged_in, logged_out)`,
    SYNC_ANALYTICS_APP_USAGE: `INSERT INTO synced_analytics_app_usage (id, session_uid, wmic, is_safe, server_action, created_date, modified_date, mycreated_date, mymodified_date) VALUES (?,?,?,?,?,?,?,?,?)`,
    SYNC_ANALYTICS_APP_LOGIN: `INSERT INTO synced_analytics_app_login (id, user_id, wmic, action, resp, other, created_date, modified_date, mycreated_date, mymodified_date) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    SYNC_ANALYTICS_PLEDGEBOOK: `INSERT INTO synced_analytics_pledgebook (id, user_id, unique_identifier, bill_no, bill_date, cust_id, amount, action, created_date, modified_date, mycreated_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    SYNC_ANALYTICS_MODULES_USAGE: `INSERT INTO synced_analytics_module_used (id, user_id, module, ctx1, ctx2, ctx3, created_date, modified_date, mycreated_date) VALUES (?,?,?,?,?,?,?,?,?)`,
}
