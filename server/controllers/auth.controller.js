import { validatePassword } from "../components/bcrypt.js";
import { generateToken } from "../components/jwt.js";
import db from "../db";
import UserService from "../services/user.service.js";

export const loginUser = async (req, res) => {
    try {
        const userService = new UserService();
        const result = await userService.login(req.body.email, req.body.password);

        if (result.status === 404) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (result.status === 401) {
            return res.status(401).json({
                message: "Invalid Password!"
            });
        }

        res.status(200).json(result.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message || "Error occurred while signing in."
        });
    }
};

