'use strict';

import {overrideEvent, Loop} from './utils';
import Display from './Display';
import Map from './Map';

const map = new Map([
  [1, 2, 2, 1, 4, 4, 4, 1, 1, 1],
  [1, 1, 2, 2, 2, 4, 4, 4, 3, 3],
  [4, 4, 3, 2, 2, 2, 2, 1, 3, 3],
  [4, 4, 3, 3, 2, 1, 1, 1, 1, 3],
  [1, 1, 1, 1, 1, 1, 1, 2, 2, 1],
  [2, 1, 4, 4, 4, 3, 1, 2, 2, 1],
  [2, 2, 4, 4, 4, 3, 3, 1, 2, 1],
  [2, 2, 1, 1, 1, 3, 3, 1, 4, 4],
  [3, 3, 3, 2, 4, 4, 1, 1, 4, 4],
  [1, 1, 3, 3, 4, 4, 1, 1, 1, 1]
]);
const display = new Display(5, 5, {
  tileSet: document.getElementById('tiles'),
  bg: 'transparent',
  tileWidth: 16,
  tileHeight: 16,
  tileMap: {
    grass1: [0, 0],
    grass2: [16, 0],
    grass3: [32, 0],
    grass4: [48, 0]
  }
}).setMap(map);
const renderLoop = new Loop(60, display.draw).start();

const controls = {
  ArrowUp: display.panUp.bind(display),
  ArrowRight: display.panRight.bind(display),
  ArrowDown: display.panDown.bind(display),
  ArrowLeft: display.panLeft.bind(display),
  Space: (renderLoop.isRunning() ? renderLoop.stop.bind(renderLoop) : renderLoop.start.bind(renderLoop))
};

window.onkeydown = overrideEvent(e => {
  if (controls.hasOwnProperty(e.code)) {
    controls[e.code]();
  }
});
