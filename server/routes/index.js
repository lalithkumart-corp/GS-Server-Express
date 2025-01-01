import express from 'express';
import { appConfig } from '../config/config';
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(appConfig.test);
  console.log(appConfig.test2);
  res.json({ title: 'Express' });
});

export default router;
