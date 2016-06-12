(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Math.FloorExponential = n => n.toString().indexOf('e-') !== -1 ? 0 : n;
Math.trigX = (rads, vel) => Math.FloorExponential(Math.cos(rads) * vel);
Math.trigY = (rads, vel) => Math.FloorExponential(Math.sin(rads) * vel);
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
  RED: '#ff0000'
};

const INPUT = (() => {
  const mouseButtons = ['MouseLeft', 'MouseMiddle', 'MouseRight'];
  /**
   * @type {object}
   * @prop {int} movementX
   * @prop {int} movementY
   */
  let cursor = null;
  let pressed = [];
  document.onmousemove = overrideEvent(e => cursor = e);
  document.onkeydown = overrideEvent(e => pressed.add(e.code));
  document.onkeyup = overrideEvent(e => pressed.remove(e.code));
  document.onmousedown = overrideEvent(e => pressed.add(mouseButtons[e.which - 1]));
  document.onmouseup = overrideEvent(e => pressed.remove(mouseButtons[e.which - 1]));
  return {
    calcCursorAngle: (x = window.getHalfWidth(), y = window.getHalfHeight()) => !cursor ? null : Math.atan2(cursor.pageX - x, cursor.pageY - y) - Math.HalfPI,
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
const player = {x: window.getHalfWidth(), y: window.getHalfHeight(), a: 0, speed: 2};

setInterval(() => {
  const pressed = INPUT.getPressed();
  player.a = INPUT.calcCursorAngle();
  if (pressed.includes(INPUT.getKeys().WALK_FORWARD)) {
    player.x += Math.trigX(player.a, -player.speed);
    player.y += Math.trigY(player.a, -player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_RIGHT)) {
    player.x += Math.trigX(player.a + Math.HalfPI, player.speed);
    player.y += Math.trigY(player.a + Math.HalfPI, player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_BACKWARD)) {
    player.x += Math.trigX(player.a, +player.speed);
    player.y += Math.trigY(player.a, +player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_LEFT)) {
    player.x += Math.trigX(player.a + Math.HalfPI, -player.speed);
    player.y += Math.trigY(player.a + Math.HalfPI, -player.speed);
  }
}, 100 / 1000);

setInterval(() => {
  const cursor = INPUT.getCursor();
  display.renderOutput();
  screen.pan(player.x, player.y, player.a);
  screen.clear();
  screen.renderText(window.getHalfWidth(), window.getHalfHeight(), 0, 'The Center', COLORS.RED);
  screen.renderText(0, 0, -player.a - Math.HalfPI, 'A');
  screen.renderText(100, 100, 0, 'B');
  screen.renderText(100, 200, 0, 'C');
  screen.renderText(200, 100, 0, 'D');
  screen.renderText(200, 200, 0, 'E');
}, 60 / 1000);

function buildScreen(canvas) {
  const ctx = canvas.getContext('2d');
  let offset = {x: 0, y: 0, a: Math.HalfPI};
  return {
    pan: (x, y, a) => Object.assign(offset, {x, y, a: a - Math.HalfPI}),
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
    ctx.translate(offset.x, offset.y);
    ctx.rotate(offset.a);
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
        player
      }, null, 2);
    }
  };
}

