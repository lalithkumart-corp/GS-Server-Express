
import fs from 'fs';
import { get } from 'http';
import path from 'path';

export * from './db.config.js';
export * from './env.config.js';

const env = process.env.NODE_ENV || 'dev';
// const configPath = path.join(__dirname, `config.${env}.json`);
const configPath = path.join(__dirname, `config.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export const appConfig = {...config, get: (key) => {
        return config[key];
    }
};

