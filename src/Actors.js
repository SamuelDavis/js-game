import _ from 'lodash/fp';

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
    const actions = sheep.getActions();
    return actions[_.random(0, actions.length - 1)]()
      .then(bleat => {
        return new Promise(resolve => setTimeout(() => {
          console.log(`Sheep #${game.actors.indexOf(sheep)}: "${bleat}"`);
          resolve();
        }, Math.random() * 1000));
      });
  }

  getActions() {
    return [
      this.ba.bind(this),
      this.baa.bind(this),
      this.baaa.bind(this),
    ];
  }

  ba() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('Ba!');
      }, Math.random() * 1000);
    });
  }

  baa() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('Baa!');
      }, Math.random() * 1000);
    });
  }

  baaa() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('Baaa!');
      }, Math.random() * 1000);
    });
  }
}
