'use strict';

const _ = require('lodash/fp');
const utils = require('./../helpers/utils');

class Actor {
  constructor(id, x, y) {
    this.id = id;
    this.x = x || 0;
    this.y = y || 0;
    this.states = [];
  }

  update(map) {
    if (this.states.includes(this.STATES.WALK_FORWARD)) {
      this.y--;
      while (getColliding(map, this).length) {
        this.y++;
      }
    }
    if (this.states.includes(this.STATES.WALK_BACKWARD)) {
      this.y++;
      while (getColliding(map, this).length) {
        this.y--;
      }
    }
    if (this.states.includes(this.STATES.WALK_LEFT)) {
      this.x--;
      while (getColliding(map, this).length) {
        this.x++;
      }
    }
    if (this.states.includes(this.STATES.WALK_RIGHT)) {
      this.x++;
      while (getColliding(map, this).length) {
        this.x--;
      }
    }
    return this;
  }
}

Actor.prototype.STATES = utils.keysToValues({
  WALK_FORWARD: null,
  WALK_BACKWARD: null,
  WALK_LEFT: null,
  WALK_RIGHT: null
});

module.exports = Actor;

function getColliding(map, actor) {
  return _.reject({id: actor.id}, map.find(actor.x, actor.y));
}
