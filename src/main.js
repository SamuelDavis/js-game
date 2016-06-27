'use strict';

const createjs = require('createjs-collection');

Math.FloorExponential = n => n.toString().indexOf('e-') !== -1 ? 0 : n;
Math.TrigX = (rads, vel) => Math.FloorExponential(Math.cos(rads) * vel);
Math.TrigY = (rads, vel) => Math.FloorExponential(Math.sin(rads) * vel);
Math.TrigAngleBetween = (x1, y1, x2, y2) => Math.atan2(x2 - x1, y2 - y1);
Math.HalfPI = Math.PI / 2;

let code = null;
let cursor = {pageX: 0, pageY: 0};
const screen = document.getElementById('screen');
window.onresize = e => {
  screen.width = window.innerWidth - 5;
  screen.height = window.innerHeight - 5;
};
window.onresize();
const stage = new createjs.Stage(screen);
window.onmousemove = e => {
  cursor = e;
  code = null;
}

const circle = new createjs.Shape();
circle.graphics
  .beginFill("DeepSkyBlue")
  .drawCircle(0, 0, 50);
circle.x = 100;
circle.y = 100;
stage.addChild(circle);

createjs.Ticker.setFPS(60);
createjs.Ticker.addEventListener("tick", stage);

document.onkeydown = e => {
  if (code === e.code) {
    return;
  }
  code = e.code;
  const dest = {x: circle.x, y: circle.y};
  switch (code) {
    case 'KeyW':
      dest.x += Math.TrigX(-calcCursorAngle(circle.x, circle.y) - Math.HalfPI, -1);
      dest.y += Math.TrigY(-calcCursorAngle(circle.x, circle.y) - Math.HalfPI, -1);
      break;
    case 'KeyA':
      dest.x += Math.TrigX(-calcCursorAngle(circle.x, circle.y), 1);
      dest.y += Math.TrigY(-calcCursorAngle(circle.x, circle.y), 1);
      break;
    case 'KeyS':
      dest.x += Math.TrigX(-calcCursorAngle(circle.x, circle.y) - Math.HalfPI, 1);
      dest.y += Math.TrigY(-calcCursorAngle(circle.x, circle.y) - Math.HalfPI, 1);
      break;
    case 'KeyD':
      dest.x += Math.TrigX(-calcCursorAngle(circle.x, circle.y), -1);
      dest.y += Math.TrigY(-calcCursorAngle(circle.x, circle.y), -1);
      break;
  }
  createjs.Tween.get(circle, {override: true}).to({
    x: cursor.pageX,
    y: cursor.pageY
  }, 1000);
};

function calcCursorAngle(x, y) {
  return Math.TrigAngleBetween(x, y, cursor.pageX, cursor.pageY);
}
