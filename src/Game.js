export default class Game {
  constructor(actors = []) {
    this.actors = actors;
    this.updateInterval = null;
  }

  start() {
    this.updateInterval = setInterval(this.update.bind(this), 100);
  }

  stop() {
    clearInterval(this.updateInterval);
  }

  update() {
    this.actors.forEach(actor => actor.update(this));
  }
}
