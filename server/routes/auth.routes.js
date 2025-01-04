import express from 'express';
import { isTokenPresent } from '../middlewares/auth.middleware';
import { loginUser } from '../controllers/auth.controller';
var router = express.Router();

router.post('/login', loginUser);

export default router;
