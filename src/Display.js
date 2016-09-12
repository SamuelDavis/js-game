const ROT = require('rot-js');
import _ from 'lodash/fp';

export default class Display {
  constructor(renderer = new ROT.Display()) {
    this.renderer = renderer;
    this.text = [];
  }

  draw(map) {
    map.iterate(this.renderer.DEBUG.bind(this.renderer));
  }

  static Canvas(width = 100, height = 100) {
    const renderer = new ROT.Display({width, height, forceSquareRatio: true, fontSize: 10});
    document.getElementById('screen').appendChild(renderer.getContainer());
    return new Display(renderer);
  }

  write(text) {
    this.text.push(text);
    document.getElementById('text').innerText = _.reverse(this.text).join('\r');
    return Promise.resolve();
  }
}
