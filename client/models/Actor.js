'use strict';

module.exports = (cfg = {}) => {
  const util = cfg.util || require('./../util')();
  const config = cfg.config || require('./../config')();

  return class Actor {
    constructor() {
      this.position = [0, 0, 0, 0];
      this.speed = 1;
      this.states = [];
    }

    update() {
      this.move();
    }

    move() {
      if (this.states.indexOf(config.ACTOR_STATES.WALK_FORWARD) !== -1) {
        const pos = util.calculatePosition(this.position[0], this.speed);
        this.position[1] += pos.x;
        this.position[2] += pos.y;
      }
      if (this.states.indexOf(config.ACTOR_STATES.WALK_LEFT) !== -1) {
        const pos = util.calculatePosition(this.position[0] - Math.PI / 2, this.speed);
        this.position[1] += pos.x;
        this.position[2] += pos.y;
      }
      if (this.states.indexOf(config.ACTOR_STATES.WALK_BACK) !== -1) {
        const pos = util.calculatePosition(this.position[0], -this.speed);
        this.position[1] += pos.x;
        this.position[2] += pos.y;
      }
      if (this.states.indexOf(config.ACTOR_STATES.WALK_RIGHT) !== -1) {
        const pos = util.calculatePosition(this.position[0] - Math.PI / 2, -this.speed);
        this.position[1] += pos.x;
        this.position[2] += pos.y;
      }
    }
  };
};
