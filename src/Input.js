import {overrideEvent} from './utils';


const actions = {
  turn: (direction, target) => {
    target._rot += direction;
  }
};

const bindings = {
  keydown: [
    [['KeyA'], player => player.addAction(actions.turnLeft)],
    [['KeyD'], player => player.addAction(actions.turnRight)],
  ],
  keyup: [
    [['KeyA'], player => player.removeAction(actions.turnLeft)],
    [['KeyD'], player => player.removeAction(actions.turnRight)],
  ],
  onkeydown: {},
  onkeyup: {}
};

export default class Input {
  constructor(player) {
    this._player = player;

    ['keyup', 'keydown'].forEach(keyState => {
      const event = `on${keyState}`;
      bindings[keyState].forEach(([keys, cb]) => keys.forEach(key => bindings[event][key] = cb));
      window[event] = overrideEvent(e => {
        const cb = bindings[event][e.code];
        if (cb) {
          cb(this._player);
        }
      });
    });

    const lockChangeAlert = () => {
      if (document.pointerLockElement === document.body || document.mozPointerLockElement === document.body) {
        document.addEventListener("mousemove", this._mousemove.bind(this), false);
      } else {
        document.removeEventListener("mousemove", this._mousemove.bind(this), false);
      }
    };

    document.body.onclick = () => document.body.requestPointerLock();
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
  }

  /**
   * @param {MouseEvent} e
   * @private
   */
  _mousemove(e) {
    console.log(e);
    this._player.addAction(actions.turn.bind(actions.turn, e.movementX));
  }
}
