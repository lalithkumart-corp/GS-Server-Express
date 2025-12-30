import dotenv from "dotenv";
dotenv.config();

export const envConfig = {
    test: process.env.TEST_LETTER,
    env2: process.env.NODE_ENV || 'local',
};
