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
