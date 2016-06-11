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
    calcCursorArc: (x = window.innerWidth / 2, y = window.innerHeight / 2) => !cursor ? null : Math.atan2(cursor.pageY - x, cursor.pageX - y),
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

const tick = setInterval(() => {
  const cursor = INPUT.getCursor();
  display.renderOutput();
  screen.clear();
  if (cursor) {
    screen.pan(cursor.x, cursor.y);
    screen.renderCircle(cursor.x, cursor.y, Math.max(5, cursor.v));
  }
  screen.renderText(window.innerWidth / 2, window.innerHeight / 2, 0, 'The Center', COLORS.RED);
}, 10);

function buildScreen(canvas) {
  const ctx = canvas.getContext('2d');
  let offset = {x: 0, y: 0};
  return {
    pan: (x, y) => Object.assign(offset, {x, y}),
    resize: (width, height) => Object.assign(canvas, {width, height}),
    clear: render.bind(null, () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.BLACK;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }),
    renderText: render.bind(null, (x, y, angle, t, c = COLORS.WHITE) => {
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.fillStyle = c;
      ctx.translate(x - offset.x + canvas.width / 2, y - offset.y + canvas.height / 2);
      ctx.rotate(angle);
      ctx.fillText(t, 0, 0);
    }),
    renderCircle: render.bind(null, (x, y, radius, c = COLORS.WHITE) => {
      ctx.beginPath();
      ctx.arc(x - offset.x + canvas.width / 2, y - offset.y + canvas.height / 2, radius, 0, 2 * Math.PI);
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
        arc: INPUT.calcCursorArc()
      }, null, 2);
    }
  };
}

