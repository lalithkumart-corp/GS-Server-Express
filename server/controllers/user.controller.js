import UserService from '../services/user.service.js';

export const signup = async (req, res, next) => {
    try {
        await new UserService().signup(req.body);
        res.send(200);
    } catch(e) {
        console.log(e);
        res.send(500);
    }
}

const SQL = {
    USER_INSERT_V1: `INSERT INTO user (user_name, email, password, password_original, mobile) VALUES (?,?,?,?,?)`,
    USER_INSERT: `INSERT INTO user (ownerId, username, email, password, pwd, phone) VALUES (?,?,?,?,?,?)`
}
