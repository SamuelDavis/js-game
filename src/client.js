'use strict';

const _ = require('lodash/fp');
const utils = require('./helpers/utils');
const events = require('./networking/client').events;

Array.prototype.add = function (val) {
  return this.includes(val) ? null : this.push(val);
};
Array.prototype.remove = function (val) {
  return this.includes(val) ? this.splice(this.indexOf(val), 1) : null;
};

class Client {
  constructor(socket, input) {
    this.socket = socket;
    this.input = input;
    this.world = {};

    this.socket.on('update', this.update.bind(this));

    setInterval(() => this.socket.emit(events.update, this.input), 10);
    setInterval(this.render.bind(this), 1600)
  }

  update(data) {
    this.world = data;
  }

  render() {
    console.log(this.world);
  }
}

class Input {
  constructor() {
    const mouseButtons = ['MouseLeft', 'MouseMiddle', 'MouseRight'];
    this.cursor = {};
    this.pressed = [];

    document.onkey = utils.overrideEvent(e => this.pressed = []);
    document.onmousemove = utils.overrideEvent(e => this.cursor = _.pick(['pageX', 'pageY'], e));
    document.onkeydown = utils.overrideEvent(e => this.pressed.add(e.code));
    document.onkeyup = utils.overrideEvent(e => this.pressed.remove(e.code));
    document.onmousedown = utils.overrideEvent(e => this.pressed.add(mouseButtons[e.which - 1]));
    document.onmouseup = utils.overrideEvent(e => this.pressed.remove(mouseButtons[e.which - 1]));
  }
}

const client = new Client(require('socket.io-client')(), new Input());
