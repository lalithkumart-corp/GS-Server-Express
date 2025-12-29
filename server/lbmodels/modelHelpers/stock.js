class StockHelper {
    constructor() {

    }
    sanitizeStockInsertParams(params) {
        if(!params.productSalesWsgPercent || params.productSalesWsgPercent == '')
            params.productSalesWsgPercent = null;
        if(!params.productSalesMakingCharge || params.productSalesMakingCharge == '')
            params.productSalesMakingCharge = null;
        return params;
    }
}

module.exports = StockHelper;
