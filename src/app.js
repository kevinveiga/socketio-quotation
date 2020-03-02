// IMPORT
// Lib
import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';

// Node
import http from 'http';

// Server
import cors from 'cors';
import express from 'express';

// Socket
import socketIo from 'socket.io';

// Config
import { config } from './config.js';

// VARIABLE
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const corsOptions = {
    origin: (origin, callback) => {
        if (JSON.parse(config.cors) && origin !== config.corsUrl) {
            return callback('Origin not allowed', false);
        }

        return callback(null, true);
    },
    optionsSuccessStatus: 200
};

const apiCache1Day = axios.create({
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { maxAge: 1000 * 60 * 60 * 24, max: 1000 }),
    baseURL: '/',
    headers: { 'Cache-Control': 'no-cache' }
});

// const apiCache30Day = axios.create({
//     adapter: cacheAdapterEnhancer(axios.defaults.adapter, { maxAge: 1000 * 60 * 60 * 24 * 30, max: 300000000 }),
//     baseURL: '/',
//     headers: { 'Cache-Control': 'no-cache' }
// });

let interval = null;

// CONFIG
// app.use(express.static(config.pathPublic));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Origin', JSON.parse(config.cors) ? config.corsUrl : '*');
    res.setHeader('Content-Type', 'application/json');

    console.log(`Request ip: ${req.ip} - ${getDateTime()}`);

    next();
});

// GET
app.get('/', cors(corsOptions), (req, res) => {
    res.json({ msg: 'Micro Serviço - Cotações' });
    // res.sendFile(path.join(__dirname, '../public/index.html'));
});

// FUNCTION
/**
 * @description Busca API da CDI do Banco Central.
 */
const getApiCdi = async () => {
    try {
        const result = await apiCache1Day.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/2?formato=json');

        const variation = parseFloat(result.data[1].valor) - parseFloat(result.data[0].valor);

        return { value: parseFloat(result.data[1].valor).toFixed(2), operator: variation < 0 && '-', variation: `${variation > 0 ? '+' : ''}${variation.toFixed(2)}` };
    } catch (error) {
        console.error(`Error getApiCDI: ${error.code}`);
    }

    return null;
};

/**
 * @description Busca API da Infomoney.
 * (Obs: caso ocorra algum erro, provavelmente chegou no limite de requisições permitidas da Infomoney,
 * ver com alguém sobre outra possibilidade de pegar a API da Infomoney, ou usar os dados da HG Brasil).
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
        const result = await apiCache1Day.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.195/dados/ultimos/2?formato=json');

        const variation = parseFloat(result.data[1].valor) - parseFloat(result.data[0].valor);

        return { value: parseFloat(result.data[1].valor).toFixed(2), operator: variation < 0 && '-', variation: `${variation > 0 ? '+' : ''}${variation.toFixed(2)}` };
    } catch (error) {
        console.error(`Error getApiPoupanca: ${error.code}`);
    }

    return null;
};

/**
 * @description Busca API da SELIC do Banco Central.
 */
const getApiSelic = async () => {
    try {
        const result = await apiCache1Day.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/2?formato=json');

        const variation = parseFloat(result.data[1].valor) - parseFloat(result.data[0].valor);

        return { value: parseFloat(result.data[1].valor).toFixed(2), operator: variation < 0 && '-', variation: `${variation > 0 ? '+' : ''}${variation.toFixed(2)}` };
    } catch (error) {
        console.error(`Error getApiSELIC: ${error.code}`);
    }

    return null;
};

/**
 * @description Busca todas as API's.
 * @param {object} socket Objeto do socket.io.
 */
const getApis = async (socket) => {
    try {
        const [resultCdi, resultInfomoney, resultPoupanca, resultSelic] = await Promise.all([getApiCdi(), getApiInfomoney(), getApiPoupanca(), getApiSelic()]);

        socket.emit('quotationData', JSON.stringify({ bolsa: resultInfomoney, cdi: resultCdi, poupanca: resultPoupanca, selic: resultSelic }));
    } catch (error) {
        console.error(`Error getApis: ${error.code}`);
    }
};

const getDateTime = () => {
    const today = new Date();
    const dateTime = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()} - ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    return dateTime;
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
io.origins((origin, callback) => {
    console.log(`Origin: ${origin} - ${getDateTime()}`);
    console.log(`Env corsUrl: ${config.corsUrl} - ${getDateTime()}`);

    if (JSON.parse(config.cors) && origin !== config.corsUrl) {
        return callback('Origin not allowed', false);
    }

    return callback(null, true);
});

io.on('connection', (socket) => {
    try {
        console.log(`Log: new user connected - ${getDateTime()}`);

        getApis(socket);

        if (interval) {
            clearInterval(interval);
        }

        // Intervalo de 1 minuto
        interval = setInterval(() => {
            console.clear();

            console.log(`Log: get API in ${getDateTime()}`);

            getApis(socket);
        }, 6000);

        socket.on('disconnect', (reason) => {
            console.info('User disconnect: ', reason);
        });

        socket.on('disconnecting', (reason) => {
            console.info('User disconnecting: ', reason);
        });

        socket.on('error', (error) => {
            console.error('Error: ', error);
        });
    } catch (error) {
        console.error('Error: ', error);
    }
});

// Don't use to event name
// connect
// error
// disconnect
// disconnecting
// newListener
// ping
// pong
// removeListener

server.listen(config.port, () => {
    console.log(`Listening on *:${config.port}`);
});
