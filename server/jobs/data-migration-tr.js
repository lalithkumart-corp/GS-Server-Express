'use strict';
let readXlsxFile = require('read-excel-file/node');
let appRootPath = require('app-root-path');
let _ = require('lodash');
let axios = require('axios');
let moment = require('moment');

let filePath = `${appRootPath}/tr.xlsx`; 
readXlsxFile(filePath).then(async (rows) => {
    await processRecords(rows);
});

const processRecords = async (rows) => {
    for(let i=0; i<rows.length; i++) {
            let aRow = rows[i];
            let date = getDateVal(aRow[1]);
            let billSeries = getBillSeries(aRow[2]);
            let billNo = getBillNo(aRow[2]);
            let orn = getOrnObj(aRow[8], aRow[9]);
            let categ = getOrnCategory(orn);
            let totWt = getTotalWt(orn);
            let interestPercent = getInterestPercent(aRow[10]);
            let interestValue = getInterestValue(aRow[10], interestPercent);
            let landedCost = getLandedCost(aRow[10], interestValue);
            let apiReq = {
                accessToken: 'f1Om514RYKPaSQCHvehKubteMrjpd3RAm9PGKRGEkOGEaC5IxicmwmDSPt3bniOx',
                requestParams: {
                    date: date,
                    billSeries: billSeries,
                    billNo: billNo,
                    amount: aRow[10],
                    cname: trimIt(aRow[3]),
                    gaurdianName: trimIt(aRow[4]),
                    address: trimIt(aRow[5]),
                    place: trimIt(aRow[6]),
                    city: aRow[7],
                    pinCode: 600056,
                    mobile: '',
                    orn: orn,
                    billRemarks: "",
                    moreDetails: [],
                    userPicture: {},
                    ornPicture: {},
                    ornCategory: categ,
                    totalWeight: totWt,
                    interestPercent: interestPercent,
                    interestValue: interestValue,
                    otherCharges: 0,
                    landedCost: landedCost
                }
            }
            try {
                await invokeApi(apiReq);
                console.log('ITERATION SUCCESS', i);
            } catch(e) {
                console.log('------ITERATION ERROR------', i);
            }
    }
}