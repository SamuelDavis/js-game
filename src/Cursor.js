import _ from 'lodash/fp';

let x, y;
/**
 * @type {Tile}
 */
let selected;

/**
 * @type {Map}
 */
let map;

export default class Cursor {
  constructor(_map, _x, _y, _selected) {
    map = _map;
    x = _x;
    y = _y;
    selected = _selected;
  }

  getPos() {
    return [x, y];
  }

  /**
   * @returns {Tile}
   */
  getSelected() {
    return selected;
  }

  /**
   * @param {Tile} _selected
   * @returns {Cursor}
   */
  setSelected(_selected) {
    selected = _selected;
    return this;
  }

  panUp() {
    y = _.clamp(0, map.getHeight() - 1, y - 1);
    return this;
  }

  panRight() {
    x = _.clamp(0, map.getWidth() - 1, x + 1);
    return this;
  }

  panDown() {
    y = _.clamp(0, map.getHeight() - 1, y + 1);
    return this;
  }

  panLeft() {
    x = _.clamp(0, map.getWidth() - 1, x - 1);
    return this;
  }
}
