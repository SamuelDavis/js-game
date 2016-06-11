(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Math.FloorExponential = n => n.toString().indexOf('e-') !== -1 ? 0 : n;
Math.trigX = (rads, vel) => Math.FloorExponential(Math.cos(rads) * vel);
Math.trigY = (rads, vel) => Math.FloorExponential(Math.sin(rads) * vel);

const input = (() => {
  let cursor = null;
  let pressed = [];
  document.onmousemove = evt => cursor = evt;
  document.onkeydown = e => pressed.includes(e.code) ? null : pressed.push(e.code);
  document.onkeyup = e => pressed.includes(e.code) ? pressed.splice(pressed.indexOf(e.code), 1) : null;
  return {
    calcCursorArc: (x = window.innerWidth / 2, y = window.innerHeight / 2) => cursor ? Math.atan2(cursor.pageY - x, cursor.pageX - y) : null,
    getPressed: () => pressed
  };
})();

const tick = setInterval(() => {
  document.getElementById('output').innerText = JSON.stringify({
    pressed: input.getPressed(),
    arc: input.calcCursorArc()
  }, null, 2);
}, 10);

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuTWF0aC5GbG9vckV4cG9uZW50aWFsID0gbiA9PiBuLnRvU3RyaW5nKCkuaW5kZXhPZignZS0nKSAhPT0gLTEgPyAwIDogbjtcbk1hdGgudHJpZ1ggPSAocmFkcywgdmVsKSA9PiBNYXRoLkZsb29yRXhwb25lbnRpYWwoTWF0aC5jb3MocmFkcykgKiB2ZWwpO1xuTWF0aC50cmlnWSA9IChyYWRzLCB2ZWwpID0+IE1hdGguRmxvb3JFeHBvbmVudGlhbChNYXRoLnNpbihyYWRzKSAqIHZlbCk7XG5cbmNvbnN0IGlucHV0ID0gKCgpID0+IHtcbiAgbGV0IGN1cnNvciA9IG51bGw7XG4gIGxldCBwcmVzc2VkID0gW107XG4gIGRvY3VtZW50Lm9ubW91c2Vtb3ZlID0gZXZ0ID0+IGN1cnNvciA9IGV2dDtcbiAgZG9jdW1lbnQub25rZXlkb3duID0gZSA9PiBwcmVzc2VkLmluY2x1ZGVzKGUuY29kZSkgPyBudWxsIDogcHJlc3NlZC5wdXNoKGUuY29kZSk7XG4gIGRvY3VtZW50Lm9ua2V5dXAgPSBlID0+IHByZXNzZWQuaW5jbHVkZXMoZS5jb2RlKSA/IHByZXNzZWQuc3BsaWNlKHByZXNzZWQuaW5kZXhPZihlLmNvZGUpLCAxKSA6IG51bGw7XG4gIHJldHVybiB7XG4gICAgY2FsY0N1cnNvckFyYzogKHggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIDIsIHkgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyKSA9PiBjdXJzb3IgPyBNYXRoLmF0YW4yKGN1cnNvci5wYWdlWSAtIHgsIGN1cnNvci5wYWdlWCAtIHkpIDogbnVsbCxcbiAgICBnZXRQcmVzc2VkOiAoKSA9PiBwcmVzc2VkXG4gIH07XG59KSgpO1xuXG5jb25zdCB0aWNrID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3V0cHV0JykuaW5uZXJUZXh0ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgIHByZXNzZWQ6IGlucHV0LmdldFByZXNzZWQoKSxcbiAgICBhcmM6IGlucHV0LmNhbGNDdXJzb3JBcmMoKVxuICB9LCBudWxsLCAyKTtcbn0sIDEwKTtcbiJdfQ==
