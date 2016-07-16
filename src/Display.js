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
let cursor = [0, 0];

function setCursor(x, y) {
  return cursor = [
    _.clamp(0, map.getWidth() - 1, x),
    _.clamp(0, map.getHeight() - 1, y)
  ];
}

export default class Display {
  constructor(_width, _height, _tileSet) {
    width = _width;
    height = _height;
    tileSet = _tileSet;
    renderer = new ROT.Display(_.assign(tileSet, {layout: 'tile', width, height}));
    document.getElementById('screen').appendChild(renderer.getContainer());
  }

  setMap(_map) {
    map = _map;
    return this;
  }

  panUp() {
    setCursor(cursor[0], cursor[1] - 1);
    return this;
  }

  panRight() {
    setCursor(cursor[0] + 1, cursor[1]);
    return this;
  }

  panDown() {
    setCursor(cursor[0], cursor[1] + 1);
    return this;
  }

  panLeft() {
    setCursor(cursor[0] - 1, cursor[1]);
    return this;
  }

  draw() {
    const offset = [
      _.clamp(0, map.getWidth() - width, cursor[0] - _.floor(width / 2)),
      _.clamp(0, map.getHeight() - height, cursor[1] - _.floor(height / 2))
    ];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        renderer.draw(x, y, getGraphic(map.getTile(x + offset[0], y + offset[1]).type));
      }
    }
    renderer.draw(cursor[0] - offset[0], cursor[1] - offset[1], getGraphic(0));

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
}

function getGraphic(id) {
  switch (id) {
    case 0:
      return 'cursor';
    default:
      if ([1, 2, 3, 4].includes(id)) {
        return `grass${id}`;
      }
  }
}
