import bcrypt from "bcrypt";
import { appConfig } from "../config/index.js";

export const generateHash = (passwordText) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(passwordText, appConfig.saltRounds).then((hash) => {
            return resolve(hash);
        });
    });
};

export const validatePassword = (passwordText, passwordHash) => {
    return bcrypt.compareSync(passwordText, passwordHash);
}