function disableEvent(cb = () => false) {
  return e => (e.key !== 'Meta') && (e.preventDefault() || cb(e) || false);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5NYXRoLkZsb29yRXhwb25lbnRpYWwgPSBuID0+IG4udG9TdHJpbmcoKS5pbmRleE9mKCdlLScpICE9PSAtMSA/IDAgOiBuO1xuTWF0aC50cmlnWCA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLmNvcyhyYWRzKSAqIHZlbCk7XG5NYXRoLnRyaWdZID0gKHJhZHMsIHZlbCkgPT4gTWF0aC5GbG9vckV4cG9uZW50aWFsKE1hdGguc2luKHJhZHMpICogdmVsKTtcblxuQXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIHRoaXMuaW5jbHVkZXModmFsKSA/IG51bGwgOiB0aGlzLnB1c2godmFsKTtcbn07XG5BcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gdGhpcy5pbmNsdWRlcyh2YWwpID8gdGhpcy5zcGxpY2UodGhpcy5pbmRleE9mKHZhbCksIDEpIDogbnVsbDtcbn07XG5cbmNvbnN0IENPTE9SUyA9IHtcbiAgQkxBQ0s6ICcjMDAwMDAwJyxcbiAgV0hJVEU6ICcjZmZmZmZmJyxcbiAgUkVEOiAnI2ZmMDAwMCdcbn07XG5cbmNvbnN0IElOUFVUID0gKCgpID0+IHtcbiAgY29uc3QgbW91c2VCdXR0b25zID0gWydNb3VzZUxlZnQnLCAnTW91c2VNaWRkbGUnLCAnTW91c2VSaWdodCddO1xuICBsZXQgY3Vyc29yID0gbnVsbDtcbiAgbGV0IHByZXNzZWQgPSBbXTtcbiAgZG9jdW1lbnQub25tb3VzZW1vdmUgPSBkaXNhYmxlRXZlbnQoZSA9PiBjdXJzb3IgPSBlKTtcbiAgZG9jdW1lbnQub25rZXlkb3duID0gZGlzYWJsZUV2ZW50KGUgPT4gcHJlc3NlZC5hZGQoZS5jb2RlKSk7XG4gIGRvY3VtZW50Lm9ua2V5dXAgPSBkaXNhYmxlRXZlbnQoZSA9PiBwcmVzc2VkLnJlbW92ZShlLmNvZGUpKTtcbiAgZG9jdW1lbnQub25tb3VzZWRvd24gPSBkaXNhYmxlRXZlbnQoZSA9PiBwcmVzc2VkLmFkZChtb3VzZUJ1dHRvbnNbZS53aGljaCAtIDFdKSk7XG4gIGRvY3VtZW50Lm9ubW91c2V1cCA9IGRpc2FibGVFdmVudChlID0+IHByZXNzZWQucmVtb3ZlKG1vdXNlQnV0dG9uc1tlLndoaWNoIC0gMV0pKTtcbiAgcmV0dXJuIHtcbiAgICBjYWxjQ3Vyc29yQXJjOiAoeCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gMiwgeSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIDIpID0+ICFjdXJzb3IgPyBudWxsIDogTWF0aC5hdGFuMihjdXJzb3IucGFnZVkgLSB4LCBjdXJzb3IucGFnZVggLSB5KSxcbiAgICBnZXRDdXJzb3I6ICgpID0+ICFjdXJzb3IgPyBudWxsIDoge1xuICAgICAgeDogY3Vyc29yLnBhZ2VYLFxuICAgICAgeTogY3Vyc29yLnBhZ2VZLFxuICAgICAgdjogKE1hdGguYWJzKGN1cnNvci5tb3ZlbWVudFgpICsgTWF0aC5hYnMoY3Vyc29yLm1vdmVtZW50WSkgLyAyKVxuICAgIH0sXG4gICAgZ2V0UHJlc3NlZDogKCkgPT4gcHJlc3NlZFxuICB9O1xufSkoKTtcblxuY29uc3Qgc2NyZWVuID0gYnVpbGRTY3JlZW4oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmVlbicpKTtcbmNvbnN0IGRpc3BsYXkgPSBidWlsZERpc3BsYXkoc2NyZWVuLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3V0cHV0JykpO1xuXG5jb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICBjb25zdCBjdXJzb3IgPSBJTlBVVC5nZXRDdXJzb3IoKTtcbiAgZGlzcGxheS5yZW5kZXJPdXRwdXQoKTtcbiAgc2NyZWVuLmNsZWFyKCk7XG4gIGlmIChjdXJzb3IpIHtcbiAgICBzY3JlZW4ucGFuKGN1cnNvci54LCBjdXJzb3IueSk7XG4gICAgc2NyZWVuLnJlbmRlckNpcmNsZShjdXJzb3IueCwgY3Vyc29yLnksIE1hdGgubWF4KDUsIGN1cnNvci52KSk7XG4gIH1cbiAgc2NyZWVuLnJlbmRlclRleHQod2luZG93LmlubmVyV2lkdGggLyAyLCB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyLCAwLCAnVGhlIENlbnRlcicsIENPTE9SUy5SRUQpO1xufSwgMTApO1xuXG5mdW5jdGlvbiBidWlsZFNjcmVlbihjYW52YXMpIHtcbiAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIGxldCBvZmZzZXQgPSB7eDogMCwgeTogMH07XG4gIHJldHVybiB7XG4gICAgcGFuOiAoeCwgeSkgPT4gT2JqZWN0LmFzc2lnbihvZmZzZXQsIHt4LCB5fSksXG4gICAgcmVzaXplOiAod2lkdGgsIGhlaWdodCkgPT4gT2JqZWN0LmFzc2lnbihjYW52YXMsIHt3aWR0aCwgaGVpZ2h0fSksXG4gICAgY2xlYXI6IHJlbmRlci5iaW5kKG51bGwsICgpID0+IHtcbiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBDT0xPUlMuQkxBQ0s7XG4gICAgICBjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9KSxcbiAgICByZW5kZXJUZXh0OiByZW5kZXIuYmluZChudWxsLCAoeCwgeSwgYW5nbGUsIHQsIGMgPSBDT0xPUlMuV0hJVEUpID0+IHtcbiAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgIGN0eC50ZXh0QWxpZ24gPSAncmlnaHQnO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IGM7XG4gICAgICBjdHgudHJhbnNsYXRlKHggLSBvZmZzZXQueCArIGNhbnZhcy53aWR0aCAvIDIsIHkgLSBvZmZzZXQueSArIGNhbnZhcy5oZWlnaHQgLyAyKTtcbiAgICAgIGN0eC5yb3RhdGUoYW5nbGUpO1xuICAgICAgY3R4LmZpbGxUZXh0KHQsIDAsIDApO1xuICAgIH0pLFxuICAgIHJlbmRlckNpcmNsZTogcmVuZGVyLmJpbmQobnVsbCwgKHgsIHksIHJhZGl1cywgYyA9IENPTE9SUy5XSElURSkgPT4ge1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LmFyYyh4IC0gb2Zmc2V0LnggKyBjYW52YXMud2lkdGggLyAyLCB5IC0gb2Zmc2V0LnkgKyBjYW52YXMuaGVpZ2h0IC8gMiwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBjO1xuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH0pXG4gIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGNiKSB7XG4gICAgY3R4LnNhdmUoKTtcbiAgICBjYi5hcHBseShudWxsLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRGlzcGxheShzY3JlZW4sIG91dHB1dCkge1xuICBkb2N1bWVudC5vbmNvbnRleHRtZW51ID0gZGlzYWJsZUV2ZW50KCk7XG4gIGRvY3VtZW50Lm9uc2VsZWN0c3RhcnQgPSBkaXNhYmxlRXZlbnQoKTtcbiAgd2luZG93Lm9ucmVzaXplID0gZSA9PiBzY3JlZW4ucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICBzY3JlZW4ucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICByZXR1cm4ge1xuICAgIHJlbmRlck91dHB1dDogKCkgPT4ge1xuICAgICAgb3V0cHV0LnN0eWxlLmRpc3BsYXkgPSBJTlBVVC5nZXRQcmVzc2VkKCkuaW5jbHVkZXMoJ1RhYicpID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgIG91dHB1dC5pbm5lclRleHQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHByZXNzZWQ6IElOUFVULmdldFByZXNzZWQoKSxcbiAgICAgICAgYXJjOiBJTlBVVC5jYWxjQ3Vyc29yQXJjKClcbiAgICAgIH0sIG51bGwsIDIpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gZGlzYWJsZUV2ZW50KGNiID0gKCkgPT4gZmFsc2UpIHtcbiAgcmV0dXJuIGUgPT4gKGUua2V5ICE9PSAnTWV0YScpICYmIChlLnByZXZlbnREZWZhdWx0KCkgfHwgY2IoZSkgfHwgZmFsc2UpO1xufVxuIl19