function overrideEvent(cb = () => false) {
  return e => (e.key !== INPUT.getKeys().META) && (e.preventDefault() || cb(e) || false);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbk1hdGguRmxvb3JFeHBvbmVudGlhbCA9IG4gPT4gbi50b1N0cmluZygpLmluZGV4T2YoJ2UtJykgIT09IC0xID8gMCA6IG47XG5NYXRoLnRyaWdYID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguY29zKHJhZHMpICogdmVsKTtcbk1hdGgudHJpZ1kgPSAocmFkcywgdmVsKSA9PiBNYXRoLkZsb29yRXhwb25lbnRpYWwoTWF0aC5zaW4ocmFkcykgKiB2ZWwpO1xuTWF0aC5IYWxmUEkgPSBNYXRoLlBJIC8gMjtcblxuQXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IG51bGwgOiB0aGlzLnB1c2godmFsKTtcbn07XG5BcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gdGhpcy5zcGxpY2UodGhpcy5pbmRleE9mKHZhbCksIDEpIDogbnVsbDtcbn07XG5cbndpbmRvdy5nZXRIYWxmV2lkdGggPSAoKSA9PiB3aW5kb3cuaW5uZXJXaWR0aCAvIDI7XG53aW5kb3cuZ2V0SGFsZkhlaWdodCA9ICgpID0+IHdpbmRvdy5pbm5lckhlaWdodCAvIDI7XG5cbmNvbnN0IENPTE9SUyA9IHtcbiAgQkxBQ0s6ICcjMDAwMDAwJyxcbiAgV0hJVEU6ICcjZmZmZmZmJyxcbiAgUkVEOiAnI2ZmMDAwMCdcbn07XG5cbmNvbnN0IElOUFVUID0gKCgpID0+IHtcbiAgY29uc3QgbW91c2VCdXR0b25zID0gWydNb3VzZUxlZnQnLCAnTW91c2VNaWRkbGUnLCAnTW91c2VSaWdodCddO1xuICAvKipcbiAgICogQHR5cGUge29iamVjdH1cbiAgICogQHByb3Age2ludH0gbW92ZW1lbnRYXG4gICAqIEBwcm9wIHtpbnR9IG1vdmVtZW50WVxuICAgKi9cbiAgbGV0IGN1cnNvciA9IG51bGw7XG4gIGxldCBwcmVzc2VkID0gW107XG4gIGRvY3VtZW50Lm9ubW91c2Vtb3ZlID0gb3ZlcnJpZGVFdmVudChlID0+IGN1cnNvciA9IGUpO1xuICBkb2N1bWVudC5vbmtleWRvd24gPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ua2V5dXAgPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5yZW1vdmUoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ubW91c2Vkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgZG9jdW1lbnQub25tb3VzZXVwID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQucmVtb3ZlKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgcmV0dXJuIHtcbiAgICBjYWxjQ3Vyc29yQW5nbGU6ICh4ID0gd2luZG93LmdldEhhbGZXaWR0aCgpLCB5ID0gd2luZG93LmdldEhhbGZIZWlnaHQoKSkgPT4gIWN1cnNvciA/IG51bGwgOiBNYXRoLmF0YW4yKGN1cnNvci5wYWdlWCAtIHgsIGN1cnNvci5wYWdlWSAtIHkpIC0gTWF0aC5IYWxmUEksXG4gICAgZ2V0Q3Vyc29yOiAoKSA9PiAhY3Vyc29yID8gbnVsbCA6IHtcbiAgICAgIHg6IGN1cnNvci5wYWdlWCxcbiAgICAgIHk6IGN1cnNvci5wYWdlWSxcbiAgICAgIHY6IChNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRYKSArIE1hdGguYWJzKGN1cnNvci5tb3ZlbWVudFkpIC8gMilcbiAgICB9LFxuICAgIGdldFByZXNzZWQ6ICgpID0+IHByZXNzZWQsXG4gICAgZ2V0S2V5czogKCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgV0FMS19GT1JXQVJEOiAnS2V5VycsXG4gICAgICAgIFdBTEtfUklHSFQ6ICdLZXlEJyxcbiAgICAgICAgV0FMS19CQUNLV0FSRDogJ0tleVMnLFxuICAgICAgICBXQUxLX0xFRlQ6ICdLZXlBJyxcbiAgICAgICAgTUVUQTogJ01ldGEnLFxuICAgICAgICBTSE9XX09VVFBVVDogJ1RhYidcbiAgICAgIH1cbiAgICB9XG4gIH07XG59KSgpO1xuXG5jb25zdCBzY3JlZW4gPSBidWlsZFNjcmVlbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NyZWVuJykpO1xuY29uc3QgZGlzcGxheSA9IGJ1aWxkRGlzcGxheShzY3JlZW4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdXRwdXQnKSk7XG5jb25zdCBwbGF5ZXIgPSB7eDogd2luZG93LmdldEhhbGZXaWR0aCgpLCB5OiB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpLCBhOiAwLCBzcGVlZDogMn07XG5cbnNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3QgcHJlc3NlZCA9IElOUFVULmdldFByZXNzZWQoKTtcbiAgcGxheWVyLmEgPSBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUoKTtcbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfRk9SV0FSRCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hLCAtcGxheWVyLnNwZWVkKTtcbiAgICBwbGF5ZXIueSArPSBNYXRoLnRyaWdZKHBsYXllci5hLCAtcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19SSUdIVCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hICsgTWF0aC5IYWxmUEksIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSArIE1hdGguSGFsZlBJLCBwbGF5ZXIuc3BlZWQpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5XQUxLX0JBQ0tXQVJEKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEsICtwbGF5ZXIuc3BlZWQpO1xuICAgIHBsYXllci55ICs9IE1hdGgudHJpZ1kocGxheWVyLmEsICtwbGF5ZXIuc3BlZWQpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5XQUxLX0xFRlQpKSB7XG4gICAgcGxheWVyLnggKz0gTWF0aC50cmlnWChwbGF5ZXIuYSArIE1hdGguSGFsZlBJLCAtcGxheWVyLnNwZWVkKTtcbiAgICBwbGF5ZXIueSArPSBNYXRoLnRyaWdZKHBsYXllci5hICsgTWF0aC5IYWxmUEksIC1wbGF5ZXIuc3BlZWQpO1xuICB9XG59LCAxMDAgLyAxMDAwKTtcblxuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICBjb25zdCBjdXJzb3IgPSBJTlBVVC5nZXRDdXJzb3IoKTtcbiAgZGlzcGxheS5yZW5kZXJPdXRwdXQoKTtcbiAgc2NyZWVuLnBhbihwbGF5ZXIueCwgcGxheWVyLnksIHBsYXllci5hKTtcbiAgc2NyZWVuLmNsZWFyKCk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KHdpbmRvdy5nZXRIYWxmV2lkdGgoKSwgd2luZG93LmdldEhhbGZIZWlnaHQoKSwgMCwgJ1RoZSBDZW50ZXInLCBDT0xPUlMuUkVEKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMCwgMCwgLXBsYXllci5hIC0gTWF0aC5IYWxmUEksICdBJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDEwMCwgMTAwLCAwLCAnQicpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgxMDAsIDIwMCwgMCwgJ0MnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMjAwLCAxMDAsIDAsICdEJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDIwMCwgMjAwLCAwLCAnRScpO1xufSwgNjAgLyAxMDAwKTtcblxuZnVuY3Rpb24gYnVpbGRTY3JlZW4oY2FudmFzKSB7XG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBsZXQgb2Zmc2V0ID0ge3g6IDAsIHk6IDAsIGE6IE1hdGguSGFsZlBJfTtcbiAgcmV0dXJuIHtcbiAgICBwYW46ICh4LCB5LCBhKSA9PiBPYmplY3QuYXNzaWduKG9mZnNldCwge3gsIHksIGE6IGEgLSBNYXRoLkhhbGZQSX0pLFxuICAgIHJlc2l6ZTogKHdpZHRoLCBoZWlnaHQpID0+IE9iamVjdC5hc3NpZ24oY2FudmFzLCB7d2lkdGgsIGhlaWdodH0pLFxuICAgIGNsZWFyOiAoKSA9PiB7XG4gICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICBjdHguZmlsbFN0eWxlID0gQ09MT1JTLkJMQUNLO1xuICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfSxcbiAgICByZW5kZXJUZXh0OiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgYW5nbGUsIHQsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBjO1xuICAgICAgY3R4LnRyYW5zbGF0ZSh4LCB5KTtcbiAgICAgIGN0eC5yb3RhdGUoYW5nbGUpO1xuICAgICAgY3R4LmZpbGxUZXh0KHQsIDAsIDApO1xuICAgIH0pLFxuICAgIHJlbmRlckNpcmNsZTogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIHJhZGl1cywgYyA9IENPTE9SUy5XSElURSkgPT4ge1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LmFyYyh4LCB5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGM7XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSlcbiAgfTtcblxuICBmdW5jdGlvbiByZW5kZXIoY2IpIHtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGN0eC50cmFuc2xhdGUob2Zmc2V0LngsIG9mZnNldC55KTtcbiAgICBjdHgucm90YXRlKG9mZnNldC5hKTtcbiAgICBjYi5hcHBseShudWxsLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRGlzcGxheShzY3JlZW4sIG91dHB1dCkge1xuICBkb2N1bWVudC5vbmNvbnRleHRtZW51ID0gb3ZlcnJpZGVFdmVudCgpO1xuICBkb2N1bWVudC5vbnNlbGVjdHN0YXJ0ID0gb3ZlcnJpZGVFdmVudCgpO1xuICB3aW5kb3cub25yZXNpemUgPSBlID0+IHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHJldHVybiB7XG4gICAgcmVuZGVyT3V0cHV0OiAoKSA9PiB7XG4gICAgICBvdXRwdXQuc3R5bGUuZGlzcGxheSA9IElOUFVULmdldFByZXNzZWQoKS5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuU0hPV19PVVRQVVQpID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgIG91dHB1dC5pbm5lclRleHQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHByZXNzZWQ6IElOUFVULmdldFByZXNzZWQoKSxcbiAgICAgICAgYXJjOiBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUoKSxcbiAgICAgICAgcGxheWVyXG4gICAgICB9LCBudWxsLCAyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlRXZlbnQoY2IgPSAoKSA9PiBmYWxzZSkge1xuICByZXR1cm4gZSA9PiAoZS5rZXkgIT09IElOUFVULmdldEtleXMoKS5NRVRBKSAmJiAoZS5wcmV2ZW50RGVmYXVsdCgpIHx8IGNiKGUpIHx8IGZhbHNlKTtcbn1cbiJdfQ==
