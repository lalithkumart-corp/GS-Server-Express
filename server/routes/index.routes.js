import express from 'express';
import { appConfig, envConfig } from '../config/index.js';
import pledgebookRouter from './pledgebook.routes.js';
import pledgebookRouterLb from '../lbmodels/pledgebook.js';
import customerRouterLb from '../lbmodels/customer.js';
import userRouter from './user.routes.js';
import authRouter from './auth.routes.js';
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(envConfig.test);
  console.log(appConfig.test2);
  res.json({ title: 'Express' });
});

// router.use('/api/pledgebook', pledgebookRouter);
router.use('/api/pledgebook', pledgebookRouterLb);
router.use('/api/Customer', customerRouterLb);
router.use('/user', userRouter);
router.use('/auth', authRouter);
export default router;
