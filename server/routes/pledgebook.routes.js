import express from 'express';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';
import PledgebookService from '../services/pledgebook.service';
import db from '../db';

const router = express.Router();

router.post('/add-new-billrecord', [verifyToken], async (req, res) => {
    new PledgebookService(db).insertNewBillAPIHandler(req.body.apiParams);
    res.status(200).json({
        status: 'success',
    });
});

router.post('/update-billrecord', [verifyToken], async (req, res) => {
    new PledgebookService(db).updateBillAPIHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.get('/get-pending-bills', [verifyToken], async (req, res) => {
    new PledgebookService(db).getPendingBillsAPIHandler(req.query.access_token, JSON.parse(req.query.params));
    res.status(200).json({
        status: 'success',
    });
});

router.post('/renew-loan-bill', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    new PledgebookService(db).billRenewalApiHandler(accessToken, req.body.payload);
    res.status(200).json({
        status: 'success',
    });
});

router.post('/redeem-pending-bills', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    req.body.data.accessToken = accessToken;
    new PledgebookService(db).redeemPendingBillsApiHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.post('/re-open-closed-bills', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    req.body.data.accessToken = accessToken;
    new PledgebookService(db).reOpenClosedBillsAPIHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.get('/get-pending-bill-nos', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.query.access_token)
        accessToken = req.query.access_token;
    new PledgebookService(db).getPendingBillNosAPIHandler(accessToken);
    res.status(200).json({
        status: 'success',
    });
});

router.get('/get-bill-details', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.query.access_token)
        accessToken = req.query.access_token;

    let billNoWithUuid = req && req.query.bill_no_with_uuid;
    billNoWithUuid = JSON.parse(billNoWithUuid);

    let fetchOnlyPending = req && req.query.fetch_only_pending;
    if(typeof fetchOnlyPending == 'undefined')
        fetchOnlyPending = false;

    let fetchFundTrns = req && req.query.fetch_fund_trns;
    if(typeof fetchFundTrns == 'undefined')
        fetchFundTrns = false;

    new PledgebookService(db).getBillDetailsAPIHandler(accessToken, billNoWithUuid, fetchOnlyPending, fetchFundTrns);
    res.status(200).json({
        status: 'success',
    });
});

router.get('/fetch-customer-history', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.query.access_token)
        accessToken = req.query.access_token;

    let customerId = req && req.query.customer_id;

    let include_only = 'all';
    if(req.query && req.query.include_only)
        include_only = req.query.include_only;

    let filters = req && req.query.filters;
    filters = filters ? JSON.parse(filters) : {};

    new PledgebookService(db).fetchUserHistoryAPIHandler(accessToken, customerId, include_only, filters);
    res.status(200).json({
        status: 'success',
    });
});

router.put('/archive-bills', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    req.body.data.accessToken = accessToken;
    new PledgebookService(db).archiveBillsAPIHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.put('/un-archive-bills', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    req.body.data.accessToken = accessToken;
    new PledgebookService(db).unArchiveBillsApiHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.put('/un-archive-bills', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    req.body.data.accessToken = accessToken;
    new PledgebookService(db).unArchiveBillsApiHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.put('/trash-bills', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    req.body.data.accessToken = accessToken;
    new PledgebookService(db).trashBillsApiHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.put('/restore-trashed-bills', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    req.body.data.accessToken = accessToken;
    new PledgebookService(db).restoreTrashedBillsApiHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.delete('/delete-bills', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    req.body.data.accessToken = accessToken;
    new PledgebookService(db).deleteBillApiHandler(req.body.data);
    res.status(200).json({
        status: 'success',
    });
});

router.get('/analytics-data', [verifyToken], async (req, res) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    
    let groupBy = req && req.query.groupBy;

    let visualizationKey = req && req.query.visualization_key;

    let topCustomerMetric = req && req.query.top_customer_metric;

    let startDate = req && req.query.start_date;

    let endDate = req && req.query.end_date;

    new PledgebookService(db).fetchAnalyticsData(accessToken, groupBy, visualizationKey, topCustomerMetric, startDate, endDate);
    res.status(200).json({
        status: 'success',
    });
});

router.get('/analytics-data/group-by-customer', [verifyToken], async (req, res ) => {
    let accessToken;
    if(req && req.headers.authorization)
        accessToken = req.headers.authorization;
    
    let topCustomerMetric = req && req.query.top_customer_metric;

    let billStatus = req && req.query.bill_status;

    let limit = req && req.query.limit;

    let offset = req && req.query.offset;

    let startDate = req && req.query.start_date;

    let endDate = req && req.query.end_date;

    new PledgebookService(db).fetchAnalyticsDataByCustomerWise(accessToken, topCustomerMetric, billStatus, startDate, endDate, limit, offset);
    res.status(200).json({
        status: 'success',
    });
});

export default router;