export default class Game {
  constructor(display, map, actors = []) {
    this.display = display;
    this.map = map;
    this.actors = actors;
  }

  update() {
    this.display.draw(this.map);
    return this.actors.reduce((carry, actor) => carry.then(actor.act.bind(actor, this)), Promise.resolve());
  }
}
