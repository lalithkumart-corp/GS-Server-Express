import { generateHash } from '../components/bcrypt.js';
import db from '../db/index.js';

export const signup = async (req, res, next) => {
    try {
        const paswordHash = await generateHash(req.body.password);
        let dbRes = await db.query(SQL.USER_INSERT, [req.body.username, req.body.useremail, paswordHash, req.body.password, req.body.phone]);
        res.send(200);
    } catch(e) {
        console.log(e);
        res.send(500);
    }
}

const SQL = {
    USER_INSERT: `INSERT INTO user (user_name, user_email, password, password_plain, phone) VALUES (?,?,?,?,?)`
}
