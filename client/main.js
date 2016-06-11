'use strict';

Math.FloorExponential = n => n.toString().indexOf('e-') !== -1 ? 0 : n;
Math.trigX = (rads, vel) => Math.FloorExponential(Math.cos(rads) * vel);
Math.trigY = (rads, vel) => Math.FloorExponential(Math.sin(rads) * vel);

Array.prototype.add = function (val) {
  return this.includes(val) ? null : this.push(val);
};
Array.prototype.remove = function (val) {
  return this.includes(val) ? this.splice(this.indexOf(val), 1) : null;
};

const COLORS = {
  BLACK: '#000000',
  WHITE: '#ffffff',
  RED: '#ff0000'
};

const INPUT = (() => {
  const mouseButtons = ['MouseLeft', 'MouseMiddle', 'MouseRight'];
  let cursor = null;
  let pressed = [];
  document.onmousemove = disableEvent(e => cursor = e);
  document.onkeydown = disableEvent(e => pressed.add(e.code));
  document.onkeyup = disableEvent(e => pressed.remove(e.code));
  document.onmousedown = disableEvent(e => pressed.add(mouseButtons[e.which - 1]));
  document.onmouseup = disableEvent(e => pressed.remove(mouseButtons[e.which - 1]));
  return {
    calcCursorArc: (x = window.innerWidth / 2, y = window.innerHeight / 2) => !cursor ? null : Math.atan2(cursor.pageY - x, cursor.pageX - y),
    getCursor: () => !cursor ? null : {
      x: cursor.pageX,
      y: cursor.pageY,
      v: (Math.abs(cursor.movementX) + Math.abs(cursor.movementY) / 2)
    },
    getPressed: () => pressed
  };
})();

const screen = buildScreen(document.getElementById('screen'));
const display = buildDisplay(screen, document.getElementById('output'));

const tick = setInterval(() => {
  const cursor = INPUT.getCursor();
  display.renderOutput();
  screen.clear();
  if (cursor) {
    screen.pan(cursor.x, cursor.y);
    screen.renderCircle(cursor.x, cursor.y, Math.max(5, cursor.v));
  }
  screen.renderText(window.innerWidth / 2, window.innerHeight / 2, 0, 'The Center', COLORS.RED);
}, 10);

function buildScreen(canvas) {
  const ctx = canvas.getContext('2d');
  let offset = {x: 0, y: 0};
  return {
    pan: (x, y) => Object.assign(offset, {x, y}),
    resize: (width, height) => Object.assign(canvas, {width, height}),
    clear: render.bind(null, () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.BLACK;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }),
    renderText: render.bind(null, (x, y, angle, t, c = COLORS.WHITE) => {
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.fillStyle = c;
      ctx.translate(x - offset.x + canvas.width / 2, y - offset.y + canvas.height / 2);
      ctx.rotate(angle);
      ctx.fillText(t, 0, 0);
    }),
    renderCircle: render.bind(null, (x, y, radius, c = COLORS.WHITE) => {
      ctx.beginPath();
      ctx.arc(x - offset.x + canvas.width / 2, y - offset.y + canvas.height / 2, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = c;
      ctx.stroke();
    })
  };

  function render(cb) {
    ctx.save();
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
    ctx.restore();
  }
}

function buildDisplay(screen, output) {
  document.oncontextmenu = disableEvent();
  document.onselectstart = disableEvent();
  window.onresize = e => screen.resize(window.innerWidth, window.innerHeight);
  screen.resize(window.innerWidth, window.innerHeight);
  return {
    renderOutput: () => {
      output.style.display = INPUT.getPressed().includes('Tab') ? 'block' : 'none';
      output.innerText = JSON.stringify({
        pressed: INPUT.getPressed(),
        arc: INPUT.calcCursorArc()
      }, null, 2);
    }
  };
}

function disableEvent(cb = () => false) {
  return e => (e.key !== 'Meta') && (e.preventDefault() || cb(e) || false);
}
