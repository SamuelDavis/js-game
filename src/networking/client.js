'use strict';

const _ = require('lodash/fp');
const utils = require('./../helpers/utils');
const Actor = require('./../world/actor');

const HANDLERS = {connection, update, disconnect};

module.exports = {
  events: utils.keysToValues(HANDLERS),
  init
};

function init(socket, clients, map) {
  utils.forOwn((cb, evt) => socket.on(evt, data => cb(socket, data, map, clients)), HANDLERS);
  const registration = clients[socket.id] = {socket, data: {}};
  registration.actor = map.spawn(new Actor(socket.id));
}

function connection(socket, data, map, clients) {
  return null;
}

function update(socket, data, map, clients) {
  clients[socket.id] = {socket, data};
}

function disconnect(socket, data, map, clients) {
  map.actors = _.remove({id: socket.id}, map.actors);
  delete clients[socket.id];
}
