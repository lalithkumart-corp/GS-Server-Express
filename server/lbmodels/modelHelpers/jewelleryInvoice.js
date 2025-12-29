/* eslint-disable camelcase */
/* eslint-disable indent */
/* eslint-disable strict */
let _ = require('lodash');
const { safeParseJson } = require('../../utils/commonUtils');

class JewelleryInvoiceHelper {
    constructor() {

    }
    dbRespToApiRespKeyMapper(dbResp, identifier) {
        let apiResp = null;
        switch (identifier) {
            case 'invoice_list':
                apiResp = this.invoiceListMapper(dbResp);
                break;
        }
        return apiResp;
    }
    invoiceListMapper(dbResp) {
        let arr  = [];
        _.each(dbResp, (aRow, index) => {
            arr.push({
                invoiceRef: aRow.ukey,
                invoiceNo: aRow.invoice_no,
                itemMetalType: aRow.item_metal_type,
                custId: aRow.cust_id,
                paidAmt: aRow.paid_amt,
                balanceAmt: aRow.balance_amt,
                paymentMode: aRow.payment_mode,
                invoiceDate: aRow.invoice_date,
                isReturned: aRow.is_returned,
                returnedAmount: aRow.returned_amt_val,
                returnDate: aRow.returned_date,
                returnChargesVal: aRow.return_charges_val,
                createdDate: aRow.created_date,
                modifiedDate: aRow.modified_date,
                prodIds: aRow.prod_ids,
                huids: aRow.huids,
                customerName: aRow.Name,
                customerGaurdianName: aRow.GaurdianName,
                customerMobile: aRow.Mobile,
                customerAddr: aRow.Address,
            });
        });
        return arr;
    }
    getCustomerPan(custOtherDetailsDbCol) {
        let customerPanNo = null;
        let formattedArr = null;
        if(custOtherDetailsDbCol !== "") {
            formattedArr = safeParseJson(custOtherDetailsDbCol);
        }
        if(formattedArr) {
            let filteredArr = formattedArr.filter((a) => a.field === 'Pan Card')
            if(filteredArr[0])
                customerPanNo = filteredArr[0].val;

            // Optional Chaining(?.) is not supported with "pkg" bundler
            // Ex: This piece of code ----> filteredArr[0]?.val;   ---> throw error, as like file as file wont get compiled properly
            // Hence above, i used simple if condition
        }
        return customerPanNo;
    }
}

module.exports = JewelleryInvoiceHelper;
