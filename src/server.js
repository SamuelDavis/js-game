'use strict';

const _ = require('lodash/fp');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const client = require('./networking/client');
const utils = require('./helpers/utils');
const Map = require('./world/map');
const PORT = process.argv[3];
const clients = {};
const map = new Map().generate();

app.use('/', express.static(`${__dirname}/../public`));
io.on(client.events.connection, socket => client.init(socket, clients, map));
http.listen(PORT, () => console.log(`listening on *:${PORT}`));

setInterval(() => {
  io.emit('update', map);
}, 10);
