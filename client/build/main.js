(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Math.FloorExponential = n => n.toString().indexOf('e-') !== -1 ? 0 : n;
Math.TrigX = (rads, vel) => Math.FloorExponential(Math.cos(rads) * vel);
Math.TrigY = (rads, vel) => Math.FloorExponential(Math.sin(rads) * vel);
Math.TrigAngleBetween = (x1, y1, x2, y2) => Math.atan2(x2 - x1, y2 - y1)
Math.HalfPI = Math.PI / 2;

Array.prototype.add = function (val) {
  return this.includes(val) ? null : this.push(val);
};
Array.prototype.remove = function (val) {
  return this.includes(val) ? this.splice(this.indexOf(val), 1) : null;
};

window.getHalfWidth = () => window.innerWidth / 2;
window.getHalfHeight = () => window.innerHeight / 2;

const COLORS = {
  BLACK: '#000000',
  WHITE: '#ffffff',
  RED: '#ff0000',
  GREEN: '#347C2C'
};

const INPUT = (() => {
  const mouseButtons = ['MouseLeft', 'MouseMiddle', 'MouseRight'];
  /**
   * @type {object}
   * @prop {int} movementX
   * @prop {int} movementY
   */
  let cursor = {pageX: window.getHalfWidth(), pageY: window.getHalfHeight(), movementX: 0, movementY: 0};
  let pressed = [];
  window.onblur = e => pressed = [];
  document.onmousemove = overrideEvent(e => cursor = e);
  document.onkeydown = overrideEvent(e => pressed.add(e.code));
  document.onkeyup = overrideEvent(e => pressed.remove(e.code));
  document.onmousedown = overrideEvent(e => pressed.add(mouseButtons[e.which - 1]));
  document.onmouseup = overrideEvent(e => pressed.remove(mouseButtons[e.which - 1]));
  return {
    calcCursorAngle: (x = window.getHalfWidth(), y = window.getHalfHeight()) => !cursor ? null : Math.TrigAngleBetween(x, y, cursor.pageX, cursor.pageY),
    getCursor: () => !cursor ? null : {
      x: cursor.pageX,
      y: cursor.pageY,
      v: (Math.abs(cursor.movementX) + Math.abs(cursor.movementY) / 2)
    },
    getPressed: () => pressed,
    getKeys: () => {
      return {
        WALK_FORWARD: 'KeyW',
        WALK_RIGHT: 'KeyD',
        WALK_BACKWARD: 'KeyS',
        WALK_LEFT: 'KeyA',
        META: 'Meta',
        SHOW_OUTPUT: 'Tab'
      }
    }
  };
})();

const screen = buildScreen(document.getElementById('screen'));
const display = buildDisplay(screen, document.getElementById('output'));
const player = buildActor({speed: 3});
const actors = [];
for (let i = 0; i < 5; i++) {
  actors.push(buildActor({x: Math.random() * 100 + 1, y: Math.random() * 100 + 1, speed: Math.random() * 2 + 1}))
}
update();
render();

function update() {
  const startTime = new Date();
  const pressed = INPUT.getPressed();
  player.a = -INPUT.calcCursorAngle(player.x, player.y);
  if (pressed.includes(INPUT.getKeys().WALK_FORWARD)) {
    player.moveForward();
  }
  if (pressed.includes(INPUT.getKeys().WALK_RIGHT)) {
    player.moveRight();
  }
  if (pressed.includes(INPUT.getKeys().WALK_BACKWARD)) {
    player.moveBackward();
  }
  if (pressed.includes(INPUT.getKeys().WALK_LEFT)) {
    player.moveLeft();
  }
  actors.forEach(actor => {
    actor.a = -Math.TrigAngleBetween(actor.x, actor.y, player.x, player.y);
    actor.moveForward();
  });
  setTimeout(update, Math.min(0, 1000 / 100 - (new Date() - startTime)));
}

function render() {
  const startTime = new Date();
  const cursor = INPUT.getCursor();
  display.renderOutput();
  screen.clear();
  screen.renderCircle(cursor.x, cursor.y, Math.max(5, cursor.v));
  screen.renderText(window.getHalfWidth(), window.getHalfHeight(), 0, 'The Center', COLORS.RED);
  screen.renderText(player.x, player.y, player.a + Math.PI, '^');
  screen.renderText(100, 100, 0, 'A');
  screen.renderText(100, 200, 0, 'B');
  screen.renderText(200, 100, 0, 'C');
  screen.renderText(200, 200, 0, 'D');
  actors.forEach(actor => screen.renderText(actor.x, actor.y, actor.a + Math.PI, '^', COLORS.GREEN));
  setTimeout(render, Math.min(0, 1000 / 60 - (new Date() - startTime)));
}

function buildScreen(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    resize: (width, height) => Object.assign(canvas, {width, height}),
    clear: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.BLACK;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    renderText: render.bind(null, (x, y, angle, t, c = COLORS.WHITE) => {
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = c;
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(t, 0, 0);
    }),
    renderCircle: render.bind(null, (x, y, radius, c = COLORS.WHITE) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
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
  document.oncontextmenu = overrideEvent();
  document.onselectstart = overrideEvent();
  window.onresize = e => screen.resize(window.innerWidth, window.innerHeight);
  screen.resize(window.innerWidth, window.innerHeight);
  return {
    renderOutput: () => {
      output.style.display = INPUT.getPressed().includes(INPUT.getKeys().SHOW_OUTPUT) ? 'block' : 'none';
      output.innerText = JSON.stringify({
        pressed: INPUT.getPressed(),
        arc: INPUT.calcCursorAngle(),
        cursor: INPUT.getCursor(),
        player
      }, null, 2);
    }
  };
}

function overrideEvent(cb = () => false) {
  return e => (e.key !== INPUT.getKeys().META) && (e.preventDefault() || cb(e) || false);
}

function buildActor(attributes) {
  const actor = Object.assign({x: 0, y: 0, a: 0, speed: 1}, attributes);
  const actions = {
    moveForward: () => {
      actor.x += Math.TrigX(actor.a - Math.HalfPI, -actor.speed);
      actor.y += Math.TrigY(actor.a - Math.HalfPI, -actor.speed);
    },
    moveRight: () => {
      actor.x += Math.TrigX(actor.a, -actor.speed);
      actor.y += Math.TrigY(actor.a, -actor.speed);
    },
    moveBackward: () => {
      actor.x += Math.TrigX(actor.a - Math.HalfPI, actor.speed);
      actor.y += Math.TrigY(actor.a - Math.HalfPI, actor.speed);
    },
    moveLeft: () => {
      actor.x += Math.TrigX(actor.a, actor.speed);
      actor.y += Math.TrigY(actor.a, actor.speed);
    }
  };

  return Object.assign(actor, actions);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5NYXRoLkZsb29yRXhwb25lbnRpYWwgPSBuID0+IG4udG9TdHJpbmcoKS5pbmRleE9mKCdlLScpICE9PSAtMSA/IDAgOiBuO1xuTWF0aC5UcmlnWCA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLmNvcyhyYWRzKSAqIHZlbCk7XG5NYXRoLlRyaWdZID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguc2luKHJhZHMpICogdmVsKTtcbk1hdGguVHJpZ0FuZ2xlQmV0d2VlbiA9ICh4MSwgeTEsIHgyLCB5MikgPT4gTWF0aC5hdGFuMih4MiAtIHgxLCB5MiAtIHkxKVxuTWF0aC5IYWxmUEkgPSBNYXRoLlBJIC8gMjtcblxuQXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IG51bGwgOiB0aGlzLnB1c2godmFsKTtcbn07XG5BcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gdGhpcy5zcGxpY2UodGhpcy5pbmRleE9mKHZhbCksIDEpIDogbnVsbDtcbn07XG5cbndpbmRvdy5nZXRIYWxmV2lkdGggPSAoKSA9PiB3aW5kb3cuaW5uZXJXaWR0aCAvIDI7XG53aW5kb3cuZ2V0SGFsZkhlaWdodCA9ICgpID0+IHdpbmRvdy5pbm5lckhlaWdodCAvIDI7XG5cbmNvbnN0IENPTE9SUyA9IHtcbiAgQkxBQ0s6ICcjMDAwMDAwJyxcbiAgV0hJVEU6ICcjZmZmZmZmJyxcbiAgUkVEOiAnI2ZmMDAwMCcsXG4gIEdSRUVOOiAnIzM0N0MyQydcbn07XG5cbmNvbnN0IElOUFVUID0gKCgpID0+IHtcbiAgY29uc3QgbW91c2VCdXR0b25zID0gWydNb3VzZUxlZnQnLCAnTW91c2VNaWRkbGUnLCAnTW91c2VSaWdodCddO1xuICAvKipcbiAgICogQHR5cGUge29iamVjdH1cbiAgICogQHByb3Age2ludH0gbW92ZW1lbnRYXG4gICAqIEBwcm9wIHtpbnR9IG1vdmVtZW50WVxuICAgKi9cbiAgbGV0IGN1cnNvciA9IHtwYWdlWDogd2luZG93LmdldEhhbGZXaWR0aCgpLCBwYWdlWTogd2luZG93LmdldEhhbGZIZWlnaHQoKSwgbW92ZW1lbnRYOiAwLCBtb3ZlbWVudFk6IDB9O1xuICBsZXQgcHJlc3NlZCA9IFtdO1xuICB3aW5kb3cub25ibHVyID0gZSA9PiBwcmVzc2VkID0gW107XG4gIGRvY3VtZW50Lm9ubW91c2Vtb3ZlID0gb3ZlcnJpZGVFdmVudChlID0+IGN1cnNvciA9IGUpO1xuICBkb2N1bWVudC5vbmtleWRvd24gPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ua2V5dXAgPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5yZW1vdmUoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ubW91c2Vkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgZG9jdW1lbnQub25tb3VzZXVwID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQucmVtb3ZlKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgcmV0dXJuIHtcbiAgICBjYWxjQ3Vyc29yQW5nbGU6ICh4ID0gd2luZG93LmdldEhhbGZXaWR0aCgpLCB5ID0gd2luZG93LmdldEhhbGZIZWlnaHQoKSkgPT4gIWN1cnNvciA/IG51bGwgOiBNYXRoLlRyaWdBbmdsZUJldHdlZW4oeCwgeSwgY3Vyc29yLnBhZ2VYLCBjdXJzb3IucGFnZVkpLFxuICAgIGdldEN1cnNvcjogKCkgPT4gIWN1cnNvciA/IG51bGwgOiB7XG4gICAgICB4OiBjdXJzb3IucGFnZVgsXG4gICAgICB5OiBjdXJzb3IucGFnZVksXG4gICAgICB2OiAoTWF0aC5hYnMoY3Vyc29yLm1vdmVtZW50WCkgKyBNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRZKSAvIDIpXG4gICAgfSxcbiAgICBnZXRQcmVzc2VkOiAoKSA9PiBwcmVzc2VkLFxuICAgIGdldEtleXM6ICgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFdBTEtfRk9SV0FSRDogJ0tleVcnLFxuICAgICAgICBXQUxLX1JJR0hUOiAnS2V5RCcsXG4gICAgICAgIFdBTEtfQkFDS1dBUkQ6ICdLZXlTJyxcbiAgICAgICAgV0FMS19MRUZUOiAnS2V5QScsXG4gICAgICAgIE1FVEE6ICdNZXRhJyxcbiAgICAgICAgU0hPV19PVVRQVVQ6ICdUYWInXG4gICAgICB9XG4gICAgfVxuICB9O1xufSkoKTtcblxuY29uc3Qgc2NyZWVuID0gYnVpbGRTY3JlZW4oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmVlbicpKTtcbmNvbnN0IGRpc3BsYXkgPSBidWlsZERpc3BsYXkoc2NyZWVuLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3V0cHV0JykpO1xuY29uc3QgcGxheWVyID0gYnVpbGRBY3Rvcih7c3BlZWQ6IDN9KTtcbmNvbnN0IGFjdG9ycyA9IFtdO1xuZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcbiAgYWN0b3JzLnB1c2goYnVpbGRBY3Rvcih7eDogTWF0aC5yYW5kb20oKSAqIDEwMCArIDEsIHk6IE1hdGgucmFuZG9tKCkgKiAxMDAgKyAxLCBzcGVlZDogTWF0aC5yYW5kb20oKSAqIDIgKyAxfSkpXG59XG51cGRhdGUoKTtcbnJlbmRlcigpO1xuXG5mdW5jdGlvbiB1cGRhdGUoKSB7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IHByZXNzZWQgPSBJTlBVVC5nZXRQcmVzc2VkKCk7XG4gIHBsYXllci5hID0gLUlOUFVULmNhbGNDdXJzb3JBbmdsZShwbGF5ZXIueCwgcGxheWVyLnkpO1xuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19GT1JXQVJEKSkge1xuICAgIHBsYXllci5tb3ZlRm9yd2FyZCgpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5XQUxLX1JJR0hUKSkge1xuICAgIHBsYXllci5tb3ZlUmlnaHQoKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19CQUNLV0FSRCkpIHtcbiAgICBwbGF5ZXIubW92ZUJhY2t3YXJkKCk7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfTEVGVCkpIHtcbiAgICBwbGF5ZXIubW92ZUxlZnQoKTtcbiAgfVxuICBhY3RvcnMuZm9yRWFjaChhY3RvciA9PiB7XG4gICAgYWN0b3IuYSA9IC1NYXRoLlRyaWdBbmdsZUJldHdlZW4oYWN0b3IueCwgYWN0b3IueSwgcGxheWVyLngsIHBsYXllci55KTtcbiAgICBhY3Rvci5tb3ZlRm9yd2FyZCgpO1xuICB9KTtcbiAgc2V0VGltZW91dCh1cGRhdGUsIE1hdGgubWluKDAsIDEwMDAgLyAxMDAgLSAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkpKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICBjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBjdXJzb3IgPSBJTlBVVC5nZXRDdXJzb3IoKTtcbiAgZGlzcGxheS5yZW5kZXJPdXRwdXQoKTtcbiAgc2NyZWVuLmNsZWFyKCk7XG4gIHNjcmVlbi5yZW5kZXJDaXJjbGUoY3Vyc29yLngsIGN1cnNvci55LCBNYXRoLm1heCg1LCBjdXJzb3IudikpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCh3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCksIDAsICdUaGUgQ2VudGVyJywgQ09MT1JTLlJFRCk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KHBsYXllci54LCBwbGF5ZXIueSwgcGxheWVyLmEgKyBNYXRoLlBJLCAnXicpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgxMDAsIDEwMCwgMCwgJ0EnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMTAwLCAyMDAsIDAsICdCJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDIwMCwgMTAwLCAwLCAnQycpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgyMDAsIDIwMCwgMCwgJ0QnKTtcbiAgYWN0b3JzLmZvckVhY2goYWN0b3IgPT4gc2NyZWVuLnJlbmRlclRleHQoYWN0b3IueCwgYWN0b3IueSwgYWN0b3IuYSArIE1hdGguUEksICdeJywgQ09MT1JTLkdSRUVOKSk7XG4gIHNldFRpbWVvdXQocmVuZGVyLCBNYXRoLm1pbigwLCAxMDAwIC8gNjAgLSAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkpKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRTY3JlZW4oY2FudmFzKSB7XG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICByZXR1cm4ge1xuICAgIHJlc2l6ZTogKHdpZHRoLCBoZWlnaHQpID0+IE9iamVjdC5hc3NpZ24oY2FudmFzLCB7d2lkdGgsIGhlaWdodH0pLFxuICAgIGNsZWFyOiAoKSA9PiB7XG4gICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICBjdHguZmlsbFN0eWxlID0gQ09MT1JTLkJMQUNLO1xuICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfSxcbiAgICByZW5kZXJUZXh0OiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgYW5nbGUsIHQsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBjO1xuICAgICAgY3R4LnRyYW5zbGF0ZSh4LCB5KTtcbiAgICAgIGN0eC5yb3RhdGUoYW5nbGUpO1xuICAgICAgY3R4LmZpbGxUZXh0KHQsIDAsIDApO1xuICAgIH0pLFxuICAgIHJlbmRlckNpcmNsZTogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIHJhZGl1cywgYyA9IENPTE9SUy5XSElURSkgPT4ge1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LmFyYyh4LCB5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGM7XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSlcbiAgfTtcblxuICBmdW5jdGlvbiByZW5kZXIoY2IpIHtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGNiLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGREaXNwbGF5KHNjcmVlbiwgb3V0cHV0KSB7XG4gIGRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBvdmVycmlkZUV2ZW50KCk7XG4gIGRvY3VtZW50Lm9uc2VsZWN0c3RhcnQgPSBvdmVycmlkZUV2ZW50KCk7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IGUgPT4gc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgcmV0dXJuIHtcbiAgICByZW5kZXJPdXRwdXQ6ICgpID0+IHtcbiAgICAgIG91dHB1dC5zdHlsZS5kaXNwbGF5ID0gSU5QVVQuZ2V0UHJlc3NlZCgpLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5TSE9XX09VVFBVVCkgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgb3V0cHV0LmlubmVyVGV4dCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcHJlc3NlZDogSU5QVVQuZ2V0UHJlc3NlZCgpLFxuICAgICAgICBhcmM6IElOUFVULmNhbGNDdXJzb3JBbmdsZSgpLFxuICAgICAgICBjdXJzb3I6IElOUFVULmdldEN1cnNvcigpLFxuICAgICAgICBwbGF5ZXJcbiAgICAgIH0sIG51bGwsIDIpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVFdmVudChjYiA9ICgpID0+IGZhbHNlKSB7XG4gIHJldHVybiBlID0+IChlLmtleSAhPT0gSU5QVVQuZ2V0S2V5cygpLk1FVEEpICYmIChlLnByZXZlbnREZWZhdWx0KCkgfHwgY2IoZSkgfHwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBidWlsZEFjdG9yKGF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgYWN0b3IgPSBPYmplY3QuYXNzaWduKHt4OiAwLCB5OiAwLCBhOiAwLCBzcGVlZDogMX0sIGF0dHJpYnV0ZXMpO1xuICBjb25zdCBhY3Rpb25zID0ge1xuICAgIG1vdmVGb3J3YXJkOiAoKSA9PiB7XG4gICAgICBhY3Rvci54ICs9IE1hdGguVHJpZ1goYWN0b3IuYSAtIE1hdGguSGFsZlBJLCAtYWN0b3Iuc3BlZWQpO1xuICAgICAgYWN0b3IueSArPSBNYXRoLlRyaWdZKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgLWFjdG9yLnNwZWVkKTtcbiAgICB9LFxuICAgIG1vdmVSaWdodDogKCkgPT4ge1xuICAgICAgYWN0b3IueCArPSBNYXRoLlRyaWdYKGFjdG9yLmEsIC1hY3Rvci5zcGVlZCk7XG4gICAgICBhY3Rvci55ICs9IE1hdGguVHJpZ1koYWN0b3IuYSwgLWFjdG9yLnNwZWVkKTtcbiAgICB9LFxuICAgIG1vdmVCYWNrd2FyZDogKCkgPT4ge1xuICAgICAgYWN0b3IueCArPSBNYXRoLlRyaWdYKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgYWN0b3Iuc3BlZWQpO1xuICAgICAgYWN0b3IueSArPSBNYXRoLlRyaWdZKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgYWN0b3Iuc3BlZWQpO1xuICAgIH0sXG4gICAgbW92ZUxlZnQ6ICgpID0+IHtcbiAgICAgIGFjdG9yLnggKz0gTWF0aC5UcmlnWChhY3Rvci5hLCBhY3Rvci5zcGVlZCk7XG4gICAgICBhY3Rvci55ICs9IE1hdGguVHJpZ1koYWN0b3IuYSwgYWN0b3Iuc3BlZWQpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihhY3RvciwgYWN0aW9ucyk7XG59XG4iXX0=
