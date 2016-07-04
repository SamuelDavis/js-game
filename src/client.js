'use strict';

const _ = require('lodash/fp');
const utils = require('./helpers/utils');
const events = require('./networking/client').events;
const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF'
};

Array.prototype.add = function (val) {
  return this.includes(val) ? null : this.push(val);
};
Array.prototype.remove = function (val) {
  return this.includes(val) ? this.splice(this.indexOf(val), 1) : null;
};

class Client {
  constructor(socket, input, output) {
    this.socket = socket;
    this.input = input;
    this.output = output;
    this.map = {};

    this.socket.on('update', this.update.bind(this));

    setInterval(() => this.socket.emit(events.update, this.input), 10);
    setInterval(this.render.bind(this), 500)
  }

  update(data) {
    this.map = data;
  }

  render() {
    const avatarPoint = _.findKey({id: `/#${this.socket.id}`}, this.map.actors) || '0,0';
    this.output
      .setMap(this.map)
      .clear()
      .panTo.apply(this.output, avatarPoint.split(','));
    utils.forOwn((wall, position) => this.output.renderWall.apply(this.output, position.split(',')), this.map.walls);
    utils.forOwn((actor, position) => this.output.renderActor.apply(this.output, position.split(',')), this.map.actors);
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
