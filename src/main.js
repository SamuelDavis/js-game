'use strict';

const _ = require('lodash/fp');
const ROT = require('rot-js');
ROT.RNG.setSeed(12345);

Object.prototype.forOwn = function (cb) {
  let prop;
  for (prop in this) {
    if (this.hasOwnProperty(prop)) {
      if (cb(this[prop], prop, this) === false) {
        return this;
      }
    }
  }
  return this;
};

const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF'
};

class Tile {
  constructor(map) {
    this._map = map;
  }

  getX() {
    return parseInt(_.findKey(tile => tile === this, this._map.tiles).split(',')[0]);
  }

  getY() {
    return parseInt(_.findKey(tile => tile === this, this._map.tiles).split(',')[1]);
  }

  getChr() {
    return '.';
  }
}

class Actor {
  constructor(map, chr) {
    this._map = map;
    this.chr = chr;
    this.intent = null;
    this.stamina = 10;
  }

  act() {
    this.stamina++;
    if (this.intent) {
      return this.intent();
    }
    return this.pickIntent();
  }

  pickIntent() {
  }

  getPos() {
    return _.findKey(actor => actor === this, this._map.actors);
  }

  getX() {
    return parseInt(this.getPos().split(',')[0]);
  }

  getY() {
    return parseInt(this.getPos().split(',')[1]);
  }

  moveTo(dest) {
    const pos = this.getPos();
    this._map.actors[dest] = this;
    delete this._map.actors[pos];
    return this;
  }
}

class Player extends Actor {
  constructor(map, chr) {
    super(map, chr);
    this.pressed = [];
    document.addEventListener('keydown', e => this.pressed.includes(e.code) ? null : this.pressed.push(e.code));
    document.addEventListener('keyup', e => this.pressed = _.remove(val => val === e.code, this.pressed));
  }

  pickIntent() {
    let deltaX = 0;
    let deltaY = 0;
    if (this.pressed.includes('KeyW')) {
      deltaY--;
    }
    if (this.pressed.includes('KeyA')) {
      deltaX--;
    }
    if (this.pressed.includes('KeyS')) {
      deltaY++;
    }
    if (this.pressed.includes('KeyD')) {
      deltaX++;
    }
    const deltaStam = Math.abs(deltaX) + Math.abs(deltaY);
    const dest = `${this.getX() + deltaX},${this.getY() + deltaY}`;
    if (this.stamina >= deltaStam && this._map.isPassable(dest)) {
      this.intent = () => {
        this.moveTo(dest);
        this.intent = null;
        this.stamina -= deltaStam;
        return this;
      };
    }
    return this.intent ? this.intent() : this;
  }
}

class Sheep extends Actor {
  pickIntent() {
    if (this.stamina < 10) {
      this.stamina++;
      return this;
    }
    const [destX, destY] = _.map(parseInt, this._map.getEmptyPositions().random().split(','));
    const pathfinder = new ROT.Path.AStar(destX, destY, (x, y) => {
      const check = `${x},${y}`;
      return this.getPos() === check || this._map.isPassable(check);
    });
    let path = [];
    pathfinder.compute(this.getX(), this.getY(), (x, y) => path.push(`${x},${y}`));
    path.shift();

    this.intent = () => {
      if (!path.length) {
        this.intent = null;
        return this;
      }
      const next = path.shift();
      if (!this._map.isPassable(next)) {
        path = [];
        pathfinder.compute(this.getX(), this.getY(), (x, y) => path.push(`${x},${y}`));
        return this;
      }

      this.stamina--;
      return this.moveTo(next);
    };

    return this.intent();
  };
}

class Display {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._display = new ROT.Display({width: w, height: h, fontSize: 16, forceSquareRatio: true});
    document.body.appendChild(this._display.getContainer());
  }

  render(map) {
    map.tiles.forOwn(tile => this._display.draw(tile.getX(), tile.getY(), tile.getChr()));
    map.actors.forOwn(actor => this._display.draw(actor.getX(), actor.getY(), actor.chr));
  }
}

class Map {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = {};
    this.actors = {};
    new ROT.Map.Arena(this.width, this.height)
      .create((x, y, v) => v ? null : this.tiles[`${x},${y}`] = new Tile(this));
  }

  spawnActor(actor) {
    const [x, y] = this.getEmptyPositions().random().split(',');
    return this.actors[`${x},${y}`] = actor;
  }

  getEmptyPositions() {
    return _.difference(_.keys(this.tiles), _.keys(this.actors));
  }

  isPassable(pos) {
    return this.getEmptyPositions().includes(pos);
  }
}

ROT.RNG.setSeed(1234);
const w = 50;
const h = 20;
const display = new Display(w, h);
const map = new Map(w, h);
const scheduler = new ROT.Scheduler.Simple();
scheduler.add(map.spawnActor(new Sheep(map, 'S')), true);
scheduler.add(map.spawnActor(new Player(map, 'P')), true);

setInterval(() => display.render(map), 60);
setInterval(() => scheduler.next().act(), 100);
