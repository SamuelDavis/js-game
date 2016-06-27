'use strict';

const Entities = require('./Entities');

class Component {
  constructor(defaultData = {}) {
    this.class = this.constructor.name;
    this.defaultData = defaultData;
  }

  /**
   * @param {Entity} entity
   * @param {Object} data
   * @returns {Component}
   */
  setData(entity, data) {
    entity.data[this.class] = Object.assign({}, entity.data[this.class], data);
    return this;
  }

  /**
   * @param {Entity} entity
   * @returns {Component}
   */
  init(entity) {
    this.setData(entity, this.defaultData);
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
