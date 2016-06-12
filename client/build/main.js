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
    calcCursorAngle: (x = window.getHalfWidth(), y = window.getHalfHeight()) => !cursor ? null : -Math.atan2(cursor.pageX - x, cursor.pageY - y) - Math.HalfPI,
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
const player = {x: 0, y: 0, a: 0, speed: 2};

setInterval(() => {
  const pressed = INPUT.getPressed();
  player.a = INPUT.calcCursorAngle();
  if (pressed.includes(INPUT.getKeys().WALK_FORWARD)) {
    player.x += Math.trigX(player.a, -player.speed);
    player.y += Math.trigY(player.a, -player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_RIGHT)) {
    player.x += Math.trigX(player.a - Math.HalfPI, player.speed);
    player.y += Math.trigY(player.a - Math.HalfPI, player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_BACKWARD)) {
    player.x += Math.trigX(player.a, player.speed);
    player.y += Math.trigY(player.a, player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_LEFT)) {
    player.x += Math.trigX(player.a - Math.HalfPI, -player.speed);
    player.y += Math.trigY(player.a - Math.HalfPI, -player.speed);
  }
}, 100 / 1000);

setInterval(() => {
  const cursor = INPUT.getCursor();
  display.renderOutput();
  screen.pan(player.x, player.y, player.a);
  screen.clear();
  if (cursor) {
    screen.renderCircle(cursor.x + player.x, cursor.y + player.y, 5);
  }
  screen.renderText(window.getHalfWidth(), window.getHalfHeight(), 0, 'The Center', COLORS.RED);
  screen.renderText(window.getHalfWidth() + player.x, window.getHalfHeight() + player.y, Math.HalfPI+player.a, '@');
  screen.renderText(100, 100, 0, 'A');
  screen.renderText(100, 200, 0, 'B');
  screen.renderText(200, 100, 0, 'C');
  screen.renderText(200, 200, 0, 'D');
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
    ctx.translate(window.getHalfWidth(), window.getHalfHeight());
    ctx.rotate(-offset.a);
    ctx.translate(-window.getHalfWidth(), -window.getHalfHeight());
    ctx.translate(-offset.x, -offset.y);
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
        arc: INPUT.calcCursorAngle(player.x, player.y),
        player
      }, null, 2);
    }
  };
}

