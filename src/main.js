'use strict';

const {Loop, Point, Rectangle, Circle, Collection} = require('./jsExtensions');
const Output = require('./output');

class Zone {
  constructor() {
    this.area = new Rectangle();
    this.terrain = new Collection();
    this.actors = new Collection();
  }

  /**
   * @param {Rectangle || Circle} terrain
   * @returns {Zone}
   */
  addTerrian(terrain) {
    this.area
      .expandToContain(terrain.topLeft)
      .expandToContain(terrain.bottomRight);
    this.terrain.add(terrain);
    return this;
  }
}

const output = (new Output(document.getElementById('screen'))).resize(window.innerWidth, window.innerHeight);
const world = new Collection();

world
  .add(
    (new Zone)
      .addTerrian(new Rectangle(new Point(10, 10), new Point(30, 25)))
      .addTerrian(new Rectangle(new Point(30, 20), new Point(35, 45)))
      .addTerrian(new Circle(new Point(75, 25), 20))
  )
  .add(
    (new Zone)
      .addTerrian(new Rectangle(new Point(125, 175), new Point(130, 180)))
      .addTerrian(new Circle(new Point(135, 150), 5))
  );

const render = (new Loop(1000 / 60, () => {
  world.forEach(zone => {
    output.clear(zone.area);
    zone.terrain.forEach(terrain => {
      if (terrain instanceof Circle) {
        output.renderCircle(terrain);
      } else if (terrain instanceof Rectangle) {
        output.renderRectangle(terrain);
      }
    });
  });
}))
  .start();
