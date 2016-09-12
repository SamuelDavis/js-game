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
          game.display.write(`Sheep #${game.actors.indexOf(sheep)}: "${bleat}"`).then(resolve);
        }, Math.random() * 1000));
      });
  }

  getActions() {
    let actions = [this.blinkStupidly.bind(this)];
    if (this.energy >= 1) {
      actions.push(this.eatGrass.bind(this));
    }
    for (let i = 1; i * 5 < this.energy; i++) {
      actions.push(this.bleat.bind(this, i));
    }
    return actions;
  }

  blinkStupidly() {
    return Promise.resolve('Blink.');
  }

  eatGrass() {
    this.energy++;
    return Promise.resolve('Munch, munch, munch...');
  }

  bleat(multiplier = 1) {
    this.energy -= multiplier * 5;
    return Promise.resolve(`B${'a'.repeat(multiplier)}!`);
  }
}
