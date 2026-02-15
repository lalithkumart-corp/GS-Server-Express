import express from 'express';
import { generateHash } from '../components/bcrypt';
import { decrypt, encrypt, getStoreOwnerUserId } from '../utils/commonUtils';

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

/*
router.get('/generate-key', (req, res) => {
    let rr = new Date();
    let password = app.get('csProductUUID') + app.get('encpwd') + rr.getFullYear()+rr.getMonth()+rr.getHours();
    // let csProductUUID = '98F03E8C-2A47-11EC-810D-7C8AE1A7A26F';
    // let encPwd = 'A(*&nlk)[._';
    // let period = rr.getFullYear()+rr.getMonth()+rr.getHours();
    // let password = csProductUUID + encPwd + period;
    let encted = encrypt(JSON.stringify({expiryDate: '2026-12-18 00:00:00'}), password);
    console.log(password)
    console.log(encted);


    let decrypted = decrypt(encted, password);
    console.log(decrypted);
});
*/

export default router;
