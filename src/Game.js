export default class Game {
  constructor(actors = []) {
    this.actors = actors;
  }

  update() {
    return this.actors.reduce((carry, actor) => carry.then(actor.act.bind(actor, this)), Promise.resolve())
      .then(this.update.bind(this));
  }
}
