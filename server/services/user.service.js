import { validatePassword } from "../components/bcrypt.js";
import { generateToken } from "../components/jwt.js";
import db from "../db";

const SQL = {
    FIND_USER: 'SELECT * FROM user WHERE email = ?'
};

class UserService {
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