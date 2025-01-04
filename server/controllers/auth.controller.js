import { generateHash, validatePassword } from "../components/bcrypt.js";
import { generateToken } from "../components/jwt.js";
import db from "../db";

export const loginUser = async (req, res, next) => {
    let dbRes = await db.query(SQL.FIND_USER, [req.body.useremail]);
    let token;
    if(dbRes.length > 0) {
        let userRow = dbRes[0];
        if(validatePassword(req.body.password, userRow.password)) {
            token = generateToken({id: userRow.id, userName: userRow.user_name, userEmail: userRow.user_email});
            res.send(200, {token, userId: userRow.id});
        } else {
            res.send(401, 'Password did not match');
        }
        
    } else {
        res.send(500, 'Email did not match');
    }
};

const SQL = {
    FIND_USER: 'SELECT * FROM user where user_email=?'
}