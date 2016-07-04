'use strict';

Array.prototype.add = function (val) {
  return this.includes(val) ? null : this.push(val);
};
Array.prototype.remove = function (val) {
  return this.includes(val) ? this.splice(this.indexOf(val), 1) : null;
};

const _ = require('lodash/fp');
const utils = require('./helpers/utils');
const events = require('./networking/client').events;
const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF'
};

const STATES = {
  WALK_FORWARD: 'KeyW',
  WALK_BACKWARD: 'KeyS',
  WALK_LEFT: 'KeyA',
  WALK_RIGHT: 'KeyD'
};

class Client {
  constructor(socket, input, output) {
    this.socket = socket;
    this.input = input;
    this.output = output;
    this.map = {};

    this.socket.on('update', this.update.bind(this));

    setInterval(this.report.bind(this), 10);
    setInterval(this.render.bind(this), 60);
  }

  update(data) {
    this.map = data;
  }

  report() {
    this.socket.emit(events.update, {
      states: this.input.getStates()
    });
  }

  render() {
    const avatar = _.find({id: `/#${this.socket.id}`}, this.map.actors);
    this.output
      .setMap(this.map)
      .clear()
      .panTo(avatar.x, avatar.y);
    utils.forOwn(wall => this.output.renderWall(wall.x, wall.y), this.map.walls);
    utils.forOwn(actor => this.output.renderActor(actor.x, actor.y), this.map.actors);
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

  getStates() {
    return _.map(key => _.findKey(val => val === key, STATES), this.pressed);
  }
}

class Output {
  constructor(canvas) {
    this.scale = 16;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.map = {width: 100, height: 100};
    this.offset = {x: 0, y: 0};
    window.onresize = e => this.resize(window.innerWidth, window.innerHeight);
    window.onresize();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    return this;
  }

  setMap(map) {
    this.map = map;
    return this;
  }

  clear() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = COLORS.BLACK;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = COLORS.BLACK;
    this.ctx.restore();
    return this;
  }

  panTo(x, y) {
    this.offset = {x, y};
  }

  renderWall(x, y) {
    return this.renderText(x, y, 'W');
  }

  renderActor(x, y) {
    return this.renderText(x, y, 'A');
  }

  renderText(x, y, text) {
    this.ctx.save();
    this.ctx.translate(
      (x - this.offset.x) * this.scale + Math.floor(this.canvas.width / 2),
      (y - this.offset.y) * this.scale + Math.floor(this.canvas.height / 2)
    );
    this.ctx.fillStyle = COLORS.WHITE;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
    return this;
  }
}

const client = new Client(require('socket.io-client')(), new Input(), new Output(document.getElementById('screen')));
