(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

const ui = require('./ui');

const ACTOR_STATES = {
  WALK_FORWARD: null,
  WALK_RIGHT: null,
  WALK_BACKWARD: null,
  WALK_LEFT: null
}.keysToValues();

module.exports = {
  update,
  buildActor,
  resolveActorCollision,
  ACTOR_STATES
};

function update(player, actors = []) {
  const startTime = new Date();
  const pressed = ui.INPUT.getPressed();
  const keys = ui.INPUT.getKeys();
  player.a = -ui.INPUT.calcCursorAngle(player.x, player.y);
  keys.forOwn((key, val) => {
    ACTOR_STATES.hasOwnProperty(key) && pressed.includes(val) ? player.states.add(key) : player.states.remove(key);
  });
  actors.forEach(actor => {
    actor.a = -Math.TrigAngleBetween(actor.x, actor.y, player.x, player.y);
  });
  actors.concat(player).forEach(actor => {
    actor.update();
    actors.concat(player).forEach(resolveActorCollision.bind(null, actor));
  });
  setTimeout(update.bind(this, player, actors), Math.min(0, 1000 / 100 - (new Date() - startTime)));
}


function buildActor(attributes) {
  const actor = Object.assign({x: 0, y: 0, a: 0, speed: 1, states: []}, attributes);
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

  return Object.assign(actor, actions, {
    update: () => {
      if (actor.states.includes(ACTOR_STATES.WALK_FORWARD)) {
        actor.moveForward();
      }
      if (actor.states.includes(ACTOR_STATES.WALK_RIGHT)) {
        actor.moveRight();
      }
      if (actor.states.includes(ACTOR_STATES.WALK_BACKWARD)) {
        actor.moveBackward();
      }
      if (actor.states.includes(ACTOR_STATES.WALK_LEFT)) {
        actor.moveLeft();
      }
    }
  });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL21haW4uanMiLCJzcmMvdWkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgdWkgPSByZXF1aXJlKCcuL3VpJyk7XG5cbmNvbnN0IEFDVE9SX1NUQVRFUyA9IHtcbiAgV0FMS19GT1JXQVJEOiBudWxsLFxuICBXQUxLX1JJR0hUOiBudWxsLFxuICBXQUxLX0JBQ0tXQVJEOiBudWxsLFxuICBXQUxLX0xFRlQ6IG51bGxcbn0ua2V5c1RvVmFsdWVzKCk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB1cGRhdGUsXG4gIGJ1aWxkQWN0b3IsXG4gIHJlc29sdmVBY3RvckNvbGxpc2lvbixcbiAgQUNUT1JfU1RBVEVTXG59O1xuXG5mdW5jdGlvbiB1cGRhdGUocGxheWVyLCBhY3RvcnMgPSBbXSkge1xuICBjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBwcmVzc2VkID0gdWkuSU5QVVQuZ2V0UHJlc3NlZCgpO1xuICBjb25zdCBrZXlzID0gdWkuSU5QVVQuZ2V0S2V5cygpO1xuICBwbGF5ZXIuYSA9IC11aS5JTlBVVC5jYWxjQ3Vyc29yQW5nbGUocGxheWVyLngsIHBsYXllci55KTtcbiAga2V5cy5mb3JPd24oKGtleSwgdmFsKSA9PiB7XG4gICAgQUNUT1JfU1RBVEVTLmhhc093blByb3BlcnR5KGtleSkgJiYgcHJlc3NlZC5pbmNsdWRlcyh2YWwpID8gcGxheWVyLnN0YXRlcy5hZGQoa2V5KSA6IHBsYXllci5zdGF0ZXMucmVtb3ZlKGtleSk7XG4gIH0pO1xuICBhY3RvcnMuZm9yRWFjaChhY3RvciA9PiB7XG4gICAgYWN0b3IuYSA9IC1NYXRoLlRyaWdBbmdsZUJldHdlZW4oYWN0b3IueCwgYWN0b3IueSwgcGxheWVyLngsIHBsYXllci55KTtcbiAgfSk7XG4gIGFjdG9ycy5jb25jYXQocGxheWVyKS5mb3JFYWNoKGFjdG9yID0+IHtcbiAgICBhY3Rvci51cGRhdGUoKTtcbiAgICBhY3RvcnMuY29uY2F0KHBsYXllcikuZm9yRWFjaChyZXNvbHZlQWN0b3JDb2xsaXNpb24uYmluZChudWxsLCBhY3RvcikpO1xuICB9KTtcbiAgc2V0VGltZW91dCh1cGRhdGUuYmluZCh0aGlzLCBwbGF5ZXIsIGFjdG9ycyksIE1hdGgubWluKDAsIDEwMDAgLyAxMDAgLSAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkpKTtcbn1cblxuXG5mdW5jdGlvbiBidWlsZEFjdG9yKGF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgYWN0b3IgPSBPYmplY3QuYXNzaWduKHt4OiAwLCB5OiAwLCBhOiAwLCBzcGVlZDogMSwgc3RhdGVzOiBbXX0sIGF0dHJpYnV0ZXMpO1xuICBjb25zdCBhY3Rpb25zID0ge1xuICAgIG1vdmVGb3J3YXJkOiAoKSA9PiB7XG4gICAgICBhY3Rvci54ICs9IE1hdGguVHJpZ1goYWN0b3IuYSAtIE1hdGguSGFsZlBJLCAtYWN0b3Iuc3BlZWQpO1xuICAgICAgYWN0b3IueSArPSBNYXRoLlRyaWdZKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgLWFjdG9yLnNwZWVkKTtcbiAgICB9LFxuICAgIG1vdmVSaWdodDogKCkgPT4ge1xuICAgICAgYWN0b3IueCArPSBNYXRoLlRyaWdYKGFjdG9yLmEsIC1hY3Rvci5zcGVlZCk7XG4gICAgICBhY3Rvci55ICs9IE1hdGguVHJpZ1koYWN0b3IuYSwgLWFjdG9yLnNwZWVkKTtcbiAgICB9LFxuICAgIG1vdmVCYWNrd2FyZDogKCkgPT4ge1xuICAgICAgYWN0b3IueCArPSBNYXRoLlRyaWdYKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgYWN0b3Iuc3BlZWQpO1xuICAgICAgYWN0b3IueSArPSBNYXRoLlRyaWdZKGFjdG9yLmEgLSBNYXRoLkhhbGZQSSwgYWN0b3Iuc3BlZWQpO1xuICAgIH0sXG4gICAgbW92ZUxlZnQ6ICgpID0+IHtcbiAgICAgIGFjdG9yLnggKz0gTWF0aC5UcmlnWChhY3Rvci5hLCBhY3Rvci5zcGVlZCk7XG4gICAgICBhY3Rvci55ICs9IE1hdGguVHJpZ1koYWN0b3IuYSwgYWN0b3Iuc3BlZWQpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihhY3RvciwgYWN0aW9ucywge1xuICAgIHVwZGF0ZTogKCkgPT4ge1xuICAgICAgaWYgKGFjdG9yLnN0YXRlcy5pbmNsdWRlcyhBQ1RPUl9TVEFURVMuV0FMS19GT1JXQVJEKSkge1xuICAgICAgICBhY3Rvci5tb3ZlRm9yd2FyZCgpO1xuICAgICAgfVxuICAgICAgaWYgKGFjdG9yLnN0YXRlcy5pbmNsdWRlcyhBQ1RPUl9TVEFURVMuV0FMS19SSUdIVCkpIHtcbiAgICAgICAgYWN0b3IubW92ZVJpZ2h0KCk7XG4gICAgICB9XG4gICAgICBpZiAoYWN0b3Iuc3RhdGVzLmluY2x1ZGVzKEFDVE9SX1NUQVRFUy5XQUxLX0JBQ0tXQVJEKSkge1xuICAgICAgICBhY3Rvci5tb3ZlQmFja3dhcmQoKTtcbiAgICAgIH1cbiAgICAgIGlmIChhY3Rvci5zdGF0ZXMuaW5jbHVkZXMoQUNUT1JfU1RBVEVTLldBTEtfTEVGVCkpIHtcbiAgICAgICAgYWN0b3IubW92ZUxlZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlQWN0b3JDb2xsaXNpb24oYWN0b3IsIGNoZWNrKSB7XG4gIGNvbnN0IG9yaWdBID0gYWN0b3IuYTtcbiAgd2hpbGUgKGFjdG9yICE9PSBjaGVjayAmJiBNYXRoLlRyaWdEaXN0QmV0d2VlbihhY3Rvci54LCBhY3Rvci55LCBjaGVjay54LCBjaGVjay55KSA8IDUpIHtcbiAgICBhY3Rvci5hID0gLU1hdGguVHJpZ0FuZ2xlQmV0d2VlbihhY3Rvci54LCBhY3Rvci55LCBjaGVjay54LCBjaGVjay55KTtcbiAgICBhY3Rvci5tb3ZlQmFja3dhcmQoKTtcbiAgfVxuICBhY3Rvci5hID0gb3JpZ0E7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5wcm90b3R5cGUuZm9yT3duID0gZnVuY3Rpb24gKGNiKSB7XG4gIGxldCBrZXk7XG4gIGZvciAoa2V5IGluIHRoaXMpIHtcbiAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGNiKGtleSwgdGhpc1trZXldLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbk9iamVjdC5wcm90b3R5cGUua2V5c1RvVmFsdWVzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5mb3JPd24oKGtleSwgdmFsLCBvYmopID0+IG9ialtrZXldID0ga2V5KTtcbn07XG5cbk1hdGguRmxvb3JFeHBvbmVudGlhbCA9IG4gPT4gbi50b1N0cmluZygpLmluZGV4T2YoJ2UtJykgIT09IC0xID8gMCA6IG47XG5NYXRoLlRyaWdYID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguY29zKHJhZHMpICogdmVsKTtcbk1hdGguVHJpZ1kgPSAocmFkcywgdmVsKSA9PiBNYXRoLkZsb29yRXhwb25lbnRpYWwoTWF0aC5zaW4ocmFkcykgKiB2ZWwpO1xuTWF0aC5UcmlnRGlzdEJldHdlZW4gPSAoeDEsIHkxLCB4MiwgeTIpID0+IE1hdGguc3FydChNYXRoLnBvdyh4MSAtIHgyLCAyKSArIE1hdGgucG93KHkxIC0geTIsIDIpKTtcbk1hdGguVHJpZ0FuZ2xlQmV0d2VlbiA9ICh4MSwgeTEsIHgyLCB5MikgPT4gTWF0aC5hdGFuMih4MiAtIHgxLCB5MiAtIHkxKTtcbk1hdGguSGFsZlBJID0gTWF0aC5QSSAvIDI7XG5cbkFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiB0aGlzLmluY2x1ZGVzKHZhbCkgPyBudWxsIDogdGhpcy5wdXNoKHZhbCk7XG59O1xuQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IHRoaXMuc3BsaWNlKHRoaXMuaW5kZXhPZih2YWwpLCAxKSA6IG51bGw7XG59O1xuXG53aW5kb3cuZ2V0SGFsZldpZHRoID0gKCkgPT4gd2luZG93LmlubmVyV2lkdGggLyAyO1xud2luZG93LmdldEhhbGZIZWlnaHQgPSAoKSA9PiB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyO1xuXG5jb25zdCB1aSA9IHJlcXVpcmUoJy4vdWknKTtcbmNvbnN0IGFwcCA9IHJlcXVpcmUoJy4vYXBwJyk7XG5cbmNvbnN0IHBsYXllciA9IGFwcC5idWlsZEFjdG9yKHtzcGVlZDogM30pO1xuY29uc3QgYWN0b3JzID0gW107XG5mb3IgKGxldCBpID0gMDsgaSA8IDU7IGkrKykge1xuICBhY3RvcnMucHVzaChhcHAuYnVpbGRBY3Rvcih7XG4gICAgeDogTWF0aC5yYW5kb20oKSAqIDEwMCArIDEsXG4gICAgeTogTWF0aC5yYW5kb20oKSAqIDEwMCArIDEsXG4gICAgc3BlZWQ6IE1hdGgucmFuZG9tKCkgKiAyICsgMSxcbiAgICBzdGF0ZXM6IFthcHAuQUNUT1JfU1RBVEVTLldBTEtfRk9SV0FSRF1cbiAgfSkpO1xufVxuXG51aS5JTlBVVC5vdmVycmlkZUV2ZW50cygpO1xuY29uc3Qgc2NyZWVuID0gdWkuYnVpbGRTY3JlZW4oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmVlbicpKTtcbmNvbnN0IGRpc3BsYXkgPSB1aS5idWlsZERpc3BsYXkoc2NyZWVuLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3V0cHV0JyksIHtwbGF5ZXJ9KTtcbnVpLnJlbmRlcihkaXNwbGF5LCBzY3JlZW4sIHBsYXllciwgYWN0b3JzKTtcbmFwcC51cGRhdGUocGxheWVyLCBhY3RvcnMpO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IElOUFVUID0gYnVpbGRJbnB1dCgpO1xuY29uc3QgQ09MT1JTID0ge1xuICBCTEFDSzogJyMwMDAwMDAnLFxuICBXSElURTogJyNmZmZmZmYnLFxuICBSRUQ6ICcjZmYwMDAwJyxcbiAgR1JFRU46ICcjMzQ3QzJDJ1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJlbmRlcixcbiAgSU5QVVQsXG4gIGJ1aWxkU2NyZWVuLFxuICBidWlsZERpc3BsYXlcbn07XG5cbmZ1bmN0aW9uIHJlbmRlcihkaXNwbGF5LCBzY3JlZW4sIHBsYXllciwgYWN0b3JzID0gW10pIHtcbiAgY29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcbiAgY29uc3QgY3Vyc29yID0gSU5QVVQuZ2V0Q3Vyc29yKCk7XG4gIGRpc3BsYXkucmVuZGVyT3V0cHV0KCk7XG4gIHNjcmVlbi5jbGVhcigpO1xuICBzY3JlZW4ucmVuZGVyQ2lyY2xlKGN1cnNvci54LCBjdXJzb3IueSwgTWF0aC5tYXgoNSwgY3Vyc29yLnYpKTtcbiAgc2NyZWVuLnJlbmRlclRleHQod2luZG93LmdldEhhbGZXaWR0aCgpLCB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpLCAwLCAnVGhlIENlbnRlcicsIENPTE9SUy5SRUQpO1xuICBzY3JlZW4ucmVuZGVyVGV4dChwbGF5ZXIueCwgcGxheWVyLnksIHBsYXllci5hICsgTWF0aC5QSSwgJ14nKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMTAwLCAxMDAsIDAsICdBJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDEwMCwgMjAwLCAwLCAnQicpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgyMDAsIDEwMCwgMCwgJ0MnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMjAwLCAyMDAsIDAsICdEJyk7XG4gIGFjdG9ycy5mb3JFYWNoKGFjdG9yID0+IHNjcmVlbi5yZW5kZXJUZXh0KGFjdG9yLngsIGFjdG9yLnksIGFjdG9yLmEgKyBNYXRoLlBJLCAnXicsIENPTE9SUy5HUkVFTikpO1xuICBzZXRUaW1lb3V0KHJlbmRlci5iaW5kKHRoaXMsIGRpc3BsYXksIHNjcmVlbiwgcGxheWVyLCBhY3RvcnMpLCBNYXRoLm1pbigwLCAxMDAwIC8gNjAgLSAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkpKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRJbnB1dCgpIHtcbiAgY29uc3QgbW91c2VCdXR0b25zID0gWydNb3VzZUxlZnQnLCAnTW91c2VNaWRkbGUnLCAnTW91c2VSaWdodCddO1xuICAvKipcbiAgICogQHR5cGUge29iamVjdH1cbiAgICogQHByb3Age2ludH0gbW92ZW1lbnRYXG4gICAqIEBwcm9wIHtpbnR9IG1vdmVtZW50WVxuICAgKi9cbiAgbGV0IGN1cnNvciA9IHtwYWdlWDogd2luZG93LmdldEhhbGZXaWR0aCgpLCBwYWdlWTogd2luZG93LmdldEhhbGZIZWlnaHQoKSwgbW92ZW1lbnRYOiAwLCBtb3ZlbWVudFk6IDB9O1xuICBsZXQgcHJlc3NlZCA9IFtdO1xuXG4gIHJldHVybiB7XG4gICAgb3ZlcnJpZGVFdmVudHM6ICgpID0+IHtcbiAgICAgIHdpbmRvdy5vbmJsdXIgPSBlID0+IHByZXNzZWQgPSBbXTtcbiAgICAgIGRvY3VtZW50Lm9ubW91c2Vtb3ZlID0gb3ZlcnJpZGVFdmVudChlID0+IGN1cnNvciA9IGUpO1xuICAgICAgZG9jdW1lbnQub25rZXlkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKGUuY29kZSkpO1xuICAgICAgZG9jdW1lbnQub25rZXl1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShlLmNvZGUpKTtcbiAgICAgIGRvY3VtZW50Lm9ubW91c2Vkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgICAgIGRvY3VtZW50Lm9ubW91c2V1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gICAgfSxcbiAgICBjYWxjQ3Vyc29yQW5nbGU6ICh4ID0gd2luZG93LmdldEhhbGZXaWR0aCgpLCB5ID0gd2luZG93LmdldEhhbGZIZWlnaHQoKSkgPT4gIWN1cnNvciA/IG51bGwgOiBNYXRoLlRyaWdBbmdsZUJldHdlZW4oeCwgeSwgY3Vyc29yLnBhZ2VYLCBjdXJzb3IucGFnZVkpLFxuICAgIGdldEN1cnNvcjogKCkgPT4gIWN1cnNvciA/IG51bGwgOiB7XG4gICAgICB4OiBjdXJzb3IucGFnZVgsXG4gICAgICB5OiBjdXJzb3IucGFnZVksXG4gICAgICB2OiAoTWF0aC5hYnMoY3Vyc29yLm1vdmVtZW50WCkgKyBNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRZKSAvIDIpXG4gICAgfSxcbiAgICBnZXRQcmVzc2VkOiAoKSA9PiBwcmVzc2VkLFxuICAgIGdldEtleXM6ICgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFdBTEtfRk9SV0FSRDogJ0tleVcnLFxuICAgICAgICBXQUxLX1JJR0hUOiAnS2V5RCcsXG4gICAgICAgIFdBTEtfQkFDS1dBUkQ6ICdLZXlTJyxcbiAgICAgICAgV0FMS19MRUZUOiAnS2V5QScsXG4gICAgICAgIE1FVEE6ICdNZXRhJyxcbiAgICAgICAgU0hPV19PVVRQVVQ6ICdUYWInXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkU2NyZWVuKGNhbnZhcykge1xuICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgcmV0dXJuIHtcbiAgICByZXNpemU6ICh3aWR0aCwgaGVpZ2h0KSA9PiBPYmplY3QuYXNzaWduKGNhbnZhcywge3dpZHRoLCBoZWlnaHR9KSxcbiAgICBjbGVhcjogKCkgPT4ge1xuICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IENPTE9SUy5CTEFDSztcbiAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH0sXG4gICAgcmVuZGVyVGV4dDogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIGFuZ2xlLCB0LCBjID0gQ09MT1JTLldISVRFKSA9PiB7XG4gICAgICBjdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gICAgICBjdHguZmlsbFN0eWxlID0gYztcbiAgICAgIGN0eC50cmFuc2xhdGUoeCwgeSk7XG4gICAgICBjdHgucm90YXRlKGFuZ2xlKTtcbiAgICAgIGN0eC5maWxsVGV4dCh0LCAwLCAwKTtcbiAgICB9KSxcbiAgICByZW5kZXJDaXJjbGU6IHJlbmRlci5iaW5kKG51bGwsICh4LCB5LCByYWRpdXMsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5hcmMoeCwgeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBjO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pXG4gIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGNiKSB7XG4gICAgY3R4LnNhdmUoKTtcbiAgICBjYi5hcHBseShudWxsLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRGlzcGxheShzY3JlZW4sIG91dHB1dCwgY29udGVudCA9IHt9KSB7XG4gIGRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBvdmVycmlkZUV2ZW50KCk7XG4gIGRvY3VtZW50Lm9uc2VsZWN0c3RhcnQgPSBvdmVycmlkZUV2ZW50KCk7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IGUgPT4gc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgcmV0dXJuIHtcbiAgICByZW5kZXJPdXRwdXQ6ICgpID0+IHtcbiAgICAgIG91dHB1dC5zdHlsZS5kaXNwbGF5ID0gSU5QVVQuZ2V0UHJlc3NlZCgpLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5TSE9XX09VVFBVVCkgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgb3V0cHV0LmlubmVyVGV4dCA9IEpTT04uc3RyaW5naWZ5KE9iamVjdC5hc3NpZ24oe1xuICAgICAgICBwcmVzc2VkOiBJTlBVVC5nZXRQcmVzc2VkKCksXG4gICAgICAgIGFyYzogSU5QVVQuY2FsY0N1cnNvckFuZ2xlKCksXG4gICAgICAgIGN1cnNvcjogSU5QVVQuZ2V0Q3Vyc29yKClcbiAgICAgIH0sIGNvbnRlbnQpLCBudWxsLCAyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlRXZlbnQoY2IgPSAoKSA9PiBmYWxzZSkge1xuICByZXR1cm4gZSA9PiAoZS5rZXkgIT09IElOUFVULmdldEtleXMoKS5NRVRBKSAmJiAoZS5wcmV2ZW50RGVmYXVsdCgpIHx8IGNiKGUpIHx8IGZhbHNlKTtcbn1cbiJdfQ==
