import dotenv from "dotenv";
dotenv.config();

// This is wrapper to process.env variables. Provides in object form
export const envConfig = {
    test: process.env.TEST_LETTER,
    env2: process.env.NODE_ENV || 'local',
};
