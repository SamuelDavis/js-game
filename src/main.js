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
  constructor(map, height = 1, modifiers = [], chr = '.') {
    this._map = map;
    this._height = height;
    this._chr = chr;
    this._modifiers = modifiers;
  }

  getPos() {
    return _.map(parseInt, _.findKey(tile => tile === this, this._map.tiles).split(','));
  }

  getChr() {
    return this.constructor.name.slice(0, 1);
  }
}

class Field extends Tile {
}

class Display {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._display = new ROT.Display({width: w * 2, height: h, fontSize: 16, forceSquareRatio: true});
    document.body.appendChild(this._display.getContainer());
  }

  getContainer() {
    return this._display.getContainer();
  }

  render(map) {
    const ctx = this._display.getContainer().getContext('2d');
    map.tiles.forOwn(tile => {
      let [x, y] = tile.getPos();
      ctx.strokeStyle = '#0000FF';
      x = x * 2 + (y % 2 ? 0 : 1);
      ctx.strokeRect(x * 16, y * 16, 16, 16);
      const fore = x === (selected.x * 2 + (selected.y % 2 ? 0 : 1)) && y === selected.y ? '#00FF00' : '#FFFFFF';
      return this._display.draw(x, y, tile.getChr(), fore);
    });
    return this;
  }
}

class Map {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = {};
    this.actors = {};
    new ROT.Map.Arena(this.width, this.height)
      .create((x, y, v) => v ? null : this.tiles[`${x},${y}`] = new Field(this));
  }

  getEmptyPositions() {
    return _.difference(_.keys(this.tiles), _.keys(this.actors));
  }

  isPassable(pos) {
    return this.getEmptyPositions().includes(pos);
  }
}

ROT.RNG.setSeed(1234);
const w = 25;
const h = 25;
const display = new Display(w, h);
const map = new Map(w, h);
let selected = {};


display.getContainer().onclick = ({offsetX, offsetY}) => {
  let x = Math.floor(offsetX / 32);
  let y = Math.floor(offsetY / 16);
  selected = {x, y};
  display.render(map);
};

setTimeout(() => display.render(map), 60);
