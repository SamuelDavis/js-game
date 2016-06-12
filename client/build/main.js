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
const player = {x: window.getHalfWidth(), y: window.getHalfHeight(), a: 0, speed: 2};

setInterval(() => {
  const pressed = INPUT.getPressed();
  player.a = INPUT.calcCursorAngle(player.x, player.y);
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
  screen.renderText(window.getHalfWidth(), window.getHalfHeight(), 0, 'The Center', COLORS.RED);
  screen.renderText(player.x, player.y, Math.HalfPI+player.a, 'A');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuTWF0aC5GbG9vckV4cG9uZW50aWFsID0gbiA9PiBuLnRvU3RyaW5nKCkuaW5kZXhPZignZS0nKSAhPT0gLTEgPyAwIDogbjtcbk1hdGgudHJpZ1ggPSAocmFkcywgdmVsKSA9PiBNYXRoLkZsb29yRXhwb25lbnRpYWwoTWF0aC5jb3MocmFkcykgKiB2ZWwpO1xuTWF0aC50cmlnWSA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLnNpbihyYWRzKSAqIHZlbCk7XG5NYXRoLkhhbGZQSSA9IE1hdGguUEkgLyAyO1xuXG5BcnJheS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gbnVsbCA6IHRoaXMucHVzaCh2YWwpO1xufTtcbkFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiB0aGlzLmluY2x1ZGVzKHZhbCkgPyB0aGlzLnNwbGljZSh0aGlzLmluZGV4T2YodmFsKSwgMSkgOiBudWxsO1xufTtcblxud2luZG93LmdldEhhbGZXaWR0aCA9ICgpID0+IHdpbmRvdy5pbm5lcldpZHRoIC8gMjtcbndpbmRvdy5nZXRIYWxmSGVpZ2h0ID0gKCkgPT4gd2luZG93LmlubmVySGVpZ2h0IC8gMjtcblxuY29uc3QgQ09MT1JTID0ge1xuICBCTEFDSzogJyMwMDAwMDAnLFxuICBXSElURTogJyNmZmZmZmYnLFxuICBSRUQ6ICcjZmYwMDAwJ1xufTtcblxuY29uc3QgSU5QVVQgPSAoKCkgPT4ge1xuICBjb25zdCBtb3VzZUJ1dHRvbnMgPSBbJ01vdXNlTGVmdCcsICdNb3VzZU1pZGRsZScsICdNb3VzZVJpZ2h0J107XG4gIC8qKlxuICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgKiBAcHJvcCB7aW50fSBtb3ZlbWVudFhcbiAgICogQHByb3Age2ludH0gbW92ZW1lbnRZXG4gICAqL1xuICBsZXQgY3Vyc29yID0gbnVsbDtcbiAgbGV0IHByZXNzZWQgPSBbXTtcbiAgZG9jdW1lbnQub25tb3VzZW1vdmUgPSBvdmVycmlkZUV2ZW50KGUgPT4gY3Vyc29yID0gZSk7XG4gIGRvY3VtZW50Lm9ua2V5ZG93biA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLmFkZChlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25rZXl1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25tb3VzZWRvd24gPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQobW91c2VCdXR0b25zW2Uud2hpY2ggLSAxXSkpO1xuICBkb2N1bWVudC5vbm1vdXNldXAgPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5yZW1vdmUobW91c2VCdXR0b25zW2Uud2hpY2ggLSAxXSkpO1xuICByZXR1cm4ge1xuICAgIGNhbGNDdXJzb3JBbmdsZTogKHggPSB3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHkgPSB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpKSA9PiAhY3Vyc29yID8gbnVsbCA6IC1NYXRoLmF0YW4yKGN1cnNvci5wYWdlWCAtIHgsIGN1cnNvci5wYWdlWSAtIHkpIC0gTWF0aC5IYWxmUEksXG4gICAgZ2V0Q3Vyc29yOiAoKSA9PiAhY3Vyc29yID8gbnVsbCA6IHtcbiAgICAgIHg6IGN1cnNvci5wYWdlWCxcbiAgICAgIHk6IGN1cnNvci5wYWdlWSxcbiAgICAgIHY6IChNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRYKSArIE1hdGguYWJzKGN1cnNvci5tb3ZlbWVudFkpIC8gMilcbiAgICB9LFxuICAgIGdldFByZXNzZWQ6ICgpID0+IHByZXNzZWQsXG4gICAgZ2V0S2V5czogKCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgV0FMS19GT1JXQVJEOiAnS2V5VycsXG4gICAgICAgIFdBTEtfUklHSFQ6ICdLZXlEJyxcbiAgICAgICAgV0FMS19CQUNLV0FSRDogJ0tleVMnLFxuICAgICAgICBXQUxLX0xFRlQ6ICdLZXlBJyxcbiAgICAgICAgTUVUQTogJ01ldGEnLFxuICAgICAgICBTSE9XX09VVFBVVDogJ1RhYidcbiAgICAgIH1cbiAgICB9XG4gIH07XG59KSgpO1xuXG5jb25zdCBzY3JlZW4gPSBidWlsZFNjcmVlbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NyZWVuJykpO1xuY29uc3QgZGlzcGxheSA9IGJ1aWxkRGlzcGxheShzY3JlZW4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdXRwdXQnKSk7XG5jb25zdCBwbGF5ZXIgPSB7eDogd2luZG93LmdldEhhbGZXaWR0aCgpLCB5OiB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpLCBhOiAwLCBzcGVlZDogMn07XG5cbnNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3QgcHJlc3NlZCA9IElOUFVULmdldFByZXNzZWQoKTtcbiAgcGxheWVyLmEgPSBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUocGxheWVyLngsIHBsYXllci55KTtcbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfRk9SV0FSRCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hLCAtcGxheWVyLnNwZWVkKTtcbiAgICBwbGF5ZXIueSArPSBNYXRoLnRyaWdZKHBsYXllci5hLCAtcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19SSUdIVCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hIC0gTWF0aC5IYWxmUEksIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSAtIE1hdGguSGFsZlBJLCBwbGF5ZXIuc3BlZWQpO1xuICB9XG4gIGlmIChwcmVzc2VkLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5XQUxLX0JBQ0tXQVJEKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEsIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSwgcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19MRUZUKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEgLSBNYXRoLkhhbGZQSSwgLXBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSAtIE1hdGguSGFsZlBJLCAtcGxheWVyLnNwZWVkKTtcbiAgfVxufSwgMTAwIC8gMTAwMCk7XG5cbnNldEludGVydmFsKCgpID0+IHtcbiAgY29uc3QgY3Vyc29yID0gSU5QVVQuZ2V0Q3Vyc29yKCk7XG4gIGRpc3BsYXkucmVuZGVyT3V0cHV0KCk7XG4gIHNjcmVlbi5wYW4ocGxheWVyLngsIHBsYXllci55LCBwbGF5ZXIuYSk7XG4gIHNjcmVlbi5jbGVhcigpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCh3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHdpbmRvdy5nZXRIYWxmSGVpZ2h0KCksIDAsICdUaGUgQ2VudGVyJywgQ09MT1JTLlJFRCk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KHBsYXllci54LCBwbGF5ZXIueSwgTWF0aC5IYWxmUEkrcGxheWVyLmEsICdBJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDEwMCwgMTAwLCAwLCAnQicpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgxMDAsIDIwMCwgMCwgJ0MnKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMjAwLCAxMDAsIDAsICdEJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDIwMCwgMjAwLCAwLCAnRScpO1xufSwgNjAgLyAxMDAwKTtcblxuZnVuY3Rpb24gYnVpbGRTY3JlZW4oY2FudmFzKSB7XG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBsZXQgb2Zmc2V0ID0ge3g6IDAsIHk6IDAsIGE6IE1hdGguSGFsZlBJfTtcbiAgcmV0dXJuIHtcbiAgICBwYW46ICh4LCB5LCBhKSA9PiBPYmplY3QuYXNzaWduKG9mZnNldCwge3gsIHksIGE6IGEgLSBNYXRoLkhhbGZQSX0pLFxuICAgIHJlc2l6ZTogKHdpZHRoLCBoZWlnaHQpID0+IE9iamVjdC5hc3NpZ24oY2FudmFzLCB7d2lkdGgsIGhlaWdodH0pLFxuICAgIGNsZWFyOiAoKSA9PiB7XG4gICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICBjdHguZmlsbFN0eWxlID0gQ09MT1JTLkJMQUNLO1xuICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfSxcbiAgICByZW5kZXJUZXh0OiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgYW5nbGUsIHQsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBjO1xuICAgICAgY3R4LnRyYW5zbGF0ZSh4LCB5KTtcbiAgICAgIGN0eC5yb3RhdGUoYW5nbGUpO1xuICAgICAgY3R4LmZpbGxUZXh0KHQsIDAsIDApO1xuICAgIH0pLFxuICAgIHJlbmRlckNpcmNsZTogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIHJhZGl1cywgYyA9IENPTE9SUy5XSElURSkgPT4ge1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LmFyYyh4LCB5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGM7XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSlcbiAgfTtcblxuICBmdW5jdGlvbiByZW5kZXIoY2IpIHtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGNiLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGREaXNwbGF5KHNjcmVlbiwgb3V0cHV0KSB7XG4gIGRvY3VtZW50Lm9uY29udGV4dG1lbnUgPSBvdmVycmlkZUV2ZW50KCk7XG4gIGRvY3VtZW50Lm9uc2VsZWN0c3RhcnQgPSBvdmVycmlkZUV2ZW50KCk7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IGUgPT4gc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgc2NyZWVuLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgcmV0dXJuIHtcbiAgICByZW5kZXJPdXRwdXQ6ICgpID0+IHtcbiAgICAgIG91dHB1dC5zdHlsZS5kaXNwbGF5ID0gSU5QVVQuZ2V0UHJlc3NlZCgpLmluY2x1ZGVzKElOUFVULmdldEtleXMoKS5TSE9XX09VVFBVVCkgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgb3V0cHV0LmlubmVyVGV4dCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcHJlc3NlZDogSU5QVVQuZ2V0UHJlc3NlZCgpLFxuICAgICAgICBhcmM6IElOUFVULmNhbGNDdXJzb3JBbmdsZShwbGF5ZXIueCwgcGxheWVyLnkpLFxuICAgICAgICBwbGF5ZXJcbiAgICAgIH0sIG51bGwsIDIpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVFdmVudChjYiA9ICgpID0+IGZhbHNlKSB7XG4gIHJldHVybiBlID0+IChlLmtleSAhPT0gSU5QVVQuZ2V0S2V5cygpLk1FVEEpICYmIChlLnByZXZlbnREZWZhdWx0KCkgfHwgY2IoZSkgfHwgZmFsc2UpO1xufVxuIl19
