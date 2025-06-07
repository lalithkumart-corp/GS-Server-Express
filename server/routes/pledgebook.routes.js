import express from 'express';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';
var router = express.Router();

router.get('/loan-bills', [verifyToken, verifyRole(['admin', 'pledgebook.admin', 'pledgebook.viewer'])], async (req, res, next) => {
    res.send(+Date.now() + 'respond with a resource');
});

export default router;