const ROT = require('rot-js');

export default class Map {
  constructor(width = 100, height = 100, data = [[0]]) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  static Arena(width = 100, height = 100) {
    let data = [[]];
    new ROT.Map.Arena(width, height).create((x, y, v) => {
      if (!data[y]) {
        data[y] = [];
      }
      data[y][x] = v;
    });
    return new Map(width, height, data);
  }

  iterate(cb) {
    this.data.forEach((row, y) => row.forEach((cell, x) => cb(x, y, cell)));
    return this;
  }
}
