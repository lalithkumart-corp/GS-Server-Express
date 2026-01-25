import express from 'express';
import { generateHash } from '../components/bcrypt';

const router = express.Router();

// Public routes
router.post('/generateHash', async (req, res) => {
    let hash = await generateHash(req.body.password);
    res.json({
        password: req.body.password,
        hash: hash
    });
});;


export default router;
