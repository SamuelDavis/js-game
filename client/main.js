'use strict';

Math.FloorExponential = n => n.toString().indexOf('e-') !== -1 ? 0 : n;
Math.trigX = (rads, vel) => Math.FloorExponential(Math.cos(rads) * vel);
Math.trigY = (rads, vel) => Math.FloorExponential(Math.sin(rads) * vel);

const input = (() => {
  let cursor = null;
  let pressed = [];
  document.onmousemove = evt => cursor = evt;
  document.onkeydown = e => pressed.includes(e.code) ? null : pressed.push(e.code);
  document.onkeyup = e => pressed.includes(e.code) ? pressed.splice(pressed.indexOf(e.code), 1) : null;
  return {
    calcCursorArc: (x = window.innerWidth / 2, y = window.innerHeight / 2) => cursor ? Math.atan2(cursor.pageY - x, cursor.pageX - y) : null,
    getPressed: () => pressed
  };
})();

const tick = setInterval(() => {
  document.getElementById('output').innerText = JSON.stringify({
    pressed: input.getPressed(),
    arc: input.calcCursorArc()
  }, null, 2);
}, 10);
