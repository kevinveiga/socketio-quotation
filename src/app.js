import axios from 'axios';
import express from 'express';
import http from 'http';
import socketIo from 'socket.io';

import { pathPublic, port } from './config.js';

// VARIABLE
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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
const getApi = async (socket) => {
    try {
        const result = await axios.get('https://api.infomoney.com.br/ativos/ticker?type=json&_=1143');

        socket.emit('quotationData', JSON.stringify(result.data));
    } catch (error) {
        console.error(`Error: ${error.code}`);
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

io.on('connection', (socket) => {
    console.log('log: new user connected');

    getApi(socket);

    if (interval) {
        clearInterval(interval);
    }

    interval = setInterval(() => {
        console.log('interval');

        getApi(socket);
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
