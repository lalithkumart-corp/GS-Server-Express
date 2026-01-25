'use strict';
let readXlsxFile = require('read-excel-file/node');
let appRootPath = require('app-root-path');
let _ = require('lodash');
let axios = require('axios');
let moment = require('moment');

let filePath = `${appRootPath}/kingtech3.xlsx`; 
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
                    landedCost: landedCost,
                    createdDate: date,
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

const invokeApi = async (payload) => {
    try {
        let url = 'http://localhost:3003/api/Pledgebooks/add-new-billrecord';
        await axios.post(url, payload);
    } catch(e) {
        console.log(payload);
        console.log(e);
    }
}

// EXPECTED: 2015-01-03 00:1:00
const getDateVal = (dat) => {
    if(typeof dat === 'string') {
        let splits = dat.split('/')
        let formattedDate = moment(new Date(`${splits[2]}/${splits[1]}/${splits[0]}`)).format('YYYY-MM-DD HH:M:SS');
        return formattedDate;
    } else {
        let correctDat = getCorrectdateFromRealNumber(dat);
        let splits = correctDat.split('/')
        //var date = new Date(1899, 12, dat );
        //let formattedDate = moment(date).format('YYYY-MM-DD HH:M:SS');
        let formattedDate = moment(new Date(`${splits[2]}/${splits[1]}/${splits[0]}`)).format('YYYY-MM-DD HH:M:SS');
        return formattedDate;
    }
}

const getCorrectdateFromRealNumber = (num) => {
    var utc_value = Math.floor(num- 25569) * 86400;
    var date_info = new Date(utc_value * 1000);
    var month = parseInt(date_info.getMonth()) + 1;
    return date_info.getFullYear()+ "/" + month + "/" + date_info.getDate();
}

const getBillSeries = (billNoStr) => {
    try {
        let val = '';
        if(billNoStr) {
            val = billNoStr.substr(0,1);
        } else {
            console.log('Bill number is not found');
        }
        return val;
    } catch (e) {
        console.log(e);
    }
}

const getBillNo = (billNoStr) => {
    try {
        let val = '';
        if(billNoStr)
            val = billNoStr.substr(1, billNoStr.length)
        else
            console.log('Bill series not found');
        return val;
    } catch(e) {
        console.log(e);
    }
}

const trimIt = (noisyStr) => {
    if(noisyStr) {
        try {
            let lastChar = noisyStr.substr(noisyStr.length-1);
            if(lastChar == ',')
                noisyStr = noisyStr.substr(0, noisyStr.lastIndexOf(','));
            else if(lastChar == '.')
                noisyStr = noisyStr.substr(0, noisyStr.lastIndexOf('.'));
            return noisyStr;
        } catch(e) {
            console.log(e);
            return noisyStr;
        } 
    } else {
        return noisyStr;
    }
}

const getOrnObj = (ornStr, wt) => {
    let orn = {
        1: {
            ornItem: "EMPTY",
            ornGWt: 0,
            ornNWt: 0,
            ornSpec: "",
            ornNos: 0
        }
    };
    try {
        if(ornStr) {
            let splits = ornStr.split('-');
            if(splits.length == 2) {
                orn["1"] = {
                    ornItem: splits[0],
                    ornGWt: wt,
                    ornNWt: wt,
                    ornSpec: "",
                    ornNos: splits[1]
                }
            }
        }
        return orn;
    } catch(e) {
        console.log(e);
        return orn;
    }
}

const getOrnCategory = (orn) => {
    let categ = 'U';
    if(orn && orn["1"] && orn["1"].ornItem) {
        if(orn["1"].ornItem.indexOf('G ') == 0)
            categ = 'G';
        else if(orn["1"].ornItem.indexOf('S ') == 0)
            categ = 'S';
    }
    return categ;
}

const getTotalWt = (orn) => {
    let wt = 0;
    _.each(orn, (item, index) => {
        wt += item.ornNWt;
    });
    return wt;
}

const getInterestPercent = (amt) => {
    let percent = 2;
    if(amt && amt < 9999)
        percent = 3;
    return percent;
}

const getInterestValue = (amt, percent) => {
    let intVal = 0;
    if(amt)
        intVal = (amt * percent )/100;
    return intVal;
}

const getLandedCost = (amt, intVal) => {
    let landedCost = amt;
    if(amt && intVal)
        landedCost = amt - intVal;
    return landedCost;
}
