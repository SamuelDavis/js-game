export default class Player {
  constructor(input) {
    this.input = input;
  }

  takeTurnWith(actor, game) {
    return this.input
      .getNextInput()
      .then(input => {
        console.log(`Actor ${game.actors.indexOf(actor) + 1} turn: ${input.join(', ')}`);
      });
  }
}
