import { envConfig } from "./envconfig";

export const appConfig = {
    ...envConfig,
    test2: 'from app config'
}