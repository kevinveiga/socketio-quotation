import dotenv from 'dotenv';

import path from 'path';

// ENV File
dotenv.config({
    path: `./.env.${process.env.NODE_ENV}`
});

console.log('dotenv: ', process.env.NODE_ENV);

export const config = {
    cors: process.env.CORS,
    pathPublic: path.join(__dirname, '/../public'),
    port: process.env.PORT
};
