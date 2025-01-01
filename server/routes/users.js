import express from 'express';
import db from '../db/index';
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/test', async (req, res, next) => {
  let dbres = await db.query('select * from user_preferences');
  console.log(dbres);
  res.send(+Date.now() + 'respond with a resource');});

export default router;
