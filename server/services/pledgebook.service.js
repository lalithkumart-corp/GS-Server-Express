'use strict';
const ANALYTICS = {
    TOP_CUSTOMERS_LIMIT: 2
}
const PAYMENT_MODE = {
    'cash': 1,
    'cheque': 2,
    'online': 3
}

class PledgebookService {
    constructor(db) {
        this.db = db;
    }
    dataSource = {
        connector: {
            query: (sql, params, ) => {
                return this.db.query(sql, params);
            }
        }
    };

    insertNewBillAPIHandler = async (apiParams) => {
        console.log(apiParams);
    }

    updateBillAPIHandler = async (apiParams) => {
        
    }

    getPendingBillsAPIHandler = async (accessToken, apiParams) => {
        console.log('-------------');
        console.log(apiParams);
        console.log(typeof apiParams);
        return true;
    }

    billRenewalApiHandler = async (apiParams) => {
        
    }

    redeemPendingBillsApiHandler = async (apiParams) => {
        
    }
    
    reOpenClosedBillsAPIHandler = async (apiParams) => {
        
    }
    
    getPendingBillNosAPIHandler = async (apiParams) => {
        
    }

    getBillDetailsAPIHandler = async (apiParams) => {
        
    }

    fetchUserHistoryAPIHandler = async (apiParams) => {
        
    }

    archiveBillsAPIHandler = async (apiParams) => {
        
    }

    unArchiveBillsApiHandler = async (apiParams) => {
        
    }

    trashBillsApiHandler = async (apiParams) => {
        
    }

    restoreTrashedBillsApiHandler = async (apiParams) => {
        
    }

    deleteBillApiHandler = async (apiParams) => {
        
    }

    fetchAnalyticsData = async (apiParams) => {
        
    }

    fetchAnalyticsDataByCustomerWise = async (apiParams) => {
        
    }
};

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


export default PledgebookService;
