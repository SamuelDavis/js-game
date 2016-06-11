(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    calcCursorAngle: (x = window.innerWidth / 2, y = window.innerHeight / 2) => !cursor ? null : -Math.atan2(cursor.pageX - x, cursor.pageY - y) - Math.PI,
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
const player = {x: 0, y: 0, a: 0, speed: 2};
const updateLoop = setInterval(() => {
  const pressed = INPUT.getPressed();
  if (pressed.includes('KeyW')) {
    player.y -= player.speed;
  }
  if (pressed.includes('KeyA')) {
    player.x -= player.speed;
  }
  if (pressed.includes('KeyS')) {
    player.y += player.speed;
  }
  if (pressed.includes('KeyD')) {
    player.x += player.speed;
  }
  player.a = INPUT.calcCursorAngle();
}, 100 / 1000);

const renderLoop = setInterval(() => {
  const cursor = INPUT.getCursor();
  display.renderOutput();
  screen.pan(player.x, player.y);
  screen.clear();
  if (cursor) {
    screen.renderCircle(cursor.x + player.x, cursor.y + player.y, Math.max(5, cursor.v), COLORS.WHITE);
  }
  screen.renderText(window.innerWidth / 2 + player.x, window.innerHeight / 2 + player.y, INPUT.calcCursorAngle(), 'A');
  screen.renderText(window.innerWidth / 2, window.innerHeight / 2, 0, 'The Center', COLORS.RED);
}, 60 / 1000);

function buildScreen(canvas) {
  const ctx = canvas.getContext('2d');
  let offset = {x: 0, y: 0, a: 0};
  return {
    pan: (x, y, a) => Object.assign(offset, {x, y, a}),
    resize: (width, height) => Object.assign(canvas, {width, height}),
    clear: render.bind(null, () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.BLACK;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }),
    renderText: render.bind(null, (x, y, angle, t, c = COLORS.WHITE) => {
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = c;
      ctx.translate(x - offset.x, y - offset.y);
      ctx.rotate(angle);
      ctx.fillText(t, 0, 0);
    }),
    renderCircle: render.bind(null, (x, y, radius, c = COLORS.WHITE) => {
      ctx.beginPath();
      ctx.arc(x - offset.x, y - offset.y, radius, 0, 2 * Math.PI);
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
        arc: INPUT.calcCursorAngle()
      }, null, 2);
    }
  };
}

