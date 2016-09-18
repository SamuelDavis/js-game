import _ from 'lodash/fp';

export default class Input {
  constructor() {
    this.pressed = [];
    this.nextInputResolution = null;
    window.addEventListener('keydown', _.flow(Input.parseKeyEvent, this.keyDown.bind(this)));
    window.addEventListener('keyup', _.flow(Input.parseKeyEvent, this.keyUp.bind(this)));
  }

  keyDown(code) {
    if (!code) {
      return this;
    }
    if (!this.pressed.includes(code)) {
      this.pressed.push(code);
    }
    if (this.nextInputResolution) {
      this.nextInputResolution(this.pressed);
      this.nextInputResolution = null;
    }
    return this;
  }

  keyUp(code) {
    this.pressed.splice(this.pressed.indexOf(code), 1);
    return this;
  }

  static parseKeyEvent({code}) {
    if (code.search(/(Tab|Alt|Control|Meta|Shift)/) > -1) {
      return false;
    }
    return code;
  }

  getNextInput() {
    return new Promise(resolve => this.nextInputResolution = resolve);
  }
}

