import _ from 'lodash/fp';

export class Actor {
  constructor(owner) {
    this.owner = owner || this.constructor;
  }

  act(game) {
    return this.owner.takeTurnWith(this, game);
  }

  static takeTurnWith(actor, game) {
    return Promise.resolve();
  }
}

export class TestActor extends Actor {
  static takeTurnWith(actor, game) {
    return new Promise(resolve => setTimeout(() => {
      console.log(`Actor ${game.actors.indexOf(actor) + 1} turn.`);
      resolve();
    }, _.random(1000, 2000)));
  }
}

