import express from 'express';
import { generateHash } from '../components/bcrypt';
import { decrypt, encrypt, getStoreOwnerUserId, isAdminUser } from '../utils/commonUtils';
import DbBackup from '../jobs/database-backup-job';

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

router.get('/backup-db', async (req, res) => {
    try {
        let isAdmin = await isAdminUser(req.query.access_token);
        if(!isAdmin) {
            res.status(401).json({status: "Error", MSG: "Unauthorized access"});
            res.end();
            return;
        }
        new DbBackup().start();
        res.status(200).json({status: 'SUCCESS', MSG: "DB backup started successfully."});
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
    // let password = app.get('csProductUUID') + app.get('encpwd') + rr.getFullYear()+rr.getMonth()+rr.getHours();
    let csProductUUID = '4C4C4544-0059-4210-8030-B4C04F474432';
    let encPwd = 'A(*&nlk)[._';
    let period = rr.getFullYear()+rr.getMonth()+rr.getHours();
    let password = csProductUUID + encPwd + period;
    let encted = encrypt(JSON.stringify({expiryDate: '2027-01-07 00:00:00'}), password);
    console.log('password:', password);
    console.log('encrypted:', encted);

    let decrypted = decrypt(encted, password);
    console.log(decrypted);
});
*/
export default router;
