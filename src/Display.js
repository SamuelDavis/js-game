'use strict';

import _ from 'lodash/fp';
import ROT from 'rot-js';
import {Loop} from './utils';

let width, height;
/**
 * @type {Map}
 */
let map;
let tileSet;
/**
 * @type {ROT.Display}
 */
let renderer;
/**
 * @type {Cursor}
 */
let cursor;
/**
 * @type {Loop}
 */
let renderLoop;

export default class Display {
  constructor(_width, _height, _tileSet, _map, _cursor) {
    width = _width;
    height = _height;
    tileSet = _tileSet;
    map = _map;
    cursor = _cursor;
    renderer = new ROT.Display(_.assign(tileSet, {layout: 'tile', width, height}));
    document.getElementById('screen').appendChild(renderer.getContainer());
    renderLoop = new Loop(60, this.draw);
  }

  draw() {
    const cursorPos = cursor.getPos();
    const offset = [
      _.clamp(0, map.getWidth() - width, cursorPos[0] - _.floor(width / 2)),
      _.clamp(0, map.getHeight() - height, cursorPos[1] - _.floor(height / 2))
    ];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tileContent = map
          .getTile(x + offset[0], y + offset[1])
          .getContents();
        renderer.draw(x, y, tileContent.concat(cursor.getSelected() === _.head(tileContent) ? [{gId: 298}] : [])
          .map(tile => tile ? tile.gId : null)
          .filter(Boolean));
      }
    }
    renderer.draw(cursorPos[0] - offset[0], cursorPos[1] - offset[1], 298);

    return this;
  }

  showText(text = null) {
    const textBox = document.getElementById('text');
    if (text) {
      textBox.innerText = text;
    }
    textBox.setAttribute('class', '');
    return this;
  }

  hideText() {
    document
      .getElementById('text')
      .setAttribute('class', 'hidden');
    return this;
  }

  isPaused() {
    return renderLoop.isRunning();
  }

  pause() {
    renderLoop.stop();
    return this;
  }

  unpause() {
    renderLoop.start();
    return this;
  }
}
