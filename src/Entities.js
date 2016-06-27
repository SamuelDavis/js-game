'use strict';

const {Loop} = require('./utils');
const {Component, POSITION} = require('./Components');
const MathHelper = require('./math');

class Entity {
  constructor() {
    this.class = this.constructor.name;
    this.data = {};
    this.components = {};
  }

  /**
   * @returns {Entity}
   */
  update() {
    return this;
  }

  /**
   * @param {Component} component
   * @returns {Entity}
   */
  addComponent(component) {
    component.init(this);
    return this;
  }

  /**
   * @param {Component} component
   * @returns {Entity}
   */
  removeComponent(component) {
    delete this.components[component.class];
    return this;
  }
}

class Sheep extends Entity {
  constructor(position = {}) {
    super();
    this.energy = 0;
    this.addComponent(POSITION);
    POSITION.setData(this, position);
    this.wandering = new Loop(1000 / 50, () => {
      this.energy--;
      const pos = this.data[POSITION.class];
      if (Math.random() < 0.05) {
        pos.a += (Math.floor(Math.random() * 10) % 2 === 0 ? 1 : -1) * (180 / Math.PI);
      }
      Object.assign(pos, MathHelper.stepForward(pos.a, 1, pos));
    });
  }

  update(zone) {
    if (!this.wandering.isRunning()) {
      this.energy++;
    }

    if (this.energy > 300) {
      this.wandering.start();
    }

    if (this.energy < 0) {
      this.wandering.stop();
      this.energy = 0;
    }

    const pos = this.data[POSITION.class];

    if (pos.x < zone.x) {
      pos.x = 0;
      pos.a = 0;
    }
    if (pos.x > zone.width) {
      pos.x = zone.width;
      pos.a = Math.PI;
    }
    if (pos.y < zone.y) {
      pos.y = 0;
      pos.a = Math.PI * -1.5;
    }
    if (pos.y > zone.height) {
      pos.y = zone.height;
      pos.a = Math.PI * 1.5;
    }
  }
}

module.exports = {
  Entity,
  Sheep
};
