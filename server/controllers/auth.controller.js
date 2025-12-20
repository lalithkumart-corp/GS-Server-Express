import { validatePassword } from "../components/bcrypt.js";
import { generateToken } from "../components/jwt.js";
import db from "../db";


const SQL = {
    FIND_USER: 'SELECT * FROM user WHERE email = ?'
};

export const loginUser = async (req, res) => {
    try {
        const users = await db.query(SQL.FIND_USER, [req.body.useremail]);
        
        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const user = users[0];
        const passwordIsValid = validatePassword(req.body.password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "Invalid Password!"
            });
        }

        const token = generateToken({
            id: user.id,
            userName: user.user_name,
            userEmail: user.email
        });

        // insert into acccesstoken table
        // await db.query(`INSERT INTO accesstoken ('id', 'user_id') VALUES (${token}, ${user.id})`);

        res.status(200).json({
            token,
            userId: user.id,
            userName: user.user_name,
            userEmail: user.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message || "Error occurred while signing in."
        });
    }
};
