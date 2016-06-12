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
  let cursor = null;
  let pressed = [];
  document.onmousemove = overrideEvent(e => cursor = e);
  document.onkeydown = overrideEvent(e => pressed.add(e.code));
  document.onkeyup = overrideEvent(e => pressed.remove(e.code));
  document.onmousedown = overrideEvent(e => pressed.add(mouseButtons[e.which - 1]));
  document.onmouseup = overrideEvent(e => pressed.remove(mouseButtons[e.which - 1]));
  return {
    calcCursorAngle: (x = window.getHalfWidth(), y = window.getHalfHeight()) => !cursor ? null : -Math.atan2(cursor.pageX - x, cursor.pageY - y) - Math.HalfPI,
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
const player = {x: window.getHalfWidth(), y: window.getHalfHeight(), a: 0, speed: 2};

const updateLoop = setInterval(() => {
  const pressed = INPUT.getPressed();
  player.a = INPUT.calcCursorAngle(player.x, player.y);
  if (pressed.includes('KeyW')) {
    player.x += Math.trigX(player.a, -player.speed);
    player.y += Math.trigY(player.a, -player.speed);
  }
  if (pressed.includes('KeyA')) {
    player.x += Math.trigX(player.a + Math.HalfPI, player.speed);
    player.y += Math.trigY(player.a + Math.HalfPI, player.speed);
  }
  if (pressed.includes('KeyS')) {
    player.x += Math.trigX(player.a, +player.speed);
    player.y += Math.trigY(player.a, +player.speed);
  }
  if (pressed.includes('KeyD')) {
    player.x += Math.trigX(player.a + Math.HalfPI, -player.speed);
    player.y += Math.trigY(player.a + Math.HalfPI, -player.speed);
  }
}, 100 / 1000);

const renderLoop = setInterval(() => {
  const cursor = INPUT.getCursor();
  display.renderOutput();
  screen.pan(player.x, player.y, player.a);
  screen.clear();
  if (cursor) {
    screen.renderCircle(cursor.x, cursor.y, Math.max(3, cursor.v));
  }
  screen.renderText(window.getHalfWidth(), window.getHalfHeight(), 0, 'The Center', COLORS.RED);
  screen.renderText(player.x, player.y, player.a - Math.HalfPI, 'A');
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
      output.style.display = INPUT.getPressed().includes('Tab') ? 'block' : 'none';
      output.innerText = JSON.stringify({
        pressed: INPUT.getPressed(),
        arc: INPUT.calcCursorAngle(player.x, player.y),
        player
      }, null, 2);
    }
  };
}

