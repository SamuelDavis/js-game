import {overrideEvent} from './utils';

function move(speed, angle) {
  this.x += speed * Math.cos(angle);
  this.y += speed * Math.sin(angle);
}

const actions = {
  moveForward: function () {
    move.call(this, this.speed, this.angle);
  },
  moveRight: function () {
    move.call(this, this.speed * 0.5, this.angle + Math.PI * 0.5);
  },
  moveBackward: function () {
    move.call(this, this.speed * 0.5, this.angle - Math.PI);
  },
  moveLeft: function () {
    move.call(this, this.speed * 0.5, this.angle - Math.PI * 0.5);
  },
  roll: function () {
    this.removeAction(actions.roll);
    const speed = this.speed;
    this.speed += speed;
    setTimeout(() => this.speed -= speed, this.getRollTime());
  },
  turn: function (angle) {
    this.angle = angle;
  }
};

const bindings = {
  keydown: [
    [['KeyD'], player => player.addAction(actions.moveForward)],
    [['KeyW'], player => player.addAction(actions.moveLeft)],
    [['KeyA'], player => player.addAction(actions.moveBackward)],
    [['KeyS'], player => player.addAction(actions.moveRight)],
    [['Space'], player => player.addAction(actions.roll)],
  ],
  keyup: [
    [['KeyD'], player => player.removeAction(actions.moveForward)],
    [['KeyW'], player => player.removeAction(actions.moveLeft)],
    [['KeyA'], player => player.removeAction(actions.moveBackward)],
    [['KeyS'], player => player.removeAction(actions.moveRight)],
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

    document.addEventListener("mousemove", this._mousemove.bind(this), false);
    // document.body.onclick = () => document.body.requestPointerLock();
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
  }

  /**
   * @param {MouseEvent} e
   * @private
   */
  _mousemove(e) {
    const angle = Math.atan2(this._player.y - e.clientY, this._player.x - e.clientX) - Math.PI;
    this._player.addAction(actions.turn.bind(this._player, angle));
  }
}
