'use strict';

const _ = require('lodash/fp');
const utils = require('./../helpers/utils');

module.exports = class {
  constructor(width = 100, height = 100) {
    this.width = width;
    this.height = height;
    this.walls = [];
    this.actors = [];
  }

  generate() {
    for (let y = 0; y <= this.height; y++) {
      for (let x = 0; x <= this.width; x++) {
        if ((y === 0 || x === 0) || (y === this.height || x === this.width)) {
          this.walls.add({x, y});
        }
      }
    }
    return this;
  }

  spawn(actor) {
    while (true) {
      const x = _.random(1, this.width - 1);
      const y = _.random(1, this.height - 1);
      if (!_.find({x, y}, this.walls)) {
        actor.x = x;
        actor.y = y;
        this.actors.add(actor);
        return actor;
      }
    }
  }

  find(x, y) {
      return _.filter({x, y}, _.concat(this.walls, this.actors));
  }
};