function overrideEvent(cb = () => false) {
  return e => (e.key !== 'Meta') && (e.preventDefault() || cb(e) || false);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbk1hdGguRmxvb3JFeHBvbmVudGlhbCA9IG4gPT4gbi50b1N0cmluZygpLmluZGV4T2YoJ2UtJykgIT09IC0xID8gMCA6IG47XG5NYXRoLnRyaWdYID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguY29zKHJhZHMpICogdmVsKTtcbk1hdGgudHJpZ1kgPSAocmFkcywgdmVsKSA9PiBNYXRoLkZsb29yRXhwb25lbnRpYWwoTWF0aC5zaW4ocmFkcykgKiB2ZWwpO1xuTWF0aC5IYWxmUEkgPSBNYXRoLlBJIC8gMjtcblxuQXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IG51bGwgOiB0aGlzLnB1c2godmFsKTtcbn07XG5BcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gdGhpcy5zcGxpY2UodGhpcy5pbmRleE9mKHZhbCksIDEpIDogbnVsbDtcbn07XG5cbndpbmRvdy5nZXRIYWxmV2lkdGggPSAoKSA9PiB3aW5kb3cuaW5uZXJXaWR0aCAvIDI7XG53aW5kb3cuZ2V0SGFsZkhlaWdodCA9ICgpID0+IHdpbmRvdy5pbm5lckhlaWdodCAvIDI7XG5cbmNvbnN0IENPTE9SUyA9IHtcbiAgQkxBQ0s6ICcjMDAwMDAwJyxcbiAgV0hJVEU6ICcjZmZmZmZmJyxcbiAgUkVEOiAnI2ZmMDAwMCdcbn07XG5cbmNvbnN0IElOUFVUID0gKCgpID0+IHtcbiAgY29uc3QgbW91c2VCdXR0b25zID0gWydNb3VzZUxlZnQnLCAnTW91c2VNaWRkbGUnLCAnTW91c2VSaWdodCddO1xuICBsZXQgY3Vyc29yID0gbnVsbDtcbiAgbGV0IHByZXNzZWQgPSBbXTtcbiAgZG9jdW1lbnQub25tb3VzZW1vdmUgPSBvdmVycmlkZUV2ZW50KGUgPT4gY3Vyc29yID0gZSk7XG4gIGRvY3VtZW50Lm9ua2V5ZG93biA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLmFkZChlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25rZXl1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25tb3VzZWRvd24gPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQobW91c2VCdXR0b25zW2Uud2hpY2ggLSAxXSkpO1xuICBkb2N1bWVudC5vbm1vdXNldXAgPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5yZW1vdmUobW91c2VCdXR0b25zW2Uud2hpY2ggLSAxXSkpO1xuICByZXR1cm4ge1xuICAgIGNhbGNDdXJzb3JBbmdsZTogKHggPSB3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHkgPSB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpKSA9PiAhY3Vyc29yID8gbnVsbCA6IC1NYXRoLmF0YW4yKGN1cnNvci5wYWdlWCAtIHgsIGN1cnNvci5wYWdlWSAtIHkpIC0gTWF0aC5IYWxmUEksXG4gICAgZ2V0Q3Vyc29yOiAoKSA9PiAhY3Vyc29yID8gbnVsbCA6IHtcbiAgICAgIHg6IGN1cnNvci5wYWdlWCxcbiAgICAgIHk6IGN1cnNvci5wYWdlWSxcbiAgICAgIHY6IChNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRYKSArIE1hdGguYWJzKGN1cnNvci5tb3ZlbWVudFkpIC8gMilcbiAgICB9LFxuICAgIGdldFByZXNzZWQ6ICgpID0+IHByZXNzZWRcbiAgfTtcbn0pKCk7XG5cbmNvbnN0IHNjcmVlbiA9IGJ1aWxkU2NyZWVuKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JlZW4nKSk7XG5jb25zdCBkaXNwbGF5ID0gYnVpbGREaXNwbGF5KHNjcmVlbiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ291dHB1dCcpKTtcbmNvbnN0IHBsYXllciA9IHt4OiB3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHk6IHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCksIGE6IDAsIHNwZWVkOiAyfTtcblxuY29uc3QgdXBkYXRlTG9vcCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3QgcHJlc3NlZCA9IElOUFVULmdldFByZXNzZWQoKTtcbiAgcGxheWVyLmEgPSBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUocGxheWVyLngsIHBsYXllci55KTtcbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoJ0tleVcnKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEsIC1wbGF5ZXIuc3BlZWQpO1xuICAgIHBsYXllci55ICs9IE1hdGgudHJpZ1kocGxheWVyLmEsIC1wbGF5ZXIuc3BlZWQpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKCdLZXlBJykpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hICsgTWF0aC5IYWxmUEksIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSArIE1hdGguSGFsZlBJLCBwbGF5ZXIuc3BlZWQpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKCdLZXlTJykpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hLCArcGxheWVyLnNwZWVkKTtcbiAgICBwbGF5ZXIueSArPSBNYXRoLnRyaWdZKHBsYXllci5hLCArcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcygnS2V5RCcpKSB7XG4gICAgcGxheWVyLnggKz0gTWF0aC50cmlnWChwbGF5ZXIuYSArIE1hdGguSGFsZlBJLCAtcGxheWVyLnNwZWVkKTtcbiAgICBwbGF5ZXIueSArPSBNYXRoLnRyaWdZKHBsYXllci5hICsgTWF0aC5IYWxmUEksIC1wbGF5ZXIuc3BlZWQpO1xuICB9XG59LCAxMDAgLyAxMDAwKTtcblxuY29uc3QgcmVuZGVyTG9vcCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3QgY3Vyc29yID0gSU5QVVQuZ2V0Q3Vyc29yKCk7XG4gIGRpc3BsYXkucmVuZGVyT3V0cHV0KCk7XG4gIHNjcmVlbi5wYW4ocGxheWVyLngsIHBsYXllci55LCBwbGF5ZXIuYSk7XG4gIHNjcmVlbi5jbGVhcigpO1xuICBpZiAoY3Vyc29yKSB7XG4gICAgc2NyZWVuLnJlbmRlckNpcmNsZShjdXJzb3IueCwgY3Vyc29yLnksIE1hdGgubWF4KDMsIGN1cnNvci52KSk7XG4gIH1cbiAgc2NyZWVuLnJlbmRlclRleHQod2luZG93LmdldEhhbGZXaWR0aCgpLCB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpLCAwLCAnVGhlIENlbnRlcicsIENPTE9SUy5SRUQpO1xuICBzY3JlZW4ucmVuZGVyVGV4dChwbGF5ZXIueCwgcGxheWVyLnksIHBsYXllci5hIC0gTWF0aC5IYWxmUEksICdBJyk7XG59LCA2MCAvIDEwMDApO1xuXG5mdW5jdGlvbiBidWlsZFNjcmVlbihjYW52YXMpIHtcbiAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIGxldCBvZmZzZXQgPSB7eDogMCwgeTogMCwgYTogTWF0aC5IYWxmUEl9O1xuICByZXR1cm4ge1xuICAgIHBhbjogKHgsIHksIGEpID0+IE9iamVjdC5hc3NpZ24ob2Zmc2V0LCB7eCwgeSwgYTogYSAtIE1hdGguSGFsZlBJfSksXG4gICAgcmVzaXplOiAod2lkdGgsIGhlaWdodCkgPT4gT2JqZWN0LmFzc2lnbihjYW52YXMsIHt3aWR0aCwgaGVpZ2h0fSksXG4gICAgY2xlYXI6ICgpID0+IHtcbiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBDT0xPUlMuQkxBQ0s7XG4gICAgICBjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9LFxuICAgIHJlbmRlclRleHQ6IHJlbmRlci5iaW5kKG51bGwsICh4LCB5LCBhbmdsZSwgdCwgYyA9IENPTE9SUy5XSElURSkgPT4ge1xuICAgICAgY3R4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuICAgICAgY3R4LnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IGM7XG4gICAgICBjdHgudHJhbnNsYXRlKHgsIHkpO1xuICAgICAgY3R4LnJvdGF0ZShhbmdsZSk7XG4gICAgICBjdHguZmlsbFRleHQodCwgMCwgMCk7XG4gICAgfSksXG4gICAgcmVuZGVyQ2lyY2xlOiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgcmFkaXVzLCBjID0gQ09MT1JTLldISVRFKSA9PiB7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHguYXJjKHgsIHksIHJhZGl1cywgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgY3R4LnN0cm9rZVN0eWxlID0gYztcbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9KVxuICB9O1xuXG4gIGZ1bmN0aW9uIHJlbmRlcihjYikge1xuICAgIGN0eC5zYXZlKCk7XG4gICAgY2IuYXBwbHkobnVsbCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgY3R4LnJlc3RvcmUoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZERpc3BsYXkoc2NyZWVuLCBvdXRwdXQpIHtcbiAgZG9jdW1lbnQub25jb250ZXh0bWVudSA9IG92ZXJyaWRlRXZlbnQoKTtcbiAgZG9jdW1lbnQub25zZWxlY3RzdGFydCA9IG92ZXJyaWRlRXZlbnQoKTtcbiAgd2luZG93Lm9ucmVzaXplID0gZSA9PiBzY3JlZW4ucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICBzY3JlZW4ucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICByZXR1cm4ge1xuICAgIHJlbmRlck91dHB1dDogKCkgPT4ge1xuICAgICAgb3V0cHV0LnN0eWxlLmRpc3BsYXkgPSBJTlBVVC5nZXRQcmVzc2VkKCkuaW5jbHVkZXMoJ1RhYicpID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgIG91dHB1dC5pbm5lclRleHQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHByZXNzZWQ6IElOUFVULmdldFByZXNzZWQoKSxcbiAgICAgICAgYXJjOiBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUocGxheWVyLngsIHBsYXllci55KSxcbiAgICAgICAgcGxheWVyXG4gICAgICB9LCBudWxsLCAyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlRXZlbnQoY2IgPSAoKSA9PiBmYWxzZSkge1xuICByZXR1cm4gZSA9PiAoZS5rZXkgIT09ICdNZXRhJykgJiYgKGUucHJldmVudERlZmF1bHQoKSB8fCBjYihlKSB8fCBmYWxzZSk7XG59XG4iXX0=
