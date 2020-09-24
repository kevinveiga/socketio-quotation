import dotenv from 'dotenv';
import path from 'path';

// ENV File
dotenv.config({
    path: `./.env.${process.env.NODE_ENV}`
});

console.info('Env: ', process.env.NODE_ENV);

export const config = {
    cors: process.env.CORS,
    corsUrl: process.env.CORSURL,
    pathPublic: path.join(__dirname, '/../public'),
    port: process.env.PORT
};
