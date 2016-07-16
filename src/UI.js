'use strict';

import {keysToVals, forOwn, overrideEvent} from './utils';
import _ from 'lodash/fp';

/**
 * @type {Game}
 */
let game;
/**
 * @type {Display}
 */
let display;

const controls = {down: {}, up: {}};
const keyPos = keysToVals(controls);

const commands = forOwn(([pos, keys, cb]) => keys.forEach(key => controls[pos][key] = cb), {
  ScrollUp: [keyPos.down, ['ArrowUp', 'KeyW'], () => game.isPaused() ? null : display.panUp()],
  ScrollRight: [keyPos.down, ['ArrowRight', 'KeyD'], () => game.isPaused() ? null : display.panRight()],
  ScrollDown: [keyPos.down, ['ArrowDown', 'KeyS'], () => game.isPaused() ? null : display.panDown()],
  ScrollLeft: [keyPos.down, ['ArrowLeft', 'KeyA'], () => game.isPaused() ? null : display.panLeft()],
  Pause: [keyPos.down, ['Space'], () => {
    (game.isPaused() ? game.unpause : game.pause).apply(game);
    (display.isPaused() ? display.pause : display.unpause).apply(display);
  }],
  ShowHelp: [keyPos.down, ['Tab'], () => {
    _.flow([
      _.toPairs.bind(_),
      _.map.bind(_, ([prop, [pos, keys, cb]]) => `${prop}: ${keys.join(', ')}`),
      _.join.bind(_, '\n'),
      display.showText.bind(display),
    ])(commands);
  }],
  HideHelp: [keyPos.up, ['Tab'], () => display.hideText()]
});

export default class UI {
  constructor(_game, _display) {
    game = _game;
    display = _display;
  }

  applyKeyBindings() {
    _.keys(controls).forEach(pos => window[`onkey${pos}`] = overrideEvent(e => {
      const command = _.get(e.code, controls[pos]);
      if (_.isFunction(command)) {
        command();
      }
    }));
    return this;
  }
}
