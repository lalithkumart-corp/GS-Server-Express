import express from 'express';
import { generateHash } from '../components/bcrypt';
import { getStoreOwnerUserId } from '../utils/commonUtils';

const router = express.Router();

// Public routes
router.post('/generateHash', async (req, res) => {
    let hash = await generateHash(req.body.password);
    res.json({
        password: req.body.password,
        hash: hash
    });
});

router.get('/user-id-by-token', async (req, res) => {
    try {
        let userId = await getStoreOwnerUserId(req.query.access_token);
        res.status(200).json({status: 'SUCCESS', userId});
        res.end();
    } catch(e) {
        // logger.error(GsErrorCtrl.create({className: 'Routes', methodName: 'user-id-by-token', cause: e, message: 'Exception in api /user-id-by-token'}));
        res.status(500).json({status: "Error", MSG: e.message});
        res.end();
    }
});


export default router;
