'use strict';

import _ from 'lodash/fp';
const data = {};
let width, height;

class Tile {
  constructor(type) {
    this.type = type;
  }
}

function setTile(x, y, tile) {
  data[`${x},${y}`] = tile;
}

export default class Map {
  constructor(src) {
    width = src.length;
    height = src[0].length;
    src.forEach((row, y) => {
      row.forEach((type, x) => {
        setTile(x, y, new Tile(type));
      });
    });
  }

  getWidth() {
    return width;
  }

  getHeight() {
    return height;
  }

  getTile(x, y) {
    return _.get(`${x},${y}`, data);
  }
}
