export class Actor {
  constructor(owner, energy = 0) {
    this.owner = owner || this.constructor;
    this.energy = energy;
  }

  act(game) {
    this.energy++;
    return this.owner.takeTurnWith(this, game);
  }

  static takeTurnWith(actor, game) {
    return Promise.resolve();
  }
}

export class Sheep extends Actor {
  static takeTurnWith(sheep, game) {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Sheep #${game.actors.indexOf(sheep)}: "Baa!"`);
        resolve();
      }, Math.random() * 1000);
    });
  }
}
