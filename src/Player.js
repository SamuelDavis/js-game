export default class Player {
  constructor(x = 0, y = 0, angle = 0, speed = 2) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.rollTime = 100;
    this._actions = [];
  }

  addAction(action) {
    if (!this._actions.includes(action)) {
      this._actions.push(action);
    }
    return this;
  }

  getRollTime() {
    return this.rollTime;
  }

  removeAction(action) {
    const index = this._actions.indexOf(action);
    if (index >= 0) {
      this._actions.splice(index, 1);
    }
    return this;
  }

  update() {
    this._actions.forEach(action => action.call(this));
  }
}
