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
  window.onblur = e => pressed = [];
  document.onmousemove = overrideEvent(e => cursor = e);
  document.onkeydown = overrideEvent(e => pressed.add(e.code));
  document.onkeyup = overrideEvent(e => pressed.remove(e.code));
  document.onmousedown = overrideEvent(e => pressed.add(mouseButtons[e.which - 1]));
  document.onmouseup = overrideEvent(e => pressed.remove(mouseButtons[e.which - 1]));
  return {
    calcCursorAngle: (x = window.getHalfWidth(), y = window.getHalfHeight()) => !cursor ? null : Math.atan2(cursor.pageX - x, cursor.pageY - y),
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
    player.x += Math.trigX(player.a, player.speed);
    player.y += Math.trigY(player.a, player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_RIGHT)) {
    player.x += Math.trigX(player.a - Math.HalfPI, -player.speed);
    player.y += Math.trigY(player.a - Math.HalfPI, -player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_BACKWARD)) {
    player.x += Math.trigX(player.a, -player.speed);
    player.y += Math.trigY(player.a, -player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_LEFT)) {
    player.x += Math.trigX(player.a - Math.HalfPI, player.speed);
    player.y += Math.trigY(player.a - Math.HalfPI, player.speed);
  }
}, 100 / 1000);

setInterval(() => {
  display.renderOutput();
  screen.pan(player.x, player.y, player.a);
  screen.clear();
  screen.renderText(window.getHalfWidth(), window.getHalfHeight(), 0, 'The Center', COLORS.RED);
  screen.renderText(window.getHalfWidth() + player.x, window.getHalfHeight() + player.y, player.a, '>');
  screen.renderText(100, 100, 0, 'A');
  screen.renderText(100, 200, 0, 'B');
  screen.renderText(200, 100, 0, 'C');
  screen.renderText(200, 200, 0, 'D');
}, 60 / 1000);

