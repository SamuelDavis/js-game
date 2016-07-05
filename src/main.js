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
    if (this.intent) {
      return this.intent();
    }
    if (this.stamina >= 10) {
      return this.startWandering();
    }

    this.stamina++;
  }

  startWandering() {
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

      const pos = this.getPos();
      this._map.actors[next] = this;
      delete this._map.actors[pos];
      this.stamina--;
      return this;
    };

    return this.intent();
  };

  getPos() {
    return _.findKey(actor => actor === this, this._map.actors);
  }

  getX() {
    return parseInt(this.getPos().split(',')[0]);
  }

  getY() {
    return parseInt(this.getPos().split(',')[1]);
  }
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

  spawnActor(chr = '@') {
    // const [x, y] = this.getEmptyPositions().random().split(',');
    const x = 2;
    const y = 2;
    return this.actors[`${x},${y}`] = new Actor(this, chr);
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
scheduler.add(map.spawnActor(), true);

setInterval(() => display.render(map), 60);
setInterval(() => scheduler.next().act(), 100);
