'use strict';

import _ from 'lodash/fp';
import {keysToVals, forOwn, overrideEvent, Loop} from './utils';
import Display from './Display';
import Map from './Map';

let paused = false;

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
const tileSize = [16, 16];
const display = new Display(5, 5, {
  tileSet: document.getElementById('tiles'),
  bg: 'transparent',
  tileWidth: tileSize[0],
  tileHeight: tileSize[1],
  tileMap: forOwn((pos, key, tileMap) => tileMap[key] = pos.map((val, i) => val * tileSize[i]), {
    grass1: [0, 0],
    grass2: [1, 0],
    grass3: [2, 0],
    grass4: [3, 0],
    cursor: [3, 42]
  })
}).setMap(map);
const renderLoop = new Loop(60, display.draw).start();

const controls = {down: {}, up: {}};
const keyPos = keysToVals(controls);
const commands = forOwn(([pos, cb, keys]) => keys.forEach(key => controls[pos][key] = cb), {
  ScrollUp: [keyPos.down, () => paused ? null : display.panUp(), ['ArrowUp', 'KeyW']],
  ScrollRight: [keyPos.down, () => paused ? null : display.panRight(), ['ArrowRight', 'KeyD']],
  ScrollDown: [keyPos.down, () => paused ? null : display.panDown(), ['ArrowDown', 'KeyS']],
  ScrollLeft: [keyPos.down, () => paused ? null : display.panLeft(), ['ArrowLeft', 'KeyA']],
  Pause: [keyPos.down, () => {
    paused = !paused;
    (renderLoop.isRunning() ? renderLoop.stop : renderLoop.start).apply(renderLoop);
  }, ['Space']],
  ShowHelp: [keyPos.down, () => {
    _.flow([
      _.toPairs.bind(_),
      _.map.bind(_, ([prop, [pos, cb, bindings]]) => `${prop}: ${bindings.join(', ')}`),
      _.join.bind(_, '\n'),
      display.showText.bind(display),
    ])(commands);
  }, ['Tab']],
  HideHelp: [keyPos.up, () => display.hideText(), ['Tab']]
});

_.keys(controls).forEach(pos => window[`onkey${pos}`] = overrideEvent(e => {
  const command = _.get(e.code, controls[pos]);
  if (_.isFunction(command)) {
    command();
  }
}));
