import express from 'express';
import db from '../db/index.js';
import { signup } from '../controllers/user.controller.js';
import { checkDuplicateUsernameOrEmail, checkRolesExisted } from '../middlewares/user.middleware.js';
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/test', async (req, res, next) => {
  let dbres = await db.query('select * from user');
  console.log(dbres);
  res.send(+Date.now() + 'respond with a resource');
});


router.post('/signup', [checkDuplicateUsernameOrEmail, checkRolesExisted], signup);

export default router;
