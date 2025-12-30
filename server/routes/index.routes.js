import express from 'express';
import { appConfig, envConfig } from '../config/index.js';
import pledgebookRouter from './pledgebook.routes.js';
import pledgebookRouterLb from '../lbmodels/pledgebook.js';
import customerRouterLb from '../lbmodels/customer.js';
import userRouter from './user.routes.js';
import authRouter from './auth.routes.js';
import GsuserRouterLb from '../lbmodels/gs-user.js';

import customerAttachmentRouterLb from '../lbmodels/customer-attachment.js';
import fundTransactionRouterLb from '../lbmodels/fund-transaction.js';
import jwlBillSettingsRouterLb from '../lbmodels/jewellery-bill-settings.js';
import jwlTagSettingsRouterLb from '../lbmodels/jewellery-tag-settings.js';
import loanBillTemplateRouterLb from '../lbmodels/loan-bill-template.js';
import AppManagerRouterLb from '../lbmodels/app-manager.js';
import UserPreferenceRouterLb from '../lbmodels/user-preferences.js';
import alertRouterLb from '../lbmodels/alert.js';
import pledgebookSettingsRouterLb from '../lbmodels/pledgebook-settings.js';
import interestRouterLb from '../lbmodels/interest.js';
import imageRouterLb from '../lbmodels/image.js';
import notesRouterLb from '../lbmodels/note.js';
import ornamentsRouterLb from '../lbmodels/ornaments.js';
import commonRouterLb from '../lbmodels/common.js';
import jewelleryOrnamentsRouterLb from '../lbmodels/jewellery-ornament.js';
import stocksRouterLb from '../lbmodels/stock.js'
import jewelleryInvoices from '../lbmodels/jewellery-invoice.js';
import touchRouterLb from '../lbmodels/touch.js';
import storeRouterLb from '../lbmodels/store.js';
import jewelleryEstimateInvoicesRouterLb from '../lbmodels/jewellery-estimate-invoice.js';
import udhaarRouterLb from '../lbmodels/udhaar.js';
import udhaarSettingsRouterLb from '../lbmodels/udhaar-settings.js';
import analyticsRouterLb from '../lbmodels/analytics.js';
import fundAccountsRouterLb from '../lbmodels/fund-accounts.js';

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(envConfig.test);
  console.log(appConfig.test2);
  res.json({ title: 'Express' });
});

// router.use('/api/pledgebook', pledgebookRouter);
router.use('/api/Pledgebooks', pledgebookRouterLb);
router.use('/api/Customers', customerRouterLb);
router.use('/api/GsUsers', GsuserRouterLb);
router.use('/api/AppManagers', AppManagerRouterLb);
router.use('/api/UserPreferences', UserPreferenceRouterLb);
router.use('/api/LoanBillTemplates', loanBillTemplateRouterLb);
router.use('/api/JewelleryTagSettings', jwlTagSettingsRouterLb);
router.use('/api/JewelleryBillSettings', jwlBillSettingsRouterLb);
router.use('/api/FundTransactions', fundTransactionRouterLb);
router.use('/api/FundAccounts', fundAccountsRouterLb);
router.use('/api/CustomerAttachments', customerAttachmentRouterLb);
router.use('/api/Alerts', alertRouterLb);
router.use('/api/PledgebookSettings', pledgebookSettingsRouterLb);
router.use('/api/Interests', interestRouterLb);
router.use('/api/Images', imageRouterLb);
router.use('/api/Notes', notesRouterLb);
router.use('/api/Ornaments', ornamentsRouterLb);
router.use('/api/Commons', commonRouterLb);
router.use('/api/JewellryOrnaments', jewelleryOrnamentsRouterLb);
router.use('/api/Stocks', stocksRouterLb);
router.use('/api/JewelleryInvoices', jewelleryInvoices);
router.use('/api/Touches', touchRouterLb);
router.use('/api/Stores', storeRouterLb);
router.use('/api/JewelleryEstimateInvoices', jewelleryEstimateInvoicesRouterLb);
router.use('/api/Udhaars', udhaarRouterLb);
router.use('/api/UdhaarSettings', udhaarSettingsRouterLb);
router.use('/api/Analytics', analyticsRouterLb);

router.use('/user', userRouter);
router.use('/auth', authRouter);
export default router;
