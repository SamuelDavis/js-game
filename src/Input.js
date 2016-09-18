import _ from 'lodash/fp';

export default class Input {
  constructor() {
    this.pressed = [];
    this.keyDownBindings = {};
    this.keyUpBindings = {};
    window.addEventListener('keydown', _.flow(Input.parseKeyEvent, this.keyDown.bind(this)));
    window.addEventListener('keyup', _.flow(Input.parseKeyEvent, this.keyUp.bind(this)));
  }

  toggleConditionBinding(key, condition, actor) {
    this.downBinding(key, condition, actor);
    this.upBinding(key, condition, actor);
  }

  downBinding(key, condition, actor) {
    this.keyDownBindings[key] = actor.addCondition.bind(actor, condition);
  }

  upBinding(key, condition, actor) {
    this.keyUpBindings[key] = actor.removeCondition.bind(actor, condition);
  }

  keyDown(code) {
    if (!code) {
      return this;
    }
    if (!this.pressed.includes(code)) {
      this.pressed.push(code);
    }
    if (this.keyDownBindings.hasOwnProperty(code)) {
      this.keyDownBindings[code]();
    }
    return this;
  }

  keyUp(code) {
    this.pressed.splice(this.pressed.indexOf(code), 1);
    if (this.keyUpBindings.hasOwnProperty(code)) {
      this.keyUpBindings[code]();
    }
    return this;
  }

  static parseKeyEvent({code}) {
    if (code.search(/(Tab|Alt|Control|Meta|Shift)/) > -1) {
      return false;
    }
    return code;
  }
}

