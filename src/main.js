'use strict';

Object.prototype.forOwn = function (cb) {
  let key;
  for (key in this) {
    if (this.hasOwnProperty(key) && cb(key, this[key], this) === false) {
      break;
    }
  }
  return this;
};

Object.prototype.keysToValues = function () {
  return this.forOwn((key, val, obj) => obj[key] = key);
};

Math.FloorExponential = n => n.toString().indexOf('e-') !== -1 ? 0 : n;
Math.TrigX = (rads, vel) => Math.FloorExponential(Math.cos(rads) * vel);
Math.TrigY = (rads, vel) => Math.FloorExponential(Math.sin(rads) * vel);
Math.TrigDistBetween = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
Math.TrigAngleBetween = (x1, y1, x2, y2) => Math.atan2(x2 - x1, y2 - y1);
Math.HalfPI = Math.PI / 2;

Array.prototype.add = function (val) {
  return this.includes(val) ? null : this.push(val);
};
Array.prototype.remove = function (val) {
  return this.includes(val) ? this.splice(this.indexOf(val), 1) : null;
};

window.getHalfWidth = () => window.innerWidth / 2;
window.getHalfHeight = () => window.innerHeight / 2;

const ui = require('./ui');
const app = require('./app');

const player = app.buildActor({speed: 3});
const actors = [];
for (let i = 0; i < 5; i++) {
  actors.push(app.buildActor({
    x: Math.random() * 100 + 1,
    y: Math.random() * 100 + 1,
    speed: Math.random() * 2 + 1,
    states: [app.ACTOR_STATES.WALK_FORWARD]
  }));
}

ui.INPUT.overrideEvents();
const screen = ui.buildScreen(document.getElementById('screen'));
const display = ui.buildDisplay(screen, document.getElementById('output'), {player});
ui.render(display, screen, player, actors);
app.update(player, actors);

