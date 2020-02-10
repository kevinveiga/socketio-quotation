import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';
import express from 'express';
import http from 'http';
import socketIo from 'socket.io';

import { pathPublic, port } from './config.js';

// VARIABLE
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const apiCache1Day = axios.create({
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { maxAge: 1000 * 60 * 60 * 24, max: 1000 }),
    baseURL: '/',
    headers: { 'Cache-Control': 'no-cache' }
});

const apiCache30Day = axios.create({
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { maxAge: 1000 * 60 * 60 * 24 * 30, max: 300000000 }),
    baseURL: '/',
    headers: { 'Cache-Control': 'no-cache' }
});

let interval = null;

// CONFIG
app.use(express.static(pathPublic));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

// GET
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// FUNCTION
/**
 * @description Busca api do CDI e SELIC da HG Brasil.
 */
const getApiHGBrasil = async () => {
    try {
        const result = await apiCache30Day.get('https://api.hgbrasil.com/finance/taxes?key=0af40e75');

        return result.data.results;
    } catch (error) {
        console.error(`Error getApiHGBrasil: ${error.code}`);
    }
};

/**
 * @description Busca api da Infomoney.
 * (Obs: caso ocorra algum erro, provavelmente chegou no limite de requisições permitidas da Infomoney)
 */
const getApiInfomoney = async () => {
    try {
        const result = await axios.get('https://api.infomoney.com.br/ativos/ticker?type=json&_=1143');

        return result.data;
    } catch (error) {
        console.error(`Error getApiInfomoney: ${error.code}`);
    }
};

/**
 * @description Busca api da Poupança do Banco Central.
 */
const getApiPoupanca = async () => {
    try {
        const result = await apiCache1Day.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.195/dados/ultimos/1?formato=json');

        return result.data;
    } catch (error) {
        console.error(`Error getApiPoupanca: ${error.code}`);
    }
};

/**
 * @description Busca todas as apis.
 * @param {object} socket Objeto do socket.io.
 */
const getApis = async (socket) => {
    try {
        const [resultHGBrasil, resultInfomoney, resultPoupanca] = await Promise.all([getApiHGBrasil(), getApiInfomoney(), getApiPoupanca()]);

        console.log('resultHGBrasil: ', resultHGBrasil);
        console.log('resultInfomoney: ', resultInfomoney);
        console.log('resultPoupanca: ', resultPoupanca);

        console.log('TODAS: ', { cdiSelic: resultHGBrasil, bolsa: resultInfomoney, poupanca: resultPoupanca });

        // socket.emit('quotationData', JSON.stringify(result.data));
    } catch (error) {
        console.error(`Error getApis: ${error.code}`);
    }
};

// SOCKET
// Middleware
// io.use((socket, next) => {
//     let token = socket.handshake.query.token;

//     if (isValid(token)) {
//         return next();
//     }

//     return next(new Error('authentication error'));
// });

// Origins
// io.origins((origin, callback) => {
//     if (origin !== 'https://foo.example.com') {
//         return callback('origin not allowed', false);
//     }

//     return callback(null, true);
// });

io.on('connection', (socket) => {
    console.log('log: new user connected');

    getApis(socket);

    if (interval) {
        clearInterval(interval);
    }

    interval = setInterval(() => {
        console.log('interval');

        getApis(socket);
    }, 30000);

    socket.on('disconnect', (reason) => {
        console.info('User disconnect: ', reason);
    });

    socket.on('disconnecting', (reason) => {
        console.info('User disconnecting: ', reason);
    });

    socket.on('error', (error) => {
        console.error('error: ', error);
    });
});

// Don't use to event name
// error
// connect
// disconnect
// disconnecting
// newListener
// removeListener
// ping
// pong

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});
