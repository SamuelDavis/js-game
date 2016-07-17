'use strict';

import _ from 'lodash/fp';
const tiles = {};
let width, height;

class Tile {
  constructor(gId) {
    this.gId = gId;
    this.units = [];
  }

  getContents() {
    return [this]
      .concat(this.units)
      .concat(this.selected ? [{gId: 298}] : []);
  }

  addUnit(unit) {
    if (!this.units.includes(unit)) {
      this.units.push(unit);
    }
    return this;
  }
}

function setTile(collection, x, y, tile) {
  collection[`${x},${y}`] = tile;
}

export default class Map {
  constructor(tilesSrc = [], unitsSrc = []) {
    width = tilesSrc.length;
    height = tilesSrc[0].length;
    tilesSrc.forEach((row, y) => {
      row.forEach((gId, x) => {
        setTile(tiles, x, y, new Tile(gId));
        const unitGId = _.get(`${y}.${x}`, unitsSrc);
        if (unitGId) {
          this
            .getTile(x, y)
            .addUnit(new Tile(unitGId));
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

  getTile(x, y) {
    return _.get(`${x},${y}`, tiles);
  }
}