function overrideEvent(cb = () => false) {
  return e => (e.key !== INPUT.getKeys().META) && (e.preventDefault() || cb(e) || false);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5NYXRoLkZsb29yRXhwb25lbnRpYWwgPSBuID0+IG4udG9TdHJpbmcoKS5pbmRleE9mKCdlLScpICE9PSAtMSA/IDAgOiBuO1xuTWF0aC50cmlnWCA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLmNvcyhyYWRzKSAqIHZlbCk7XG5NYXRoLnRyaWdZID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguc2luKHJhZHMpICogdmVsKTtcbk1hdGguSGFsZlBJID0gTWF0aC5QSSAvIDI7XG5cbkFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiB0aGlzLmluY2x1ZGVzKHZhbCkgPyBudWxsIDogdGhpcy5wdXNoKHZhbCk7XG59O1xuQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IHRoaXMuc3BsaWNlKHRoaXMuaW5kZXhPZih2YWwpLCAxKSA6IG51bGw7XG59O1xuXG53aW5kb3cuZ2V0SGFsZldpZHRoID0gKCkgPT4gd2luZG93LmlubmVyV2lkdGggLyAyO1xud2luZG93LmdldEhhbGZIZWlnaHQgPSAoKSA9PiB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyO1xuXG5jb25zdCBDT0xPUlMgPSB7XG4gIEJMQUNLOiAnIzAwMDAwMCcsXG4gIFdISVRFOiAnI2ZmZmZmZicsXG4gIFJFRDogJyNmZjAwMDAnXG59O1xuXG5jb25zdCBJTlBVVCA9ICgoKSA9PiB7XG4gIGNvbnN0IG1vdXNlQnV0dG9ucyA9IFsnTW91c2VMZWZ0JywgJ01vdXNlTWlkZGxlJywgJ01vdXNlUmlnaHQnXTtcbiAgLyoqXG4gICAqIEB0eXBlIHtvYmplY3R9XG4gICAqIEBwcm9wIHtpbnR9IG1vdmVtZW50WFxuICAgKiBAcHJvcCB7aW50fSBtb3ZlbWVudFlcbiAgICovXG4gIGxldCBjdXJzb3IgPSBudWxsO1xuICBsZXQgcHJlc3NlZCA9IFtdO1xuICBkb2N1bWVudC5vbm1vdXNlbW92ZSA9IG92ZXJyaWRlRXZlbnQoZSA9PiBjdXJzb3IgPSBlKTtcbiAgZG9jdW1lbnQub25rZXlkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKGUuY29kZSkpO1xuICBkb2N1bWVudC5vbmtleXVwID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQucmVtb3ZlKGUuY29kZSkpO1xuICBkb2N1bWVudC5vbm1vdXNlZG93biA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLmFkZChtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gIGRvY3VtZW50Lm9ubW91c2V1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gIHJldHVybiB7XG4gICAgY2FsY0N1cnNvckFuZ2xlOiAoeCA9IHdpbmRvdy5nZXRIYWxmV2lkdGgoKSwgeSA9IHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCkpID0+ICFjdXJzb3IgPyBudWxsIDogLU1hdGguYXRhbjIoY3Vyc29yLnBhZ2VYIC0geCwgY3Vyc29yLnBhZ2VZIC0geSkgLSBNYXRoLkhhbGZQSSxcbiAgICBnZXRDdXJzb3I6ICgpID0+ICFjdXJzb3IgPyBudWxsIDoge1xuICAgICAgeDogY3Vyc29yLnBhZ2VYLFxuICAgICAgeTogY3Vyc29yLnBhZ2VZLFxuICAgICAgdjogKE1hdGguYWJzKGN1cnNvci5tb3ZlbWVudFgpICsgTWF0aC5hYnMoY3Vyc29yLm1vdmVtZW50WSkgLyAyKVxuICAgIH0sXG4gICAgZ2V0UHJlc3NlZDogKCkgPT4gcHJlc3NlZCxcbiAgICBnZXRLZXlzOiAoKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBXQUxLX0ZPUldBUkQ6ICdLZXlXJyxcbiAgICAgICAgV0FMS19SSUdIVDogJ0tleUQnLFxuICAgICAgICBXQUxLX0JBQ0tXQVJEOiAnS2V5UycsXG4gICAgICAgIFdBTEtfTEVGVDogJ0tleUEnLFxuICAgICAgICBNRVRBOiAnTWV0YScsXG4gICAgICAgIFNIT1dfT1VUUFVUOiAnVGFiJ1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0pKCk7XG5cbmNvbnN0IHNjcmVlbiA9IGJ1aWxkU2NyZWVuKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JlZW4nKSk7XG5jb25zdCBkaXNwbGF5ID0gYnVpbGREaXNwbGF5KHNjcmVlbiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ291dHB1dCcpKTtcbmNvbnN0IHBsYXllciA9IHt4OiAwLCB5OiAwLCBhOiAwLCBzcGVlZDogMn07XG5cbnNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3QgcHJlc3NlZCA9IElOUFVULmdldFByZXNzZWQoKTtcbiAgcGxheWVyLmEgPSBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUoKTtcbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfRk9SV0FSRCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hLCAtcGxheWVyLnNwZWVkKTtcbiAgICBwbGF5ZXIueSArPSBNYXRoLnRyaWdZKHBsYXllci5hLCAtcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19SSUdIVCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hIC0gTWF0aC5IYWxmUEksIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSAtIE1hdGguSGFsZlBJLCBwbGF5ZXIuc3BlZWQpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5XQUxLX0JBQ0tXQVJEKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEsIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSwgcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19MRUZUKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEgLSBNYXRoLkhhbGZQSSwgLXBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSAtIE1hdGguSGFsZlBJLCAtcGxheWVyLnNwZWVkKTtcbiAgfVxufSwgMTAwIC8gMTAwMCk7XG5cbnNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3QgY3Vyc29yID0gSU5QVVQuZ2V0Q3Vyc29yKCk7XG4gIGRpc3BsYXkucmVuZGVyT3V0cHV0KCk7XG4gIHNjcmVlbi5wYW4ocGxheWVyLngsIHBsYXllci55LCBwbGF5ZXIuYSk7XG4gIHNjcmVlbi5jbGVhcigpO1xuICBpZiAoY3Vyc29yKSB7XG4gICAgc2NyZWVuLnJlbmRlckNpcmNsZShjdXJzb3IueCArIHBsYXllci54LCBjdXJzb3IueSArIHBsYXllci55LCA1KTtcbiAgfVxuICBzY3JlZW4ucmVuZGVyVGV4dCh3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCksIDAsICdUaGUgQ2VudGVyJywgQ09MT1JTLlJFRCk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KHdpbmRvdy5nZXRIYWxmV2lkdGgoKSArIHBsYXllci54LCB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpICsgcGxheWVyLnksIE1hdGguSGFsZlBJK3BsYXllci5hLCAnQCcpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgxMDAsIDEwMCwgMCwgJ0EnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMTAwLCAyMDAsIDAsICdCJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDIwMCwgMTAwLCAwLCAnQycpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgyMDAsIDIwMCwgMCwgJ0QnKTtcbn0sIDYwIC8gMTAwMCk7XG5cbmZ1bmN0aW9uIGJ1aWxkU2NyZWVuKGNhbnZhcykge1xuICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgbGV0IG9mZnNldCA9IHt4OiAwLCB5OiAwLCBhOiBNYXRoLkhhbGZQSX07XG4gIHJldHVybiB7XG4gICAgcGFuOiAoeCwgeSwgYSkgPT4gT2JqZWN0LmFzc2lnbihvZmZzZXQsIHt4LCB5LCBhOiBhIC0gTWF0aC5IYWxmUEl9KSxcbiAgICByZXNpemU6ICh3aWR0aCwgaGVpZ2h0KSA9PiBPYmplY3QuYXNzaWduKGNhbnZhcywge3dpZHRoLCBoZWlnaHR9KSxcbiAgICBjbGVhcjogKCkgPT4ge1xuICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IENPTE9SUy5CTEFDSztcbiAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH0sXG4gICAgcmVuZGVyVGV4dDogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIGFuZ2xlLCB0LCBjID0gQ09MT1JTLldISVRFKSA9PiB7XG4gICAgICBjdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gICAgICBjdHguZmlsbFN0eWxlID0gYztcbiAgICAgIGN0eC50cmFuc2xhdGUoeCwgeSk7XG4gICAgICBjdHgucm90YXRlKGFuZ2xlKTtcbiAgICAgIGN0eC5maWxsVGV4dCh0LCAwLCAwKTtcbiAgICB9KSxcbiAgICByZW5kZXJDaXJjbGU6IHJlbmRlci5iaW5kKG51bGwsICh4LCB5LCByYWRpdXMsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5hcmMoeCwgeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBjO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pXG4gIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGNiKSB7XG4gICAgY3R4LnNhdmUoKTtcbiAgICBjdHgudHJhbnNsYXRlKHdpbmRvdy5nZXRIYWxmV2lkdGgoKSwgd2luZG93LmdldEhhbGZIZWlnaHQoKSk7XG4gICAgY3R4LnJvdGF0ZSgtb2Zmc2V0LmEpO1xuICAgIGN0eC50cmFuc2xhdGUoLXdpbmRvdy5nZXRIYWxmV2lkdGgoKSwgLXdpbmRvdy5nZXRIYWxmSGVpZ2h0KCkpO1xuICAgIGN0eC50cmFuc2xhdGUoLW9mZnNldC54LCAtb2Zmc2V0LnkpO1xuICAgIGNiLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGREaXNwbGF5KHNjcmVlbiwgb3V0cHV0KSB7XG4gIGRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBvdmVycmlkZUV2ZW50KCk7XG4gIGRvY3VtZW50Lm9uc2VsZWN0c3RhcnQgPSBvdmVycmlkZUV2ZW50KCk7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IGUgPT4gc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgcmV0dXJuIHtcbiAgICByZW5kZXJPdXRwdXQ6ICgpID0+IHtcbiAgICAgIG91dHB1dC5zdHlsZS5kaXNwbGF5ID0gSU5QVVQuZ2V0UHJlc3NlZCgpLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5TSE9XX09VVFBVVCkgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgb3V0cHV0LmlubmVyVGV4dCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcHJlc3NlZDogSU5QVVQuZ2V0UHJlc3NlZCgpLFxuICAgICAgICBhcmM6IElOUFVULmNhbGNDdXJzb3JBbmdsZShwbGF5ZXIueCwgcGxheWVyLnkpLFxuICAgICAgICBwbGF5ZXJcbiAgICAgIH0sIG51bGwsIDIpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVFdmVudChjYiA9ICgpID0+IGZhbHNlKSB7XG4gIHJldHVybiBlID0+IChlLmtleSAhPT0gSU5QVVQuZ2V0S2V5cygpLk1FVEEpICYmIChlLnByZXZlbnREZWZhdWx0KCkgfHwgY2IoZSkgfHwgZmFsc2UpO1xufVxuIl19
