import jwt from 'jsonwebtoken';
import { appConfig } from '../../dist-server/config';

export const generateToken = (data) => {
    return jwt.sign(data, appConfig.tokenSecretKey);
};

export const verifyJwtToken = async (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, appConfig.tokenSecretKey, (err, decoded) => {
            if (err) {
                return resolve({status: "INVALID"});
            }
            return resolve({status: "VALID", payload: decoded});
        });
    });
};
