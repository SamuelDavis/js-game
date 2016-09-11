const ROT = require('rot-js');

export default class Display {
  constructor(renderer = new ROT.Display()) {
    this.renderer = renderer;
  }

  draw(map) {
    map.iterate(this.renderer.DEBUG.bind(this.renderer));
  }

  static Canvas(width = 100, height = 100) {
    const renderer = new ROT.Display({width, height, forceSquareRatio: true});
    document.body.appendChild(renderer.getContainer());
    return new Display(renderer);
  }
}
