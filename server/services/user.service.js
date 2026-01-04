import { generateHash, validatePassword } from "../components/bcrypt.js";
import { generateToken } from "../components/jwt.js";
import db from "../db";

class UserService {
    constructor() {

    }
    async signup(bodyParams) {
        try {
            const passwordHash = await generateHash(bodyParams.password);
            let res = await db.query(SQL.USER_INSERT, [0, bodyParams.username, bodyParams.email, passwordHash, bodyParams.password, bodyParams.phone, (bodyParams.gateWay || 'direct')]);
            return {id: res.insertId};
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    async login(email, password) {
        try {
            const users = await db.query(SQL.FIND_USER, [email]);
            
            if (users.length === 0) {
                return {
                    status: 404,
                    message: "User not found."
                };
            }

            const user = users[0];
            const passwordIsValid = validatePassword(password, user.password);

            if (!passwordIsValid) {
                return {
                    status: 401,
                    message: "Invalid Password!"
                };
            }

            const token = generateToken({
                id: user.id,
                userName: user.user_name,
                userEmail: user.email
            });

            // insert into acccesstoken table
            // await db.query(`INSERT INTO accesstoken ('id', 'user_id') VALUES (${token}, ${user.id})`);

            return {
                status: 200,
                data: {
                    id: token,
                    userId: user.id,
                    userName: user.user_name,
                    userEmail: user.email
                }
            };
        } catch (error) {
            console.error(error);
            return {
                status: 500,
                message: error.message || "Error occurred while signing in."
            };
        }
    }
}

export default UserService;

const SQL = {
    FIND_USER: 'SELECT * FROM user WHERE email = ?',
    USER_INSERT_V1: `INSERT INTO user (user_name, email, password, pwd, phone, gateway) VALUES (?,?,?,?,?,?)`,
    USER_INSERT: `INSERT INTO user (ownerId, username, email, password, pwd, phone) VALUES (?,?,?,?,?,?)`
}
