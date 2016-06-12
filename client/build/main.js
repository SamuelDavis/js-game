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
  document.onmousemove = disableEvent(e => cursor = e);
  document.onkeydown = disableEvent(e => pressed.add(e.code));
  document.onkeyup = disableEvent(e => pressed.remove(e.code));
  document.onmousedown = disableEvent(e => pressed.add(mouseButtons[e.which - 1]));
  document.onmouseup = disableEvent(e => pressed.remove(mouseButtons[e.which - 1]));
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
  document.oncontextmenu = disableEvent();
  document.onselectstart = disableEvent();
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

function disableEvent(cb = () => false) {
  return e => (e.key !== 'Meta') && (e.preventDefault() || cb(e) || false);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbk1hdGguRmxvb3JFeHBvbmVudGlhbCA9IG4gPT4gbi50b1N0cmluZygpLmluZGV4T2YoJ2UtJykgIT09IC0xID8gMCA6IG47XG5NYXRoLnRyaWdYID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguY29zKHJhZHMpICogdmVsKTtcbk1hdGgudHJpZ1kgPSAocmFkcywgdmVsKSA9PiBNYXRoLkZsb29yRXhwb25lbnRpYWwoTWF0aC5zaW4ocmFkcykgKiB2ZWwpO1xuTWF0aC5IYWxmUEkgPSBNYXRoLlBJIC8gMjtcblxuQXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IG51bGwgOiB0aGlzLnB1c2godmFsKTtcbn07XG5BcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gdGhpcy5zcGxpY2UodGhpcy5pbmRleE9mKHZhbCksIDEpIDogbnVsbDtcbn07XG5cbndpbmRvdy5nZXRIYWxmV2lkdGggPSAoKSA9PiB3aW5kb3cuaW5uZXJXaWR0aCAvIDI7XG53aW5kb3cuZ2V0SGFsZkhlaWdodCA9ICgpID0+IHdpbmRvdy5pbm5lckhlaWdodCAvIDI7XG5cbmNvbnN0IENPTE9SUyA9IHtcbiAgQkxBQ0s6ICcjMDAwMDAwJyxcbiAgV0hJVEU6ICcjZmZmZmZmJyxcbiAgUkVEOiAnI2ZmMDAwMCdcbn07XG5cbmNvbnN0IElOUFVUID0gKCgpID0+IHtcbiAgY29uc3QgbW91c2VCdXR0b25zID0gWydNb3VzZUxlZnQnLCAnTW91c2VNaWRkbGUnLCAnTW91c2VSaWdodCddO1xuICBsZXQgY3Vyc29yID0gbnVsbDtcbiAgbGV0IHByZXNzZWQgPSBbXTtcbiAgZG9jdW1lbnQub25tb3VzZW1vdmUgPSBkaXNhYmxlRXZlbnQoZSA9PiBjdXJzb3IgPSBlKTtcbiAgZG9jdW1lbnQub25rZXlkb3duID0gZGlzYWJsZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ua2V5dXAgPSBkaXNhYmxlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25tb3VzZWRvd24gPSBkaXNhYmxlRXZlbnQoZSA9PiBwcmVzc2VkLmFkZChtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gIGRvY3VtZW50Lm9ubW91c2V1cCA9IGRpc2FibGVFdmVudChlID0+IHByZXNzZWQucmVtb3ZlKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgcmV0dXJuIHtcbiAgICBjYWxjQ3Vyc29yQW5nbGU6ICh4ID0gd2luZG93LmdldEhhbGZXaWR0aCgpLCB5ID0gd2luZG93LmdldEhhbGZIZWlnaHQoKSkgPT4gIWN1cnNvciA/IG51bGwgOiAtTWF0aC5hdGFuMihjdXJzb3IucGFnZVggLSB4LCBjdXJzb3IucGFnZVkgLSB5KSAtIE1hdGguSGFsZlBJLFxuICAgIGdldEN1cnNvcjogKCkgPT4gIWN1cnNvciA/IG51bGwgOiB7XG4gICAgICB4OiBjdXJzb3IucGFnZVgsXG4gICAgICB5OiBjdXJzb3IucGFnZVksXG4gICAgICB2OiAoTWF0aC5hYnMoY3Vyc29yLm1vdmVtZW50WCkgKyBNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRZKSAvIDIpXG4gICAgfSxcbiAgICBnZXRQcmVzc2VkOiAoKSA9PiBwcmVzc2VkXG4gIH07XG59KSgpO1xuXG5jb25zdCBzY3JlZW4gPSBidWlsZFNjcmVlbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NyZWVuJykpO1xuY29uc3QgZGlzcGxheSA9IGJ1aWxkRGlzcGxheShzY3JlZW4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdXRwdXQnKSk7XG5jb25zdCBwbGF5ZXIgPSB7eDogd2luZG93LmdldEhhbGZXaWR0aCgpLCB5OiB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpLCBhOiAwLCBzcGVlZDogMn07XG5cbmNvbnN0IHVwZGF0ZUxvb3AgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gIGNvbnN0IHByZXNzZWQgPSBJTlBVVC5nZXRQcmVzc2VkKCk7XG4gIHBsYXllci5hID0gSU5QVVQuY2FsY0N1cnNvckFuZ2xlKHBsYXllci54LCBwbGF5ZXIueSk7XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKCdLZXlXJykpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hLCAtcGxheWVyLnNwZWVkKTtcbiAgICBwbGF5ZXIueSArPSBNYXRoLnRyaWdZKHBsYXllci5hLCAtcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcygnS2V5QScpKSB7XG4gICAgcGxheWVyLnggKz0gTWF0aC50cmlnWChwbGF5ZXIuYSArIE1hdGguSGFsZlBJLCBwbGF5ZXIuc3BlZWQpO1xuICAgIHBsYXllci55ICs9IE1hdGgudHJpZ1kocGxheWVyLmEgKyBNYXRoLkhhbGZQSSwgcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcygnS2V5UycpKSB7XG4gICAgcGxheWVyLnggKz0gTWF0aC50cmlnWChwbGF5ZXIuYSwgK3BsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSwgK3BsYXllci5zcGVlZCk7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoJ0tleUQnKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEgKyBNYXRoLkhhbGZQSSwgLXBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSArIE1hdGguSGFsZlBJLCAtcGxheWVyLnNwZWVkKTtcbiAgfVxufSwgMTAwIC8gMTAwMCk7XG5cbmNvbnN0IHJlbmRlckxvb3AgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gIGNvbnN0IGN1cnNvciA9IElOUFVULmdldEN1cnNvcigpO1xuICBkaXNwbGF5LnJlbmRlck91dHB1dCgpO1xuICBzY3JlZW4ucGFuKHBsYXllci54LCBwbGF5ZXIueSwgcGxheWVyLmEpO1xuICBzY3JlZW4uY2xlYXIoKTtcbiAgaWYgKGN1cnNvcikge1xuICAgIHNjcmVlbi5yZW5kZXJDaXJjbGUoY3Vyc29yLngsIGN1cnNvci55LCBNYXRoLm1heCgzLCBjdXJzb3IudikpO1xuICB9XG4gIHNjcmVlbi5yZW5kZXJUZXh0KHdpbmRvdy5nZXRIYWxmV2lkdGgoKSwgd2luZG93LmdldEhhbGZIZWlnaHQoKSwgMCwgJ1RoZSBDZW50ZXInLCBDT0xPUlMuUkVEKTtcbiAgc2NyZWVuLnJlbmRlclRleHQocGxheWVyLngsIHBsYXllci55LCBwbGF5ZXIuYSAtIE1hdGguSGFsZlBJLCAnQScpO1xufSwgNjAgLyAxMDAwKTtcblxuZnVuY3Rpb24gYnVpbGRTY3JlZW4oY2FudmFzKSB7XG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBsZXQgb2Zmc2V0ID0ge3g6IDAsIHk6IDAsIGE6IE1hdGguSGFsZlBJfTtcbiAgcmV0dXJuIHtcbiAgICBwYW46ICh4LCB5LCBhKSA9PiBPYmplY3QuYXNzaWduKG9mZnNldCwge3gsIHksIGE6IGEgLSBNYXRoLkhhbGZQSX0pLFxuICAgIHJlc2l6ZTogKHdpZHRoLCBoZWlnaHQpID0+IE9iamVjdC5hc3NpZ24oY2FudmFzLCB7d2lkdGgsIGhlaWdodH0pLFxuICAgIGNsZWFyOiAoKSA9PiB7XG4gICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICBjdHguZmlsbFN0eWxlID0gQ09MT1JTLkJMQUNLO1xuICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfSxcbiAgICByZW5kZXJUZXh0OiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgYW5nbGUsIHQsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBjO1xuICAgICAgY3R4LnRyYW5zbGF0ZSh4LCB5KTtcbiAgICAgIGN0eC5yb3RhdGUoYW5nbGUpO1xuICAgICAgY3R4LmZpbGxUZXh0KHQsIDAsIDApO1xuICAgIH0pLFxuICAgIHJlbmRlckNpcmNsZTogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIHJhZGl1cywgYyA9IENPTE9SUy5XSElURSkgPT4ge1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LmFyYyh4LCB5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGM7XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSlcbiAgfTtcblxuICBmdW5jdGlvbiByZW5kZXIoY2IpIHtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGNiLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGREaXNwbGF5KHNjcmVlbiwgb3V0cHV0KSB7XG4gIGRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBkaXNhYmxlRXZlbnQoKTtcbiAgZG9jdW1lbnQub25zZWxlY3RzdGFydCA9IGRpc2FibGVFdmVudCgpO1xuICB3aW5kb3cub25yZXNpemUgPSBlID0+IHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHJldHVybiB7XG4gICAgcmVuZGVyT3V0cHV0OiAoKSA9PiB7XG4gICAgICBvdXRwdXQuc3R5bGUuZGlzcGxheSA9IElOUFVULmdldFByZXNzZWQoKS5pbmNsdWRlcygnVGFiJykgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgb3V0cHV0LmlubmVyVGV4dCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcHJlc3NlZDogSU5QVVQuZ2V0UHJlc3NlZCgpLFxuICAgICAgICBhcmM6IElOUFVULmNhbGNDdXJzb3JBbmdsZShwbGF5ZXIueCwgcGxheWVyLnkpLFxuICAgICAgICBwbGF5ZXJcbiAgICAgIH0sIG51bGwsIDIpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gZGlzYWJsZUV2ZW50KGNiID0gKCkgPT4gZmFsc2UpIHtcbiAgcmV0dXJuIGUgPT4gKGUua2V5ICE9PSAnTWV0YScpICYmIChlLnByZXZlbnREZWZhdWx0KCkgfHwgY2IoZSkgfHwgZmFsc2UpO1xufVxuIl19