function buildScreen(canvas) {
  const ctx = canvas.getContext('2d');
  let offset = {x: 0, y: 0, a: 0};
  return {
    pan: (x, y, a) => Object.assign(offset, {x, y, a}),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5NYXRoLkZsb29yRXhwb25lbnRpYWwgPSBuID0+IG4udG9TdHJpbmcoKS5pbmRleE9mKCdlLScpICE9PSAtMSA/IDAgOiBuO1xuTWF0aC50cmlnWCA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLmNvcyhyYWRzKSAqIHZlbCk7XG5NYXRoLnRyaWdZID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguc2luKHJhZHMpICogdmVsKTtcbk1hdGguSGFsZlBJID0gTWF0aC5QSSAvIDI7XG5cbkFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiB0aGlzLmluY2x1ZGVzKHZhbCkgPyBudWxsIDogdGhpcy5wdXNoKHZhbCk7XG59O1xuQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IHRoaXMuc3BsaWNlKHRoaXMuaW5kZXhPZih2YWwpLCAxKSA6IG51bGw7XG59O1xuXG53aW5kb3cuZ2V0SGFsZldpZHRoID0gKCkgPT4gd2luZG93LmlubmVyV2lkdGggLyAyO1xud2luZG93LmdldEhhbGZIZWlnaHQgPSAoKSA9PiB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyO1xuXG5jb25zdCBDT0xPUlMgPSB7XG4gIEJMQUNLOiAnIzAwMDAwMCcsXG4gIFdISVRFOiAnI2ZmZmZmZicsXG4gIFJFRDogJyNmZjAwMDAnXG59O1xuXG5jb25zdCBJTlBVVCA9ICgoKSA9PiB7XG4gIGNvbnN0IG1vdXNlQnV0dG9ucyA9IFsnTW91c2VMZWZ0JywgJ01vdXNlTWlkZGxlJywgJ01vdXNlUmlnaHQnXTtcbiAgLyoqXG4gICAqIEB0eXBlIHtvYmplY3R9XG4gICAqIEBwcm9wIHtpbnR9IG1vdmVtZW50WFxuICAgKiBAcHJvcCB7aW50fSBtb3ZlbWVudFlcbiAgICovXG4gIGxldCBjdXJzb3IgPSBudWxsO1xuICBsZXQgcHJlc3NlZCA9IFtdO1xuICB3aW5kb3cub25ibHVyID0gZSA9PiBwcmVzc2VkID0gW107XG4gIGRvY3VtZW50Lm9ubW91c2Vtb3ZlID0gb3ZlcnJpZGVFdmVudChlID0+IGN1cnNvciA9IGUpO1xuICBkb2N1bWVudC5vbmtleWRvd24gPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ua2V5dXAgPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5yZW1vdmUoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ubW91c2Vkb3duID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQuYWRkKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgZG9jdW1lbnQub25tb3VzZXVwID0gb3ZlcnJpZGVFdmVudChlID0+IHByZXNzZWQucmVtb3ZlKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgcmV0dXJuIHtcbiAgICBjYWxjQ3Vyc29yQW5nbGU6ICh4ID0gd2luZG93LmdldEhhbGZXaWR0aCgpLCB5ID0gd2luZG93LmdldEhhbGZIZWlnaHQoKSkgPT4gIWN1cnNvciA/IG51bGwgOiBNYXRoLmF0YW4yKGN1cnNvci5wYWdlWCAtIHgsIGN1cnNvci5wYWdlWSAtIHkpLFxuICAgIGdldEN1cnNvcjogKCkgPT4gIWN1cnNvciA/IG51bGwgOiB7XG4gICAgICB4OiBjdXJzb3IucGFnZVgsXG4gICAgICB5OiBjdXJzb3IucGFnZVksXG4gICAgICB2OiAoTWF0aC5hYnMoY3Vyc29yLm1vdmVtZW50WCkgKyBNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRZKSAvIDIpXG4gICAgfSxcbiAgICBnZXRQcmVzc2VkOiAoKSA9PiBwcmVzc2VkLFxuICAgIGdldEtleXM6ICgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFdBTEtfRk9SV0FSRDogJ0tleVcnLFxuICAgICAgICBXQUxLX1JJR0hUOiAnS2V5RCcsXG4gICAgICAgIFdBTEtfQkFDS1dBUkQ6ICdLZXlTJyxcbiAgICAgICAgV0FMS19MRUZUOiAnS2V5QScsXG4gICAgICAgIE1FVEE6ICdNZXRhJyxcbiAgICAgICAgU0hPV19PVVRQVVQ6ICdUYWInXG4gICAgICB9XG4gICAgfVxuICB9O1xufSkoKTtcblxuY29uc3Qgc2NyZWVuID0gYnVpbGRTY3JlZW4oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmVlbicpKTtcbmNvbnN0IGRpc3BsYXkgPSBidWlsZERpc3BsYXkoc2NyZWVuLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3V0cHV0JykpO1xuY29uc3QgcGxheWVyID0ge3g6IDAsIHk6IDAsIGE6IDAsIHNwZWVkOiAyfTtcblxuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICBjb25zdCBwcmVzc2VkID0gSU5QVVQuZ2V0UHJlc3NlZCgpO1xuICBwbGF5ZXIuYSA9IElOUFVULmNhbGNDdXJzb3JBbmdsZSgpO1xuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19GT1JXQVJEKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEsIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSwgcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19SSUdIVCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hIC0gTWF0aC5IYWxmUEksIC1wbGF5ZXIuc3BlZWQpO1xuICAgIHBsYXllci55ICs9IE1hdGgudHJpZ1kocGxheWVyLmEgLSBNYXRoLkhhbGZQSSwgLXBsYXllci5zcGVlZCk7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfQkFDS1dBUkQpKSB7XG4gICAgcGxheWVyLnggKz0gTWF0aC50cmlnWChwbGF5ZXIuYSwgLXBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSwgLXBsYXllci5zcGVlZCk7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfTEVGVCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hIC0gTWF0aC5IYWxmUEksIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSAtIE1hdGguSGFsZlBJLCBwbGF5ZXIuc3BlZWQpO1xuICB9XG59LCAxMDAgLyAxMDAwKTtcblxuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICBkaXNwbGF5LnJlbmRlck91dHB1dCgpO1xuICBzY3JlZW4ucGFuKHBsYXllci54LCBwbGF5ZXIueSwgcGxheWVyLmEpO1xuICBzY3JlZW4uY2xlYXIoKTtcbiAgc2NyZWVuLnJlbmRlclRleHQod2luZG93LmdldEhhbGZXaWR0aCgpLCB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpLCAwLCAnVGhlIENlbnRlcicsIENPTE9SUy5SRUQpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCh3aW5kb3cuZ2V0SGFsZldpZHRoKCkgKyBwbGF5ZXIueCwgd2luZG93LmdldEhhbGZIZWlnaHQoKSArIHBsYXllci55LCBwbGF5ZXIuYSwgJz4nKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMTAwLCAxMDAsIDAsICdBJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDEwMCwgMjAwLCAwLCAnQicpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgyMDAsIDEwMCwgMCwgJ0MnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMjAwLCAyMDAsIDAsICdEJyk7XG59LCA2MCAvIDEwMDApO1xuXG5mdW5jdGlvbiBidWlsZFNjcmVlbihjYW52YXMpIHtcbiAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIGxldCBvZmZzZXQgPSB7eDogMCwgeTogMCwgYTogMH07XG4gIHJldHVybiB7XG4gICAgcGFuOiAoeCwgeSwgYSkgPT4gT2JqZWN0LmFzc2lnbihvZmZzZXQsIHt4LCB5LCBhfSksXG4gICAgcmVzaXplOiAod2lkdGgsIGhlaWdodCkgPT4gT2JqZWN0LmFzc2lnbihjYW52YXMsIHt3aWR0aCwgaGVpZ2h0fSksXG4gICAgY2xlYXI6ICgpID0+IHtcbiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBDT0xPUlMuQkxBQ0s7XG4gICAgICBjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9LFxuICAgIHJlbmRlclRleHQ6IHJlbmRlci5iaW5kKG51bGwsICh4LCB5LCBhbmdsZSwgdCwgYyA9IENPTE9SUy5XSElURSkgPT4ge1xuICAgICAgY3R4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuICAgICAgY3R4LnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IGM7XG4gICAgICBjdHgudHJhbnNsYXRlKHgsIHkpO1xuICAgICAgY3R4LnJvdGF0ZShhbmdsZSk7XG4gICAgICBjdHguZmlsbFRleHQodCwgMCwgMCk7XG4gICAgfSksXG4gICAgcmVuZGVyQ2lyY2xlOiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgcmFkaXVzLCBjID0gQ09MT1JTLldISVRFKSA9PiB7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHguYXJjKHgsIHksIHJhZGl1cywgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgY3R4LnN0cm9rZVN0eWxlID0gYztcbiAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9KVxuICB9O1xuXG4gIGZ1bmN0aW9uIHJlbmRlcihjYikge1xuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LnRyYW5zbGF0ZSh3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCkpO1xuICAgIGN0eC5yb3RhdGUoLW9mZnNldC5hKTtcbiAgICBjdHgudHJhbnNsYXRlKC13aW5kb3cuZ2V0SGFsZldpZHRoKCksIC13aW5kb3cuZ2V0SGFsZkhlaWdodCgpKTtcbiAgICBjdHgudHJhbnNsYXRlKC1vZmZzZXQueCwgLW9mZnNldC55KTtcbiAgICBjYi5hcHBseShudWxsLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRGlzcGxheShzY3JlZW4sIG91dHB1dCkge1xuICBkb2N1bWVudC5vbmNvbnRleHRtZW51ID0gb3ZlcnJpZGVFdmVudCgpO1xuICBkb2N1bWVudC5vbnNlbGVjdHN0YXJ0ID0gb3ZlcnJpZGVFdmVudCgpO1xuICB3aW5kb3cub25yZXNpemUgPSBlID0+IHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHJldHVybiB7XG4gICAgcmVuZGVyT3V0cHV0OiAoKSA9PiB7XG4gICAgICBvdXRwdXQuc3R5bGUuZGlzcGxheSA9IElOUFVULmdldFByZXNzZWQoKS5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuU0hPV19PVVRQVVQpID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgIG91dHB1dC5pbm5lclRleHQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHByZXNzZWQ6IElOUFVULmdldFByZXNzZWQoKSxcbiAgICAgICAgYXJjOiBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUoKSxcbiAgICAgICAgcGxheWVyXG4gICAgICB9LCBudWxsLCAyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlRXZlbnQoY2IgPSAoKSA9PiBmYWxzZSkge1xuICByZXR1cm4gZSA9PiAoZS5rZXkgIT09IElOUFVULmdldEtleXMoKS5NRVRBKSAmJiAoZS5wcmV2ZW50RGVmYXVsdCgpIHx8IGNiKGUpIHx8IGZhbHNlKTtcbn1cbiJdfQ==
