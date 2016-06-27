'use strict';

const {State, WANDERING} = require('./States');

class Entity {
  constructor() {
    this.class = this.constructor.name;
    this.data = {};
    this.components = {};
    this.states = {};
  }

  /**
   * @param {State} state
   * @returns {Entity}
   */
  addState(state) {
    this.states[state.class] = state;
    return this;
  }

  /**
   * @param {State} state
   * @returns {Entity}
   */
  removeState(state) {
    delete this.states[state.class];
    return this;
  }
}

class Sheep extends Entity {
  constructor() {
    super();
    this.addState(WANDERING);
  }
}

module.exports = {
  Entity,
  Sheep
};
