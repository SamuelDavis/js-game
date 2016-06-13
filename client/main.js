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
