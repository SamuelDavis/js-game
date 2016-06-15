(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

const ui = require('./ui');

module.exports = {
  update,
  buildActor,
  resolveActorCollision
};

function update(player, actors = []) {
  const startTime = new Date();
  const pressed = ui.INPUT.getPressed();
  player.a = -ui.INPUT.calcCursorAngle(player.x, player.y);
  if (pressed.includes(ui.INPUT.getKeys().WALK_FORWARD)) {
    player.moveForward();
  }
  if (pressed.includes(ui.INPUT.getKeys().WALK_RIGHT)) {
    player.moveRight();
  }
  if (pressed.includes(ui.INPUT.getKeys().WALK_BACKWARD)) {
    player.moveBackward();
  }
  if (pressed.includes(ui.INPUT.getKeys().WALK_LEFT)) {
    player.moveLeft();
  }
  actors.forEach(actor => {
    actor.a = -Math.TrigAngleBetween(actor.x, actor.y, player.x, player.y);
    actor.moveForward();
  });
  actors.concat(player).forEach(actor => {
    actors.concat(player).forEach(resolveActorCollision.bind(null, actor));
  });
  setTimeout(update.bind(this, player, actors), Math.min(0, 1000 / 100 - (new Date() - startTime)));
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

},{"./ui":3}],2:[function(require,module,exports){
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

const ui = require('./ui');
const app = require('./app');

const player = app.buildActor({speed: 3});
const actors = [];
for (let i = 0; i < 5; i++) {
  actors.push(app.buildActor({x: Math.random() * 100 + 1, y: Math.random() * 100 + 1, speed: Math.random() * 2 + 1}))
}

ui.INPUT.overrideEvents();
const screen = ui.buildScreen(document.getElementById('screen'));
const display = ui.buildDisplay(screen, document.getElementById('output'), {player});
ui.render(display, screen, player, actors);
app.update(player, actors);


},{"./app":1,"./ui":3}],3:[function(require,module,exports){
'use strict';

const INPUT = buildInput();
const COLORS = {
  BLACK: '#000000',
  WHITE: '#ffffff',
  RED: '#ff0000',
  GREEN: '#347C2C'
};

module.exports = {
  render,
  INPUT,
  buildScreen,
  buildDisplay
};

function render(display, screen, player, actors = []) {
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
  setTimeout(render.bind(this, display, screen, player, actors), Math.min(0, 1000 / 60 - (new Date() - startTime)));
}

function buildInput() {
  const mouseButtons = ['MouseLeft', 'MouseMiddle', 'MouseRight'];
  /**
   * @type {object}
   * @prop {int} movementX
   * @prop {int} movementY
   */
  let cursor = {pageX: window.getHalfWidth(), pageY: window.getHalfHeight(), movementX: 0, movementY: 0};
  let pressed = [];

  return {
    overrideEvents: () => {
      window.onblur = e => pressed = [];
      document.onmousemove = overrideEvent(e => cursor = e);
      document.onkeydown = overrideEvent(e => pressed.add(e.code));
      document.onkeyup = overrideEvent(e => pressed.remove(e.code));
      document.onmousedown = overrideEvent(e => pressed.add(mouseButtons[e.which - 1]));
      document.onmouseup = overrideEvent(e => pressed.remove(mouseButtons[e.which - 1]));
    },
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
  }
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

function buildDisplay(screen, output, content = {}) {
  document.oncontextmenu = overrideEvent();
  document.onselectstart = overrideEvent();
  window.onresize = e => screen.resize(window.innerWidth, window.innerHeight);
  screen.resize(window.innerWidth, window.innerHeight);
  return {
    renderOutput: () => {
      output.style.display = INPUT.getPressed().includes(INPUT.getKeys().SHOW_OUTPUT) ? 'block' : 'none';
      output.innerText = JSON.stringify(Object.assign({
        pressed: INPUT.getPressed(),
        arc: INPUT.calcCursorAngle(),
        cursor: INPUT.getCursor()
      }, content), null, 2);
    }
  };
}

function overrideEvent(cb = () => false) {
  return e => (e.key !== INPUT.getKeys().META) && (e.preventDefault() || cb(e) || false);
}

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL21haW4uanMiLCJzcmMvdWkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHVpID0gcmVxdWlyZSgnLi91aScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgdXBkYXRlLFxuICBidWlsZEFjdG9yLFxuICByZXNvbHZlQWN0b3JDb2xsaXNpb25cbn07XG5cbmZ1bmN0aW9uIHVwZGF0ZShwbGF5ZXIsIGFjdG9ycyA9IFtdKSB7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IHByZXNzZWQgPSB1aS5JTlBVVC5nZXRQcmVzc2VkKCk7XG4gIHBsYXllci5hID0gLXVpLklOUFVULmNhbGNDdXJzb3JBbmdsZShwbGF5ZXIueCwgcGxheWVyLnkpO1xuICBpZiAocHJlc3NlZC5pbmNsdWRlcyh1aS5JTlBVVC5nZXRLZXlzKCkuV0FMS19GT1JXQVJEKSkge1xuICAgIHBsYXllci5tb3ZlRm9yd2FyZCgpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKHVpLklOUFVULmdldEtleXMoKS5XQUxLX1JJR0hUKSkge1xuICAgIHBsYXllci5tb3ZlUmlnaHQoKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyh1aS5JTlBVVC5nZXRLZXlzKCkuV0FMS19CQUNLV0FSRCkpIHtcbiAgICBwbGF5ZXIubW92ZUJhY2t3YXJkKCk7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXModWkuSU5QVVQuZ2V0S2V5cygpLldBTEtfTEVGVCkpIHtcbiAgICBwbGF5ZXIubW92ZUxlZnQoKTtcbiAgfVxuICBhY3RvcnMuZm9yRWFjaChhY3RvciA9PiB7XG4gICAgYWN0b3IuYSA9IC1NYXRoLlRyaWdBbmdsZUJldHdlZW4oYWN0b3IueCwgYWN0b3IueSwgcGxheWVyLngsIHBsYXllci55KTtcbiAgICBhY3Rvci5tb3ZlRm9yd2FyZCgpO1xuICB9KTtcbiAgYWN0b3JzLmNvbmNhdChwbGF5ZXIpLmZvckVhY2goYWN0b3IgPT4ge1xuICAgIGFjdG9ycy5jb25jYXQocGxheWVyKS5mb3JFYWNoKHJlc29sdmVBY3RvckNvbGxpc2lvbi5iaW5kKG51bGwsIGFjdG9yKSk7XG4gIH0pO1xuICBzZXRUaW1lb3V0KHVwZGF0ZS5iaW5kKHRoaXMsIHBsYXllciwgYWN0b3JzKSwgTWF0aC5taW4oMCwgMTAwMCAvIDEwMCAtIChuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSkpO1xufVxuXG5cbmZ1bmN0aW9uIGJ1aWxkQWN0b3IoYXR0cmlidXRlcykge1xuICBjb25zdCBhY3RvciA9IE9iamVjdC5hc3NpZ24oe3g6IDAsIHk6IDAsIGE6IDAsIHNwZWVkOiAxfSwgYXR0cmlidXRlcyk7XG4gIGNvbnN0IGFjdGlvbnMgPSB7XG4gICAgbW92ZUZvcndhcmQ6ICgpID0+IHtcbiAgICAgIGFjdG9yLnggKz0gTWF0aC5UcmlnWChhY3Rvci5hIC0gTWF0aC5IYWxmUEksIC1hY3Rvci5zcGVlZCk7XG4gICAgICBhY3Rvci55ICs9IE1hdGguVHJpZ1koYWN0b3IuYSAtIE1hdGguSGFsZlBJLCAtYWN0b3Iuc3BlZWQpO1xuICAgIH0sXG4gICAgbW92ZVJpZ2h0OiAoKSA9PiB7XG4gICAgICBhY3Rvci54ICs9IE1hdGguVHJpZ1goYWN0b3IuYSwgLWFjdG9yLnNwZWVkKTtcbiAgICAgIGFjdG9yLnkgKz0gTWF0aC5UcmlnWShhY3Rvci5hLCAtYWN0b3Iuc3BlZWQpO1xuICAgIH0sXG4gICAgbW92ZUJhY2t3YXJkOiAoKSA9PiB7XG4gICAgICBhY3Rvci54ICs9IE1hdGguVHJpZ1goYWN0b3IuYSAtIE1hdGguSGFsZlBJLCBhY3Rvci5zcGVlZCk7XG4gICAgICBhY3Rvci55ICs9IE1hdGguVHJpZ1koYWN0b3IuYSAtIE1hdGguSGFsZlBJLCBhY3Rvci5zcGVlZCk7XG4gICAgfSxcbiAgICBtb3ZlTGVmdDogKCkgPT4ge1xuICAgICAgYWN0b3IueCArPSBNYXRoLlRyaWdYKGFjdG9yLmEsIGFjdG9yLnNwZWVkKTtcbiAgICAgIGFjdG9yLnkgKz0gTWF0aC5UcmlnWShhY3Rvci5hLCBhY3Rvci5zcGVlZCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGFjdG9yLCBhY3Rpb25zKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUFjdG9yQ29sbGlzaW9uKGFjdG9yLCBjaGVjaykge1xuICBjb25zdCBvcmlnQSA9IGFjdG9yLmE7XG4gIHdoaWxlIChhY3RvciAhPT0gY2hlY2sgJiYgTWF0aC5UcmlnRGlzdEJldHdlZW4oYWN0b3IueCwgYWN0b3IueSwgY2hlY2sueCwgY2hlY2sueSkgPCA1KSB7XG4gICAgYWN0b3IuYSA9IC1NYXRoLlRyaWdBbmdsZUJldHdlZW4oYWN0b3IueCwgYWN0b3IueSwgY2hlY2sueCwgY2hlY2sueSk7XG4gICAgYWN0b3IubW92ZUJhY2t3YXJkKCk7XG4gIH1cbiAgYWN0b3IuYSA9IG9yaWdBO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5NYXRoLkZsb29yRXhwb25lbnRpYWwgPSBuID0+IG4udG9TdHJpbmcoKS5pbmRleE9mKCdlLScpICE9PSAtMSA/IDAgOiBuO1xuTWF0aC5UcmlnWCA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLmNvcyhyYWRzKSAqIHZlbCk7XG5NYXRoLlRyaWdZID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguc2luKHJhZHMpICogdmVsKTtcbk1hdGguVHJpZ0Rpc3RCZXR3ZWVuID0gKHgxLCB5MSwgeDIsIHkyKSA9PiBNYXRoLnNxcnQoTWF0aC5wb3coeDEgLSB4MiwgMikgKyBNYXRoLnBvdyh5MSAtIHkyLCAyKSk7XG5NYXRoLlRyaWdBbmdsZUJldHdlZW4gPSAoeDEsIHkxLCB4MiwgeTIpID0+IE1hdGguYXRhbjIoeDIgLSB4MSwgeTIgLSB5MSk7XG5NYXRoLkhhbGZQSSA9IE1hdGguUEkgLyAyO1xuXG5BcnJheS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gbnVsbCA6IHRoaXMucHVzaCh2YWwpO1xufTtcbkFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiB0aGlzLmluY2x1ZGVzKHZhbCkgPyB0aGlzLnNwbGljZSh0aGlzLmluZGV4T2YodmFsKSwgMSkgOiBudWxsO1xufTtcblxud2luZG93LmdldEhhbGZXaWR0aCA9ICgpID0+IHdpbmRvdy5pbm5lcldpZHRoIC8gMjtcbndpbmRvdy5nZXRIYWxmSGVpZ2h0ID0gKCkgPT4gd2luZG93LmlubmVySGVpZ2h0IC8gMjtcblxuY29uc3QgdWkgPSByZXF1aXJlKCcuL3VpJyk7XG5jb25zdCBhcHAgPSByZXF1aXJlKCcuL2FwcCcpO1xuXG5jb25zdCBwbGF5ZXIgPSBhcHAuYnVpbGRBY3Rvcih7c3BlZWQ6IDN9KTtcbmNvbnN0IGFjdG9ycyA9IFtdO1xuZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcbiAgYWN0b3JzLnB1c2goYXBwLmJ1aWxkQWN0b3Ioe3g6IE1hdGgucmFuZG9tKCkgKiAxMDAgKyAxLCB5OiBNYXRoLnJhbmRvbSgpICogMTAwICsgMSwgc3BlZWQ6IE1hdGgucmFuZG9tKCkgKiAyICsgMX0pKVxufVxuXG51aS5JTlBVVC5vdmVycmlkZUV2ZW50cygpO1xuY29uc3Qgc2NyZWVuID0gdWkuYnVpbGRTY3JlZW4oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmVlbicpKTtcbmNvbnN0IGRpc3BsYXkgPSB1aS5idWlsZERpc3BsYXkoc2NyZWVuLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3V0cHV0JyksIHtwbGF5ZXJ9KTtcbnVpLnJlbmRlcihkaXNwbGF5LCBzY3JlZW4sIHBsYXllciwgYWN0b3JzKTtcbmFwcC51cGRhdGUocGxheWVyLCBhY3RvcnMpO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IElOUFVUID0gYnVpbGRJbnB1dCgpO1xuY29uc3QgQ09MT1JTID0ge1xuICBCTEFDSzogJyMwMDAwMDAnLFxuICBXSElURTogJyNmZmZmZmYnLFxuICBSRUQ6ICcjZmYwMDAwJyxcbiAgR1JFRU46ICcjMzQ3QzJDJ1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJlbmRlcixcbiAgSU5QVVQsXG4gIGJ1aWxkU2NyZWVuLFxuICBidWlsZERpc3BsYXlcbn07XG5cbmZ1bmN0aW9uIHJlbmRlcihkaXNwbGF5LCBzY3JlZW4sIHBsYXllciwgYWN0b3JzID0gW10pIHtcbiAgY29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcbiAgY29uc3QgY3Vyc29yID0gSU5QVVQuZ2V0Q3Vyc29yKCk7XG4gIGRpc3BsYXkucmVuZGVyT3V0cHV0KCk7XG4gIHNjcmVlbi5jbGVhcigpO1xuICBzY3JlZW4ucmVuZGVyQ2lyY2xlKGN1cnNvci54LCBjdXJzb3IueSwgTWF0aC5tYXgoNSwgY3Vyc29yLnYpKTtcbiAgc2NyZWVuLnJlbmRlclRleHQod2luZG93LmdldEhhbGZXaWR0aCgpLCB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpLCAwLCAnVGhlIENlbnRlcicsIENPTE9SUy5SRUQpO1xuICBzY3JlZW4ucmVuZGVyVGV4dChwbGF5ZXIueCwgcGxheWVyLnksIHBsYXllci5hICsgTWF0aC5QSSwgJ14nKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMTAwLCAxMDAsIDAsICdBJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDEwMCwgMjAwLCAwLCAnQicpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgyMDAsIDEwMCwgMCwgJ0MnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMjAwLCAyMDAsIDAsICdEJyk7XG4gIGFjdG9ycy5mb3JFYWNoKGFjdG9yID0+IHNjcmVlbi5yZW5kZXJUZXh0KGFjdG9yLngsIGFjdG9yLnksIGFjdG9yLmEgKyBNYXRoLlBJLCAnXicsIENPTE9SUy5HUkVFTikpO1xuICBzZXRUaW1lb3V0KHJlbmRlci5iaW5kKHRoaXMsIGRpc3BsYXksIHNjcmVlbiwgcGxheWVyLCBhY3RvcnMpLCBNYXRoLm1pbigwLCAxMDAwIC8gNjAgLSAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkpKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRJbnB1dCgpIHtcbiAgY29uc3QgbW91c2VCdXR0b25zID0gWydNb3VzZUxlZnQnLCAnTW91c2VNaWRkbGUnLCAnTW91c2VSaWdodCddO1xuICAvKipcbiAgICogQHR5cGUge29iamVjdH1cbiAgICogQHByb3Age2ludH0gbW92ZW1lbnRYXG4gICAqIEBwcm9wIHtpbnR9IG1vdmVtZW50WVxuICAgKi9cbiAgbGV0IGN1cnNvciA9IHtwYWdlWDogd2luZG93LmdldEhhbGZXaWR0aCgpLCBwYWdlWTogd2luZG93LmdldEhhbGZIZWlnaHQoKSwgbW92ZW1lbnRYOiAwLCBtb3ZlbWVudFk6IDB9O1xuICBsZXQgcHJlc3NlZCA9IFtdO1xuXG4gIHJldHVybiB7XG4gICAgb3ZlcnJpZGVFdmVudHM6ICgpID0+IHtcbiAgICAgIHdpbmRvdy5vbmJsdXIgPSBlID0+IHByZXNzZWQgPSBbXTtcbiAgICAgIGRvY3VtZW50Lm9ubW91c2Vtb3ZlID0gb3ZlcnJpZGVFdmVudChlID0+IGN1cnNvciA9IGUpO1xuICAgICAgZG9jdW1lbnQub25rZXlkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKGUuY29kZSkpO1xuICAgICAgZG9jdW1lbnQub25rZXl1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShlLmNvZGUpKTtcbiAgICAgIGRvY3VtZW50Lm9ubW91c2Vkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgICAgIGRvY3VtZW50Lm9ubW91c2V1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gICAgfSxcbiAgICBjYWxjQ3Vyc29yQW5nbGU6ICh4ID0gd2luZG93LmdldEhhbGZXaWR0aCgpLCB5ID0gd2luZG93LmdldEhhbGZIZWlnaHQoKSkgPT4gIWN1cnNvciA/IG51bGwgOiBNYXRoLlRyaWdBbmdsZUJldHdlZW4oeCwgeSwgY3Vyc29yLnBhZ2VYLCBjdXJzb3IucGFnZVkpLFxuICAgIGdldEN1cnNvcjogKCkgPT4gIWN1cnNvciA/IG51bGwgOiB7XG4gICAgICB4OiBjdXJzb3IucGFnZVgsXG4gICAgICB5OiBjdXJzb3IucGFnZVksXG4gICAgICB2OiAoTWF0aC5hYnMoY3Vyc29yLm1vdmVtZW50WCkgKyBNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRZKSAvIDIpXG4gICAgfSxcbiAgICBnZXRQcmVzc2VkOiAoKSA9PiBwcmVzc2VkLFxuICAgIGdldEtleXM6ICgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFdBTEtfRk9SV0FSRDogJ0tleVcnLFxuICAgICAgICBXQUxLX1JJR0hUOiAnS2V5RCcsXG4gICAgICAgIFdBTEtfQkFDS1dBUkQ6ICdLZXlTJyxcbiAgICAgICAgV0FMS19MRUZUOiAnS2V5QScsXG4gICAgICAgIE1FVEE6ICdNZXRhJyxcbiAgICAgICAgU0hPV19PVVRQVVQ6ICdUYWInXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkU2NyZWVuKGNhbnZhcykge1xuICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgcmV0dXJuIHtcbiAgICByZXNpemU6ICh3aWR0aCwgaGVpZ2h0KSA9PiBPYmplY3QuYXNzaWduKGNhbnZhcywge3dpZHRoLCBoZWlnaHR9KSxcbiAgICBjbGVhcjogKCkgPT4ge1xuICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IENPTE9SUy5CTEFDSztcbiAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH0sXG4gICAgcmVuZGVyVGV4dDogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIGFuZ2xlLCB0LCBjID0gQ09MT1JTLldISVRFKSA9PiB7XG4gICAgICBjdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gICAgICBjdHguZmlsbFN0eWxlID0gYztcbiAgICAgIGN0eC50cmFuc2xhdGUoeCwgeSk7XG4gICAgICBjdHgucm90YXRlKGFuZ2xlKTtcbiAgICAgIGN0eC5maWxsVGV4dCh0LCAwLCAwKTtcbiAgICB9KSxcbiAgICByZW5kZXJDaXJjbGU6IHJlbmRlci5iaW5kKG51bGwsICh4LCB5LCByYWRpdXMsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5hcmMoeCwgeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBjO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pXG4gIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGNiKSB7XG4gICAgY3R4LnNhdmUoKTtcbiAgICBjYi5hcHBseShudWxsLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRGlzcGxheShzY3JlZW4sIG91dHB1dCwgY29udGVudCA9IHt9KSB7XG4gIGRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBvdmVycmlkZUV2ZW50KCk7XG4gIGRvY3VtZW50Lm9uc2VsZWN0c3RhcnQgPSBvdmVycmlkZUV2ZW50KCk7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IGUgPT4gc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgcmV0dXJuIHtcbiAgICByZW5kZXJPdXRwdXQ6ICgpID0+IHtcbiAgICAgIG91dHB1dC5zdHlsZS5kaXNwbGF5ID0gSU5QVVQuZ2V0UHJlc3NlZCgpLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5TSE9XX09VVFBVVCkgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgb3V0cHV0LmlubmVyVGV4dCA9IEpTT04uc3RyaW5naWZ5KE9iamVjdC5hc3NpZ24oe1xuICAgICAgICBwcmVzc2VkOiBJTlBVVC5nZXRQcmVzc2VkKCksXG4gICAgICAgIGFyYzogSU5QVVQuY2FsY0N1cnNvckFuZ2xlKCksXG4gICAgICAgIGN1cnNvcjogSU5QVVQuZ2V0Q3Vyc29yKClcbiAgICAgIH0sIGNvbnRlbnQpLCBudWxsLCAyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlRXZlbnQoY2IgPSAoKSA9PiBmYWxzZSkge1xuICByZXR1cm4gZSA9PiAoZS5rZXkgIT09IElOUFVULmdldEtleXMoKS5NRVRBKSAmJiAoZS5wcmV2ZW50RGVmYXVsdCgpIHx8IGNiKGUpIHx8IGZhbHNlKTtcbn1cbiJdfQ==
