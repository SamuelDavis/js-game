'use strict';

const _ = require('lodash/fp');
const utils = require('./../helpers/utils');

const HANDLERS = {connection, update, disconnect};

module.exports = {
  events: utils.keysToValues(HANDLERS),
  init
};

function init(socket, clients) {
  if (!clients.hasOwnProperty(socket.id)) {
    clients[socket.id] = {socket, data: {}};
  }
  utils.forOwn((cb, evt) => socket.on(evt, data => cb(socket, data, clients)), HANDLERS);
}

function connection(socket, data, clients) {
  return null;
}

function update(socket, data, clients) {
  clients[socket.id] = {socket, data};
}

function disconnect(socket, data, clients) {
  delete clients[socket.id];
}
