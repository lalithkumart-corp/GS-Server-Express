import express from 'express';
import { appConfig, envConfig } from '../config/index.js';
import pledgebookRouter from './pledgebook.routes.js';
import userRouter from './user.routes.js';
import authRouter from './auth.routes.js';
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(envConfig.test);
  console.log(appConfig.test2);
  res.json({ title: 'Express' });
});

router.use('/pledgebook', pledgebookRouter);
router.use('/user', userRouter);
router.use('/auth', authRouter);
export default router;
