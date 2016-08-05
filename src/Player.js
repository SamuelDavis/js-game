export default class Player {
  constructor(x = 0, y = 0, rot = 0) {
    /**
     * @type {Function[]}
     * @private
     */
    this._actions = [];
    /**
     * @type {number[]}
     * @private
     */
    this._pos = [x, y];
    /**
     * @type {number}
     * @private
     */
    this._rot = rot;
    this.rotSpeed = 0.05;
  }

  addAction(action) {
    if (!this._actions.includes(action)) {
      this._actions.push(action);
    }
    return this;
  }

  removeAction(action) {
    const index = this._actions.indexOf(action);
    if (index >= 0) {
      this._actions.splice(index, 1);
    }
    return this;
  }

  getPos() {
    return this._pos;
  }

  getRot() {
    return this._rot;
  }

  update() {
    this._actions.forEach(action => action(this));
  }
}
