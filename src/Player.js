export default class Player {
  constructor(input) {
    this.input = input;
  }

  takeTurnWith(actor, game) {
    const actions = actor.getActions();
    const optionsText = actions
      .map((action, i) => `[${i + 1} ${action.name.replace('bound ', '')}]`)
      .join(' ');
    return game.display.write(`What do you want to do with ${actor.constructor.name}?`)
      .then(() => game.display.write(`${optionsText}?`))
      .then(() => this.input.getNextInput())
      .then(key => {
        const option = actions[parseInt(key.replace('Digit', '')) - 1];
        if (option) {
          return option().then(result => game.display.write(`Sheep #${game.actors.indexOf(actor)}: "${result}"`));
        }
        return this.takeTurnWith(actor, game);
      });
  }
}
