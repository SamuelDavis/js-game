'use strict';

import _ from 'lodash/fp';
const terrain = {};
const units = {};
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
  constructor(terrainSrc = [], unitsSrc = []) {
    width = terrainSrc.length;
    height = terrainSrc[0].length;
    terrainSrc.forEach((row, y) => {
      row.forEach((gId, x) => {
        setTile(terrain, x, y, new Tile(gId));
        const unitGId = _.get(`${y}.${x}`, unitsSrc);
        if (unitGId) {
          setTile(units, x, y, new Tile(unitGId));
        }
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

  getUnit(x, y) {
    return _.get(`${x},${y}`, units);
  }
}
