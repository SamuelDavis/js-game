'use strict';

const Entities = require('./Entities');

class Component {
  constructor(defaultData = {}) {
    this.class = this.constructor.name;
    this.defaultData = defaultData;
  }

  /**
   * @param {Entity} entity
   * @returns {Component}
   */
  init(entity) {
    entity.data[this.class] = Object.assign({}, this.defaultData, entity.data[this.class]);
    return this;
  }
}

class Position extends Component {
  constructor(defaultData = {x: 0, y: 0, a: 0}) {
    super(defaultData);
  }
}

module.exports = {
  Component,
  POSITION: new Position()
};
