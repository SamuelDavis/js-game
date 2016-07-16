'use strict';

import _ from 'lodash/fp';
const terrain = {};
let width, height;

class Tile {
  constructor(gId) {
    this.gId = gId;
  }
}

function setTile(collection, x, y, tile) {
  collection[`${x},${y}`] = tile;
}

export default class Map {
  constructor(src) {
    width = src.length;
    height = src[0].length;
    src.forEach((row, y) => {
      row.forEach((gId, x) => {
        setTile(terrain, x, y, new Tile(gId));
      });
    });
  }

  getWidth() {
    return width;
  }

  getHeight() {
    return height;
  }

  getTerrain(x, y) {
    return _.get(`${x},${y}`, terrain);
  }
}
