'use strict';

Math.TrigX = (rads, vel) => Math.FloorExponential(Math.cos(rads) * vel);
Math.TrigY = (rads, vel) => Math.FloorExponential(Math.sin(rads) * vel);

module.exports = {
  stepForward
};

function stepForward(rads, vel = 1, start = {x: 0, y: 0}) {
  return {
    x: start.x + floorExponential(Math.cos(rads) * vel),
    y: start.y + floorExponential(Math.sin(rads) * vel)
  }
}

function floorExponential(n) {
  return n.toString().indexOf('e-') !== -1 ? 0 : n;
}
