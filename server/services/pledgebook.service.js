'use strict';
import { appConfig } from '../config/index.js';
import db from '../db/index.js';

class PledgebookService {
    async getPledgebookTableName(userId) {
        let tableName = appConfig.get('pledgebookTableName')+ '_' + userId;
        return tableName;
    }

    async getPledgebookClosedTableName(userId) {
        let tableName = appConfig.get('pledgebookClosedBillListTableName')+ '_' + userId;
        return tableName;
    }

    _getPendingBillsList(custId, userId) {
        return new Promise( async (resolve, reject) => {
            let pledgebookTableName = await this.getPledgebookTableName(userId);
            let sql = `SELECT * FROM ${pledgebookTableName} WHERE CustomerId=${custId} AND Status=1`;
            db.query(sql, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }

            });
        });
    }
}

export default PledgebookService;
