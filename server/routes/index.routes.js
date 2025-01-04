import express from 'express';
import { appConfig, envConfig } from '../config/index.js';
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(envConfig.test);
  console.log(appConfig.test2);
  res.json({ title: 'Express' });
});

export default router;
