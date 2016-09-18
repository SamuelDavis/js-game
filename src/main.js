import Game from './Game';
import Input from './Input';
import _ from 'lodash/fp';

const DIRECTIONS = {
  UP: -1,
  RIGHT: 1,
  DOWN: 1,
  LEFT: -1
};

function MovingUp() {
  this.y += this.getSpeed() * DIRECTIONS.UP;
}
function MovingRight() {
  this.x += this.getSpeed() * DIRECTIONS.RIGHT;
}
function MovingDown() {
  this.y += this.getSpeed() * DIRECTIONS.DOWN;
}
function MovingLeft() {
  this.x += this.getSpeed() * DIRECTIONS.LEFT;
}
function Rolling() {
}
Rolling.onAdd = function () {
  setTimeout(() => {
    this.addCondition(Staggering);
    this.removeCondition(Rolling);
  }, 100);
};
function Staggering() {
}
Staggering.onAdd = function () {
  setTimeout(() => this.removeCondition(Staggering), 100);
};

class Actor {
  constructor({x, y, speed, conditions} = {x: 0, y: 0, speed: 1, conditions: {}}) {
    this.speed = speed;
    this.y = y;
    this.x = x;
    this.conditions = conditions;
  }

  getSpeed() {
    let speed = this.speed;
    if (this.hasCondition(Rolling)) {
      speed += 1;
    }
    if (this.hasCondition(Staggering)) {
      speed -= 1;
    }
    return Math.max(0, speed);
  }

  hasCondition(condition) {
    return this.conditions.hasOwnProperty(condition.name);
  }

  addCondition(condition) {
    if (!this.hasCondition(condition)) {
      this.conditions[condition.name] = condition;
      if (condition.onAdd) {
        condition.onAdd.call(this);
      }
    }
  }

  removeCondition(condition) {
    if (this.hasCondition(condition)) {
      delete this.conditions[condition.name];
    }
  }

  update() {
    _.each(condition => condition.call(this), this.conditions);
    console.log([this.x, this.y]);
  }
}

class Player {
  constructor(input) {
    this.input = input;
    this.actor = null;
  }

  setActor(actor) {
    this.actor = actor;
    this.input.toggleConditionBinding('KeyW', MovingUp, this.actor);
    this.input.toggleConditionBinding('KeyD', MovingRight, this.actor);
    this.input.toggleConditionBinding('KeyS', MovingDown, this.actor);
    this.input.toggleConditionBinding('KeyA', MovingLeft, this.actor);
    this.input.downBinding('Space', Rolling, this.actor);
    return this;
  }
}

const player = new Player(new Input());

const game = new Game([
  player.setActor(new Actor()).actor
]);

game.start();