function disableEvent(cb = () => false) {
  return e => (e.key !== 'Meta') && (e.preventDefault() || cb(e) || false);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5NYXRoLkZsb29yRXhwb25lbnRpYWwgPSBuID0+IG4udG9TdHJpbmcoKS5pbmRleE9mKCdlLScpICE9PSAtMSA/IDAgOiBuO1xuTWF0aC50cmlnWCA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLmNvcyhyYWRzKSAqIHZlbCk7XG5NYXRoLnRyaWdZID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguc2luKHJhZHMpICogdmVsKTtcblxuQXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IG51bGwgOiB0aGlzLnB1c2godmFsKTtcbn07XG5BcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gdGhpcy5zcGxpY2UodGhpcy5pbmRleE9mKHZhbCksIDEpIDogbnVsbDtcbn07XG5cbmNvbnN0IENPTE9SUyA9IHtcbiAgQkxBQ0s6ICcjMDAwMDAwJyxcbiAgV0hJVEU6ICcjZmZmZmZmJyxcbiAgUkVEOiAnI2ZmMDAwMCdcbn07XG5cbmNvbnN0IElOUFVUID0gKCgpID0+IHtcbiAgY29uc3QgbW91c2VCdXR0b25zID0gWydNb3VzZUxlZnQnLCAnTW91c2VNaWRkbGUnLCAnTW91c2VSaWdodCddO1xuICBsZXQgY3Vyc29yID0gbnVsbDtcbiAgbGV0IHByZXNzZWQgPSBbXTtcbiAgZG9jdW1lbnQub25tb3VzZW1vdmUgPSBkaXNhYmxlRXZlbnQoZSA9PiBjdXJzb3IgPSBlKTtcbiAgZG9jdW1lbnQub25rZXlkb3duID0gZGlzYWJsZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ua2V5dXAgPSBkaXNhYmxlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25tb3VzZWRvd24gPSBkaXNhYmxlRXZlbnQoZSA9PiBwcmVzc2VkLmFkZChtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gIGRvY3VtZW50Lm9ubW91c2V1cCA9IGRpc2FibGVFdmVudChlID0+IHByZXNzZWQucmVtb3ZlKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgcmV0dXJuIHtcbiAgICBjYWxjQ3Vyc29yQW5nbGU6ICh4ID0gd2luZG93LmlubmVyV2lkdGggLyAyLCB5ID0gd2luZG93LmlubmVySGVpZ2h0IC8gMikgPT4gIWN1cnNvciA/IG51bGwgOiAtTWF0aC5hdGFuMihjdXJzb3IucGFnZVggLSB4LCBjdXJzb3IucGFnZVkgLSB5KSAtIE1hdGguUEksXG4gICAgZ2V0Q3Vyc29yOiAoKSA9PiAhY3Vyc29yID8gbnVsbCA6IHtcbiAgICAgIHg6IGN1cnNvci5wYWdlWCxcbiAgICAgIHk6IGN1cnNvci5wYWdlWSxcbiAgICAgIHY6IChNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRYKSArIE1hdGguYWJzKGN1cnNvci5tb3ZlbWVudFkpIC8gMilcbiAgICB9LFxuICAgIGdldFByZXNzZWQ6ICgpID0+IHByZXNzZWRcbiAgfTtcbn0pKCk7XG5cbmNvbnN0IHNjcmVlbiA9IGJ1aWxkU2NyZWVuKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JlZW4nKSk7XG5jb25zdCBkaXNwbGF5ID0gYnVpbGREaXNwbGF5KHNjcmVlbiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ291dHB1dCcpKTtcbmNvbnN0IHBsYXllciA9IHt4OiAwLCB5OiAwLCBhOiAwLCBzcGVlZDogMn07XG5jb25zdCB1cGRhdGVMb29wID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICBjb25zdCBwcmVzc2VkID0gSU5QVVQuZ2V0UHJlc3NlZCgpO1xuICBpZiAocHJlc3NlZC5pbmNsdWRlcygnS2V5VycpKSB7XG4gICAgcGxheWVyLnkgLT0gcGxheWVyLnNwZWVkO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKCdLZXlBJykpIHtcbiAgICBwbGF5ZXIueCAtPSBwbGF5ZXIuc3BlZWQ7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoJ0tleVMnKSkge1xuICAgIHBsYXllci55ICs9IHBsYXllci5zcGVlZDtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcygnS2V5RCcpKSB7XG4gICAgcGxheWVyLnggKz0gcGxheWVyLnNwZWVkO1xuICB9XG4gIHBsYXllci5hID0gSU5QVVQuY2FsY0N1cnNvckFuZ2xlKCk7XG59LCAxMDAgLyAxMDAwKTtcblxuY29uc3QgcmVuZGVyTG9vcCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3QgY3Vyc29yID0gSU5QVVQuZ2V0Q3Vyc29yKCk7XG4gIGRpc3BsYXkucmVuZGVyT3V0cHV0KCk7XG4gIHNjcmVlbi5wYW4ocGxheWVyLngsIHBsYXllci55KTtcbiAgc2NyZWVuLmNsZWFyKCk7XG4gIGlmIChjdXJzb3IpIHtcbiAgICBzY3JlZW4ucmVuZGVyQ2lyY2xlKGN1cnNvci54ICsgcGxheWVyLngsIGN1cnNvci55ICsgcGxheWVyLnksIE1hdGgubWF4KDUsIGN1cnNvci52KSwgQ09MT1JTLldISVRFKTtcbiAgfVxuICBzY3JlZW4ucmVuZGVyVGV4dCh3aW5kb3cuaW5uZXJXaWR0aCAvIDIgKyBwbGF5ZXIueCwgd2luZG93LmlubmVySGVpZ2h0IC8gMiArIHBsYXllci55LCBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUoKSwgJ0EnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQod2luZG93LmlubmVyV2lkdGggLyAyLCB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyLCAwLCAnVGhlIENlbnRlcicsIENPTE9SUy5SRUQpO1xufSwgNjAgLyAxMDAwKTtcblxuZnVuY3Rpb24gYnVpbGRTY3JlZW4oY2FudmFzKSB7XG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBsZXQgb2Zmc2V0ID0ge3g6IDAsIHk6IDAsIGE6IDB9O1xuICByZXR1cm4ge1xuICAgIHBhbjogKHgsIHksIGEpID0+IE9iamVjdC5hc3NpZ24ob2Zmc2V0LCB7eCwgeSwgYX0pLFxuICAgIHJlc2l6ZTogKHdpZHRoLCBoZWlnaHQpID0+IE9iamVjdC5hc3NpZ24oY2FudmFzLCB7d2lkdGgsIGhlaWdodH0pLFxuICAgIGNsZWFyOiByZW5kZXIuYmluZChudWxsLCAoKSA9PiB7XG4gICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICBjdHguZmlsbFN0eWxlID0gQ09MT1JTLkJMQUNLO1xuICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfSksXG4gICAgcmVuZGVyVGV4dDogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIGFuZ2xlLCB0LCBjID0gQ09MT1JTLldISVRFKSA9PiB7XG4gICAgICBjdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gICAgICBjdHguZmlsbFN0eWxlID0gYztcbiAgICAgIGN0eC50cmFuc2xhdGUoeCAtIG9mZnNldC54LCB5IC0gb2Zmc2V0LnkpO1xuICAgICAgY3R4LnJvdGF0ZShhbmdsZSk7XG4gICAgICBjdHguZmlsbFRleHQodCwgMCwgMCk7XG4gICAgfSksXG4gICAgcmVuZGVyQ2lyY2xlOiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgcmFkaXVzLCBjID0gQ09MT1JTLldISVRFKSA9PiB7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHguYXJjKHggLSBvZmZzZXQueCwgeSAtIG9mZnNldC55LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGM7XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSlcbiAgfTtcblxuICBmdW5jdGlvbiByZW5kZXIoY2IpIHtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGNiLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGREaXNwbGF5KHNjcmVlbiwgb3V0cHV0KSB7XG4gIGRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBkaXNhYmxlRXZlbnQoKTtcbiAgZG9jdW1lbnQub25zZWxlY3RzdGFydCA9IGRpc2FibGVFdmVudCgpO1xuICB3aW5kb3cub25yZXNpemUgPSBlID0+IHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHJldHVybiB7XG4gICAgcmVuZGVyT3V0cHV0OiAoKSA9PiB7XG4gICAgICBvdXRwdXQuc3R5bGUuZGlzcGxheSA9IElOUFVULmdldFByZXNzZWQoKS5pbmNsdWRlcygnVGFiJykgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgb3V0cHV0LmlubmVyVGV4dCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcHJlc3NlZDogSU5QVVQuZ2V0UHJlc3NlZCgpLFxuICAgICAgICBhcmM6IElOUFVULmNhbGNDdXJzb3JBbmdsZSgpXG4gICAgICB9LCBudWxsLCAyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGRpc2FibGVFdmVudChjYiA9ICgpID0+IGZhbHNlKSB7XG4gIHJldHVybiBlID0+IChlLmtleSAhPT0gJ01ldGEnKSAmJiAoZS5wcmV2ZW50RGVmYXVsdCgpIHx8IGNiKGUpIHx8IGZhbHNlKTtcbn1cbiJdfQ==
