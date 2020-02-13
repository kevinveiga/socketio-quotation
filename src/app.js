// Lib
import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';

// Node
import http from 'http';
import path from 'path';

// Server
import express from 'express';

// Socket
import socketIo from 'socket.io';

// Config
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
    res.sendFile(path.join(__dirname, '/index.html'));
});

// FUNCTION
/**
 * @description Busca API do CDI e SELIC da HG Brasil.
 */
const getApiHGBrasil = async () => {
    try {
        const result = await apiCache30Day.get('https://api.hgbrasil.com/finance/taxes?key=0af40e75');

        return result.data.results;
    } catch (error) {
        console.error(`Error getApiHGBrasil: ${error.code}`);
    }

    return null;
};

/**
 * @description Busca API da Infomoney.
 * (Obs: caso ocorra algum erro, provavelmente chegou no limite de requisições permitidas da Infomoney,
 * pode ser usado os dados da HG Brasil no lugar da Infomoney)
 */
const getApiInfomoney = async () => {
    const valuesToRemove = ['ABEV3', 'GGBR4', 'IFIX', 'ITUB4', 'MGLU3', 'PETR4', 'VALE3'];

    try {
        const result = await axios.get('https://api.infomoney.com.br/ativos/ticker?type=json&_=1143');
        const newResult = result.data.filter((elem) => {
            return valuesToRemove.indexOf(elem.Name) === -1;
        });

        return newResult;
    } catch (error) {
        console.error(`Error getApiInfomoney: ${error.code}`);
    }

    return null;
};

/**
 * @description Busca API da Poupança do Banco Central.
 */
const getApiPoupanca = async () => {
    try {
        const result = await apiCache1Day.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.195/dados/ultimos/1?formato=json');

        return result.data;
    } catch (error) {
        console.error(`Error getApiPoupanca: ${error.code}`);
    }

    return null;
};

/**
 * @description Busca todas as API's.
 * @param {object} socket Objeto do socket.io.
 */
const getApis = async (socket) => {
    try {
        const [resultHGBrasil, resultInfomoney, resultPoupanca] = await Promise.all([getApiHGBrasil(), getApiInfomoney(), getApiPoupanca()]);

        socket.emit('quotationData', JSON.stringify({ cdiSelic: resultHGBrasil, bolsa: resultInfomoney, poupanca: resultPoupanca }));
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
    console.log('Log: new user connected');

    getApis(socket);

    if (interval) {
        clearInterval(interval);
    }

    // Intervalo a cada 1 minuto
    interval = setInterval(() => {
        console.clear();

        console.log(`Running in: ${process.env.NODE_ENV}`);

        const today = new Date();
        const dateTime = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()} - ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        console.log(`Log: get API in ${dateTime}`);

        getApis(socket);
    }, 60000);

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
    console.log(`Listening on *:${port}`);
});
