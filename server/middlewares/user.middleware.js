import db from '../db/index.js';

export const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    let dbResp = await db.query('SELECT * FROM user where user_name=? OR email=?', [req.body.username, req.body.useremail]);
    if(dbResp.length > 0) {
        res.status(400).send({
            message: "Failed! UserName or Email is already in use!"
        });
        return;
    }
    next();
};

export const checkRolesExisted = (req, res, next) => {
    next();
};
