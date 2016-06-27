'use strict';

const {Entity} = require('./Entities');
const {Component, POSITION} = require('./Components');

class State {
  constructor(components = []) {
    this.class = this.constructor.name;
    this.components = components;
  }

  addTo(entity) {
    this.components.forEach(addComponent.bind(null, entity));
    return this;
  }

  removeFrom(entity) {
    this.components.forEach(removeComponent.bind(null, entity));
    return this;
  }
}

class Wandering {
  constructor(components = [POSITION]) {
    super(components);
  }
}

module.exports = {
  State,
  WANDERING: new Wandering()
};

/**
 * @param {Entity} entity
 * @param {Component} component
 */
function addComponent(entity, component) {
  if (!entity.data.hasOwnProperty(component.class)) {
    component.init(entity);
  }
  entity.components[component.class] = component;
}

/**
 * @param {Entity} entity
 * @param {Component} component
 */
function removeComponent(entity, component) {
  delete entity.components[component.class];
}
