'use strict';

const _ = require('lodash/fp');

module.exports = class {
  constructor(width = 100, height = 100) {
    this.width = width;
    this.height = height;
    this.walls = {};
    this.actors = {};
  }

  generate() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (y === 0 || y === this.height - 1 || x === 0 || this.x === this.width - 1) {
          this.walls[`${x},${y}`] = 1;
        }
      }
    }
    return this;
  }

  spawn(actor) {
    while (true) {
      const x = _.random(1, this.width - 1);
      const y = _.random(1, this.height - 1);
      const point = `${x},${y}`;
      if (!this.walls.hasOwnProperty(point)) {
        return this.actors[point] = actor;
      }
    }
  }

};
