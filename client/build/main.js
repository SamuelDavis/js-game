(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

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
  actors.concat(player).forEach(actor => {
    actors.concat(player).forEach(resolveActorCollision.bind(null, actor));
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

function resolveActorCollision(actor, check) {
  const origA = actor.a;
  while (actor !== check && Math.TrigDistBetween(actor.x, actor.y, check.x, check.y) < 5) {
    actor.a = -Math.TrigAngleBetween(actor.x, actor.y, check.x, check.y);
    actor.moveBackward();
  }
  actor.a = origA;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbk1hdGguRmxvb3JFeHBvbmVudGlhbCA9IG4gPT4gbi50b1N0cmluZygpLmluZGV4T2YoJ2UtJykgIT09IC0xID8gMCA6IG47XG5NYXRoLlRyaWdYID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguY29zKHJhZHMpICogdmVsKTtcbk1hdGguVHJpZ1kgPSAocmFkcywgdmVsKSA9PiBNYXRoLkZsb29yRXhwb25lbnRpYWwoTWF0aC5zaW4ocmFkcykgKiB2ZWwpO1xuTWF0aC5UcmlnRGlzdEJldHdlZW4gPSAoeDEsIHkxLCB4MiwgeTIpID0+IE1hdGguc3FydChNYXRoLnBvdyh4MSAtIHgyLCAyKSArIE1hdGgucG93KHkxIC0geTIsIDIpKTtcbk1hdGguVHJpZ0FuZ2xlQmV0d2VlbiA9ICh4MSwgeTEsIHgyLCB5MikgPT4gTWF0aC5hdGFuMih4MiAtIHgxLCB5MiAtIHkxKTtcbk1hdGguSGFsZlBJID0gTWF0aC5QSSAvIDI7XG5cbkFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiB0aGlzLmluY2x1ZGVzKHZhbCkgPyBudWxsIDogdGhpcy5wdXNoKHZhbCk7XG59O1xuQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IHRoaXMuc3BsaWNlKHRoaXMuaW5kZXhPZih2YWwpLCAxKSA6IG51bGw7XG59O1xuXG53aW5kb3cuZ2V0SGFsZldpZHRoID0gKCkgPT4gd2luZG93LmlubmVyV2lkdGggLyAyO1xud2luZG93LmdldEhhbGZIZWlnaHQgPSAoKSA9PiB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyO1xuXG5jb25zdCBDT0xPUlMgPSB7XG4gIEJMQUNLOiAnIzAwMDAwMCcsXG4gIFdISVRFOiAnI2ZmZmZmZicsXG4gIFJFRDogJyNmZjAwMDAnLFxuICBHUkVFTjogJyMzNDdDMkMnXG59O1xuXG5jb25zdCBJTlBVVCA9ICgoKSA9PiB7XG4gIGNvbnN0IG1vdXNlQnV0dG9ucyA9IFsnTW91c2VMZWZ0JywgJ01vdXNlTWlkZGxlJywgJ01vdXNlUmlnaHQnXTtcbiAgLyoqXG4gICAqIEB0eXBlIHtvYmplY3R9XG4gICAqIEBwcm9wIHtpbnR9IG1vdmVtZW50WFxuICAgKiBAcHJvcCB7aW50fSBtb3ZlbWVudFlcbiAgICovXG4gIGxldCBjdXJzb3IgPSB7cGFnZVg6IHdpbmRvdy5nZXRIYWxmV2lkdGgoKSwgcGFnZVk6IHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCksIG1vdmVtZW50WDogMCwgbW92ZW1lbnRZOiAwfTtcbiAgbGV0IHByZXNzZWQgPSBbXTtcbiAgd2luZG93Lm9uYmx1ciA9IGUgPT4gcHJlc3NlZCA9IFtdO1xuICBkb2N1bWVudC5vbm1vdXNlbW92ZSA9IG92ZXJyaWRlRXZlbnQoZSA9PiBjdXJzb3IgPSBlKTtcbiAgZG9jdW1lbnQub25rZXlkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKGUuY29kZSkpO1xuICBkb2N1bWVudC5vbmtleXVwID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQucmVtb3ZlKGUuY29kZSkpO1xuICBkb2N1bWVudC5vbm1vdXNlZG93biA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLmFkZChtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gIGRvY3VtZW50Lm9ubW91c2V1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gIHJldHVybiB7XG4gICAgY2FsY0N1cnNvckFuZ2xlOiAoeCA9IHdpbmRvdy5nZXRIYWxmV2lkdGgoKSwgeSA9IHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCkpID0+ICFjdXJzb3IgPyBudWxsIDogTWF0aC5UcmlnQW5nbGVCZXR3ZWVuKHgsIHksIGN1cnNvci5wYWdlWCwgY3Vyc29yLnBhZ2VZKSxcbiAgICBnZXRDdXJzb3I6ICgpID0+ICFjdXJzb3IgPyBudWxsIDoge1xuICAgICAgeDogY3Vyc29yLnBhZ2VYLFxuICAgICAgeTogY3Vyc29yLnBhZ2VZLFxuICAgICAgdjogKE1hdGguYWJzKGN1cnNvci5tb3ZlbWVudFgpICsgTWF0aC5hYnMoY3Vyc29yLm1vdmVtZW50WSkgLyAyKVxuICAgIH0sXG4gICAgZ2V0UHJlc3NlZDogKCkgPT4gcHJlc3NlZCxcbiAgICBnZXRLZXlzOiAoKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBXQUxLX0ZPUldBUkQ6ICdLZXlXJyxcbiAgICAgICAgV0FMS19SSUdIVDogJ0tleUQnLFxuICAgICAgICBXQUxLX0JBQ0tXQVJEOiAnS2V5UycsXG4gICAgICAgIFdBTEtfTEVGVDogJ0tleUEnLFxuICAgICAgICBNRVRBOiAnTWV0YScsXG4gICAgICAgIFNIT1dfT1VUUFVUOiAnVGFiJ1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0pKCk7XG5cbmNvbnN0IHNjcmVlbiA9IGJ1aWxkU2NyZWVuKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JlZW4nKSk7XG5jb25zdCBkaXNwbGF5ID0gYnVpbGREaXNwbGF5KHNjcmVlbiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ291dHB1dCcpKTtcbmNvbnN0IHBsYXllciA9IGJ1aWxkQWN0b3Ioe3NwZWVkOiAzfSk7XG5jb25zdCBhY3RvcnMgPSBbXTtcbmZvciAobGV0IGkgPSAwOyBpIDwgNTsgaSsrKSB7XG4gIGFjdG9ycy5wdXNoKGJ1aWxkQWN0b3Ioe3g6IE1hdGgucmFuZG9tKCkgKiAxMDAgKyAxLCB5OiBNYXRoLnJhbmRvbSgpICogMTAwICsgMSwgc3BlZWQ6IE1hdGgucmFuZG9tKCkgKiAyICsgMX0pKVxufVxudXBkYXRlKCk7XG5yZW5kZXIoKTtcblxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICBjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBwcmVzc2VkID0gSU5QVVQuZ2V0UHJlc3NlZCgpO1xuICBwbGF5ZXIuYSA9IC1JTlBVVC5jYWxjQ3Vyc29yQW5nbGUocGxheWVyLngsIHBsYXllci55KTtcbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfRk9SV0FSRCkpIHtcbiAgICBwbGF5ZXIubW92ZUZvcndhcmQoKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19SSUdIVCkpIHtcbiAgICBwbGF5ZXIubW92ZVJpZ2h0KCk7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfQkFDS1dBUkQpKSB7XG4gICAgcGxheWVyLm1vdmVCYWNrd2FyZCgpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5XQUxLX0xFRlQpKSB7XG4gICAgcGxheWVyLm1vdmVMZWZ0KCk7XG4gIH1cbiAgYWN0b3JzLmZvckVhY2goYWN0b3IgPT4ge1xuICAgIGFjdG9yLmEgPSAtTWF0aC5UcmlnQW5nbGVCZXR3ZWVuKGFjdG9yLngsIGFjdG9yLnksIHBsYXllci54LCBwbGF5ZXIueSk7XG4gICAgYWN0b3IubW92ZUZvcndhcmQoKTtcbiAgfSk7XG4gIGFjdG9ycy5jb25jYXQocGxheWVyKS5mb3JFYWNoKGFjdG9yID0+IHtcbiAgICBhY3RvcnMuY29uY2F0KHBsYXllcikuZm9yRWFjaChyZXNvbHZlQWN0b3JDb2xsaXNpb24uYmluZChudWxsLCBhY3RvcikpO1xuICB9KTtcbiAgc2V0VGltZW91dCh1cGRhdGUsIE1hdGgubWluKDAsIDEwMDAgLyAxMDAgLSAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkpKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICBjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBjdXJzb3IgPSBJTlBVVC5nZXRDdXJzb3IoKTtcbiAgZGlzcGxheS5yZW5kZXJPdXRwdXQoKTtcbiAgc2NyZWVuLmNsZWFyKCk7XG4gIHNjcmVlbi5yZW5kZXJDaXJjbGUoY3Vyc29yLngsIGN1cnNvci55LCBNYXRoLm1heCg1LCBjdXJzb3IudikpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCh3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCksIDAsICdUaGUgQ2VudGVyJywgQ09MT1JTLlJFRCk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KHBsYXllci54LCBwbGF5ZXIueSwgcGxheWVyLmEgKyBNYXRoLlBJLCAnXicpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgxMDAsIDEwMCwgMCwgJ0EnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMTAwLCAyMDAsIDAsICdCJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDIwMCwgMTAwLCAwLCAnQycpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgyMDAsIDIwMCwgMCwgJ0QnKTtcbiAgYWN0b3JzLmZvckVhY2goYWN0b3IgPT4gc2NyZWVuLnJlbmRlclRleHQoYWN0b3IueCwgYWN0b3IueSwgYWN0b3IuYSArIE1hdGguUEksICdeJywgQ09MT1JTLkdSRUVOKSk7XG4gIHNldFRpbWVvdXQocmVuZGVyLCBNYXRoLm1pbigwLCAxMDAwIC8gNjAgLSAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkpKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRTY3JlZW4oY2FudmFzKSB7XG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICByZXR1cm4ge1xuICAgIHJlc2l6ZTogKHdpZHRoLCBoZWlnaHQpID0+IE9iamVjdC5hc3NpZ24oY2FudmFzLCB7d2lkdGgsIGhlaWdodH0pLFxuICAgIGNsZWFyOiAoKSA9PiB7XG4gICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICBjdHguZmlsbFN0eWxlID0gQ09MT1JTLkJMQUNLO1xuICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfSxcbiAgICByZW5kZXJUZXh0OiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgYW5nbGUsIHQsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBjO1xuICAgICAgY3R4LnRyYW5zbGF0ZSh4LCB5KTtcbiAgICAgIGN0eC5yb3RhdGUoYW5nbGUpO1xuICAgICAgY3R4LmZpbGxUZXh0KHQsIDAsIDApO1xuICAgIH0pLFxuICAgIHJlbmRlckNpcmNsZTogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIHJhZGl1cywgYyA9IENPTE9SUy5XSElURSkgPT4ge1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LmFyYyh4LCB5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGM7XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSlcbiAgfTtcblxuICBmdW5jdGlvbiByZW5kZXIoY2IpIHtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGNiLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGREaXNwbGF5KHNjcmVlbiwgb3V0cHV0KSB7XG4gIGRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBvdmVycmlkZUV2ZW50KCk7XG4gIGRvY3VtZW50Lm9uc2VsZWN0c3RhcnQgPSBvdmVycmlkZUV2ZW50KCk7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IGUgPT4gc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgcmV0dXJuIHtcbiAgICByZW5kZXJPdXRwdXQ6ICgpID0+IHtcbiAgICAgIG91dHB1dC5zdHlsZS5kaXNwbGF5ID0gSU5QVVQuZ2V0UHJlc3NlZCgpLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5TSE9XX09VVFBVVCkgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgb3V0cHV0LmlubmVyVGV4dCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcHJlc3NlZDogSU5QVVQuZ2V0UHJlc3NlZCgpLFxuICAgICAgICBhcmM6IElOUFVULmNhbGNDdXJzb3JBbmdsZSgpLFxuICAgICAgICBjdXJzb3I6IElOUFVULmdldEN1cnNvcigpLFxuICAgICAgICBwbGF5ZXJcbiAgICAgIH0sIG51bGwsIDIpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVFdmVudChjYiA9ICgpID0+IGZhbHNlKSB7XG4gIHJldHVybiBlID0+IChlLmtleSAhPT0gSU5QVVQuZ2V0S2V5cygpLk1FVEEpICYmIChlLnByZXZlbnREZWZhdWx0KCkgfHwgY2IoZSkgfHwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBidWlsZEFjdG9yKGF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgYWN0b3IgPSBPYmplY3QuYXNzaWduKHt4OiAwLCB5OiAwLCBhOiAwLCBzcGVlZDogMX0sIGF0dHJpYnV0ZXMpO1xuICBjb25zdCBhY3Rpb25zID0ge1xuICAgIG1vdmVGb3J3YXJkOiAoKSA9PiB7XG4gICAgICBhY3Rvci54ICs9IE1hdGguVHJpZ1goYWN0b3IuYSAtIE1hdGguSGFsZlBJLCAtYWN0b3Iuc3BlZWQpO1xuICAgICAgYWN0b3IueSArPSBNYXRoLlRyaWdZKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgLWFjdG9yLnNwZWVkKTtcbiAgICB9LFxuICAgIG1vdmVSaWdodDogKCkgPT4ge1xuICAgICAgYWN0b3IueCArPSBNYXRoLlRyaWdYKGFjdG9yLmEsIC1hY3Rvci5zcGVlZCk7XG4gICAgICBhY3Rvci55ICs9IE1hdGguVHJpZ1koYWN0b3IuYSwgLWFjdG9yLnNwZWVkKTtcbiAgICB9LFxuICAgIG1vdmVCYWNrd2FyZDogKCkgPT4ge1xuICAgICAgYWN0b3IueCArPSBNYXRoLlRyaWdYKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgYWN0b3Iuc3BlZWQpO1xuICAgICAgYWN0b3IueSArPSBNYXRoLlRyaWdZKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgYWN0b3Iuc3BlZWQpO1xuICAgIH0sXG4gICAgbW92ZUxlZnQ6ICgpID0+IHtcbiAgICAgIGFjdG9yLnggKz0gTWF0aC5UcmlnWChhY3Rvci5hLCBhY3Rvci5zcGVlZCk7XG4gICAgICBhY3Rvci55ICs9IE1hdGguVHJpZ1koYWN0b3IuYSwgYWN0b3Iuc3BlZWQpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihhY3RvciwgYWN0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVBY3RvckNvbGxpc2lvbihhY3RvciwgY2hlY2spIHtcbiAgY29uc3Qgb3JpZ0EgPSBhY3Rvci5hO1xuICB3aGlsZSAoYWN0b3IgIT09IGNoZWNrICYmIE1hdGguVHJpZ0Rpc3RCZXR3ZWVuKGFjdG9yLngsIGFjdG9yLnksIGNoZWNrLngsIGNoZWNrLnkpIDwgNSkge1xuICAgIGFjdG9yLmEgPSAtTWF0aC5UcmlnQW5nbGVCZXR3ZWVuKGFjdG9yLngsIGFjdG9yLnksIGNoZWNrLngsIGNoZWNrLnkpO1xuICAgIGFjdG9yLm1vdmVCYWNrd2FyZCgpO1xuICB9XG4gIGFjdG9yLmEgPSBvcmlnQTtcbn1cbiJdfQ==
