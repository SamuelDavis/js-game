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
  let cursor = {pageX: window.getHalfWidth(), pageY: window.getHalfHeight(), movementX: 0, movementY: 0};
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
update();
render();

function update() {
  const startTime = new Date();
  const pressed = INPUT.getPressed();
  player.a = -INPUT.calcCursorAngle(player.x, player.y);
  if (pressed.includes(INPUT.getKeys().WALK_FORWARD)) {
    player.x += Math.trigX(player.a - Math.HalfPI, -player.speed);
    player.y += Math.trigY(player.a - Math.HalfPI, -player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_RIGHT)) {
    player.x += Math.trigX(player.a, -player.speed);
    player.y += Math.trigY(player.a, -player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_BACKWARD)) {
    player.x += Math.trigX(player.a - Math.HalfPI, player.speed);
    player.y += Math.trigY(player.a - Math.HalfPI, player.speed);
  }
  if (pressed.includes(INPUT.getKeys().WALK_LEFT)) {
    player.x += Math.trigX(player.a, player.speed);
    player.y += Math.trigY(player.a, player.speed);
  }
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuTWF0aC5GbG9vckV4cG9uZW50aWFsID0gbiA9PiBuLnRvU3RyaW5nKCkuaW5kZXhPZignZS0nKSAhPT0gLTEgPyAwIDogbjtcbk1hdGgudHJpZ1ggPSAocmFkcywgdmVsKSA9PiBNYXRoLkZsb29yRXhwb25lbnRpYWwoTWF0aC5jb3MocmFkcykgKiB2ZWwpO1xuTWF0aC50cmlnWSA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLnNpbihyYWRzKSAqIHZlbCk7XG5NYXRoLkhhbGZQSSA9IE1hdGguUEkgLyAyO1xuXG5BcnJheS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gbnVsbCA6IHRoaXMucHVzaCh2YWwpO1xufTtcbkFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiB0aGlzLmluY2x1ZGVzKHZhbCkgPyB0aGlzLnNwbGljZSh0aGlzLmluZGV4T2YodmFsKSwgMSkgOiBudWxsO1xufTtcblxud2luZG93LmdldEhhbGZXaWR0aCA9ICgpID0+IHdpbmRvdy5pbm5lcldpZHRoIC8gMjtcbndpbmRvdy5nZXRIYWxmSGVpZ2h0ID0gKCkgPT4gd2luZG93LmlubmVySGVpZ2h0IC8gMjtcblxuY29uc3QgQ09MT1JTID0ge1xuICBCTEFDSzogJyMwMDAwMDAnLFxuICBXSElURTogJyNmZmZmZmYnLFxuICBSRUQ6ICcjZmYwMDAwJ1xufTtcblxuY29uc3QgSU5QVVQgPSAoKCkgPT4ge1xuICBjb25zdCBtb3VzZUJ1dHRvbnMgPSBbJ01vdXNlTGVmdCcsICdNb3VzZU1pZGRsZScsICdNb3VzZVJpZ2h0J107XG4gIC8qKlxuICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgKiBAcHJvcCB7aW50fSBtb3ZlbWVudFhcbiAgICogQHByb3Age2ludH0gbW92ZW1lbnRZXG4gICAqL1xuICBsZXQgY3Vyc29yID0ge3BhZ2VYOiB3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHBhZ2VZOiB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpLCBtb3ZlbWVudFg6IDAsIG1vdmVtZW50WTogMH07XG4gIGxldCBwcmVzc2VkID0gW107XG4gIHdpbmRvdy5vbmJsdXIgPSBlID0+IHByZXNzZWQgPSBbXTtcbiAgZG9jdW1lbnQub25tb3VzZW1vdmUgPSBvdmVycmlkZUV2ZW50KGUgPT4gY3Vyc29yID0gZSk7XG4gIGRvY3VtZW50Lm9ua2V5ZG93biA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLmFkZChlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25rZXl1cCA9IG92ZXJyaWRlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25tb3VzZWRvd24gPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQobW91c2VCdXR0b25zW2Uud2hpY2ggLSAxXSkpO1xuICBkb2N1bWVudC5vbm1vdXNldXAgPSBvdmVycmlkZUV2ZW50KGUgPT4gcHJlc3NlZC5yZW1vdmUobW91c2VCdXR0b25zW2Uud2hpY2ggLSAxXSkpO1xuICByZXR1cm4ge1xuICAgIGNhbGNDdXJzb3JBbmdsZTogKHggPSB3aW5kb3cuZ2V0SGFsZldpZHRoKCksIHkgPSB3aW5kb3cuZ2V0SGFsZkhlaWdodCgpKSA9PiAhY3Vyc29yID8gbnVsbCA6IE1hdGguYXRhbjIoY3Vyc29yLnBhZ2VYIC0geCwgY3Vyc29yLnBhZ2VZIC0geSksXG4gICAgZ2V0Q3Vyc29yOiAoKSA9PiAhY3Vyc29yID8gbnVsbCA6IHtcbiAgICAgIHg6IGN1cnNvci5wYWdlWCxcbiAgICAgIHk6IGN1cnNvci5wYWdlWSxcbiAgICAgIHY6IChNYXRoLmFicyhjdXJzb3IubW92ZW1lbnRYKSArIE1hdGguYWJzKGN1cnNvci5tb3ZlbWVudFkpIC8gMilcbiAgICB9LFxuICAgIGdldFByZXNzZWQ6ICgpID0+IHByZXNzZWQsXG4gICAgZ2V0S2V5czogKCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgV0FMS19GT1JXQVJEOiAnS2V5VycsXG4gICAgICAgIFdBTEtfUklHSFQ6ICdLZXlEJyxcbiAgICAgICAgV0FMS19CQUNLV0FSRDogJ0tleVMnLFxuICAgICAgICBXQUxLX0xFRlQ6ICdLZXlBJyxcbiAgICAgICAgTUVUQTogJ01ldGEnLFxuICAgICAgICBTSE9XX09VVFBVVDogJ1RhYidcbiAgICAgIH1cbiAgICB9XG4gIH07XG59KSgpO1xuXG5jb25zdCBzY3JlZW4gPSBidWlsZFNjcmVlbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NyZWVuJykpO1xuY29uc3QgZGlzcGxheSA9IGJ1aWxkRGlzcGxheShzY3JlZW4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdXRwdXQnKSk7XG5jb25zdCBwbGF5ZXIgPSB7eDogMCwgeTogMCwgYTogMCwgc3BlZWQ6IDJ9O1xudXBkYXRlKCk7XG5yZW5kZXIoKTtcblxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICBjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBwcmVzc2VkID0gSU5QVVQuZ2V0UHJlc3NlZCgpO1xuICBwbGF5ZXIuYSA9IC1JTlBVVC5jYWxjQ3Vyc29yQW5nbGUocGxheWVyLngsIHBsYXllci55KTtcbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfRk9SV0FSRCkpIHtcbiAgICBwbGF5ZXIueCArPSBNYXRoLnRyaWdYKHBsYXllci5hIC0gTWF0aC5IYWxmUEksIC1wbGF5ZXIuc3BlZWQpO1xuICAgIHBsYXllci55ICs9IE1hdGgudHJpZ1kocGxheWVyLmEgLSBNYXRoLkhhbGZQSSwgLXBsYXllci5zcGVlZCk7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfUklHSFQpKSB7XG4gICAgcGxheWVyLnggKz0gTWF0aC50cmlnWChwbGF5ZXIuYSwgLXBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSwgLXBsYXllci5zcGVlZCk7XG4gIH1cbiAgaWYgKHByZXNzZWQuaW5jbHVkZXMoSU5QVVQuZ2V0S2V5cygpLldBTEtfQkFDS1dBUkQpKSB7XG4gICAgcGxheWVyLnggKz0gTWF0aC50cmlnWChwbGF5ZXIuYSAtIE1hdGguSGFsZlBJLCBwbGF5ZXIuc3BlZWQpO1xuICAgIHBsYXllci55ICs9IE1hdGgudHJpZ1kocGxheWVyLmEgLSBNYXRoLkhhbGZQSSwgcGxheWVyLnNwZWVkKTtcbiAgfVxuICBpZiAocHJlc3NlZC5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuV0FMS19MRUZUKSkge1xuICAgIHBsYXllci54ICs9IE1hdGgudHJpZ1gocGxheWVyLmEsIHBsYXllci5zcGVlZCk7XG4gICAgcGxheWVyLnkgKz0gTWF0aC50cmlnWShwbGF5ZXIuYSwgcGxheWVyLnNwZWVkKTtcbiAgfVxuICBzZXRUaW1lb3V0KHVwZGF0ZSwgTWF0aC5taW4oMCwgMTAwMCAvIDEwMCAtIChuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSkpO1xufVxuXG5mdW5jdGlvbiByZW5kZXIoKSB7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGN1cnNvciA9IElOUFVULmdldEN1cnNvcigpO1xuICBkaXNwbGF5LnJlbmRlck91dHB1dCgpO1xuICBzY3JlZW4uY2xlYXIoKTtcbiAgc2NyZWVuLnJlbmRlckNpcmNsZShjdXJzb3IueCwgY3Vyc29yLnksIE1hdGgubWF4KDUsIGN1cnNvci52KSk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KHdpbmRvdy5nZXRIYWxmV2lkdGgoKSwgd2luZG93LmdldEhhbGZIZWlnaHQoKSwgMCwgJ1RoZSBDZW50ZXInLCBDT0xPUlMuUkVEKTtcbiAgc2NyZWVuLnJlbmRlclRleHQocGxheWVyLngsIHBsYXllci55LCBwbGF5ZXIuYSArIE1hdGguUEksICdeJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDEwMCwgMTAwLCAwLCAnQScpO1xuICBzY3JlZW4ucmVuZGVyVGV4dCgxMDAsIDIwMCwgMCwgJ0InKTtcbiAgc2NyZWVuLnJlbmRlclRleHQoMjAwLCAxMDAsIDAsICdDJyk7XG4gIHNjcmVlbi5yZW5kZXJUZXh0KDIwMCwgMjAwLCAwLCAnRCcpO1xuICBzZXRUaW1lb3V0KHJlbmRlciwgTWF0aC5taW4oMCwgMTAwMCAvIDYwIC0gKG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpKSk7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkU2NyZWVuKGNhbnZhcykge1xuICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgcmV0dXJuIHtcbiAgICByZXNpemU6ICh3aWR0aCwgaGVpZ2h0KSA9PiBPYmplY3QuYXNzaWduKGNhbnZhcywge3dpZHRoLCBoZWlnaHR9KSxcbiAgICBjbGVhcjogKCkgPT4ge1xuICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IENPTE9SUy5CTEFDSztcbiAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH0sXG4gICAgcmVuZGVyVGV4dDogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIGFuZ2xlLCB0LCBjID0gQ09MT1JTLldISVRFKSA9PiB7XG4gICAgICBjdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gICAgICBjdHguZmlsbFN0eWxlID0gYztcbiAgICAgIGN0eC50cmFuc2xhdGUoeCwgeSk7XG4gICAgICBjdHgucm90YXRlKGFuZ2xlKTtcbiAgICAgIGN0eC5maWxsVGV4dCh0LCAwLCAwKTtcbiAgICB9KSxcbiAgICByZW5kZXJDaXJjbGU6IHJlbmRlci5iaW5kKG51bGwsICh4LCB5LCByYWRpdXMsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5hcmMoeCwgeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBjO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pXG4gIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGNiKSB7XG4gICAgY3R4LnNhdmUoKTtcbiAgICBjYi5hcHBseShudWxsLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRGlzcGxheShzY3JlZW4sIG91dHB1dCkge1xuICBkb2N1bWVudC5vbmNvbnRleHRtZW51ID0gb3ZlcnJpZGVFdmVudCgpO1xuICBkb2N1bWVudC5vbnNlbGVjdHN0YXJ0ID0gb3ZlcnJpZGVFdmVudCgpO1xuICB3aW5kb3cub25yZXNpemUgPSBlID0+IHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHNjcmVlbi5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gIHJldHVybiB7XG4gICAgcmVuZGVyT3V0cHV0OiAoKSA9PiB7XG4gICAgICBvdXRwdXQuc3R5bGUuZGlzcGxheSA9IElOUFVULmdldFByZXNzZWQoKS5pbmNsdWRlcyhJTlBVVC5nZXRLZXlzKCkuU0hPV19PVVRQVVQpID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgIG91dHB1dC5pbm5lclRleHQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHByZXNzZWQ6IElOUFVULmdldFByZXNzZWQoKSxcbiAgICAgICAgYXJjOiBJTlBVVC5jYWxjQ3Vyc29yQW5nbGUoKSxcbiAgICAgICAgY3Vyc29yOiBJTlBVVC5nZXRDdXJzb3IoKSxcbiAgICAgICAgcGxheWVyXG4gICAgICB9LCBudWxsLCAyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlRXZlbnQoY2IgPSAoKSA9PiBmYWxzZSkge1xuICByZXR1cm4gZSA9PiAoZS5rZXkgIT09IElOUFVULmdldEtleXMoKS5NRVRBKSAmJiAoZS5wcmV2ZW50RGVmYXVsdCgpIHx8IGNiKGUpIHx8IGZhbHNlKTtcbn1cbiJdfQ==
