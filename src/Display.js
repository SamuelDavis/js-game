'use strict';

import _ from 'lodash/fp';
import ROT from 'rot-js';

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
let offset = [0, 0];

function setOffset(x, y) {
  return offset = [
    _.clamp(0, map.getWidth() - width, x),
    _.clamp(0, map.getHeight() - height, y)
  ];
}

export default class Display {
  constructor(_width, _height, _tileSet) {
    width = _width;
    height = _height;
    tileSet = _tileSet;
    renderer = new ROT.Display(_.assign(tileSet, {layout: 'tile', width, height}));
    document.body.appendChild(renderer.getContainer());
  }

  setMap(_map) {
    map = _map;
    return this;
  }

  panUp() {
    setOffset(offset[0], offset[1] - 1);
    return this;
  }

  panRight() {
    setOffset(offset[0] + 1, offset[1]);
    return this;
  }

  panDown() {
    setOffset(offset[0], offset[1] + 1);
    return this;
  }

  panLeft() {
    setOffset(offset[0] - 1, offset[1]);
    return this;
  }

  draw() {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        renderer.draw(x, y, getGraphic(map.getTile(x + offset[0], y + offset[1])));
      }
    }

    return this;
  }
}

function getGraphic(tile) {
  if ([1, 2, 3, 4].includes(tile.type)) {
    return `grass${tile.type}`;
  }
}
