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
router.use('/api/CustomerAttachments', customerAttachmentRouterLb);
router.use('/user', userRouter);
router.use('/auth', authRouter);
export default router;
