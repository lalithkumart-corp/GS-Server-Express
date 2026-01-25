import express from 'express';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/test1', [verifyToken], async (req, res) => {
    res.status(200).json({
        status: 'success',
    });
});


export default router;