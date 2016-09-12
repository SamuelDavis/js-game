export default class Player {
  constructor(input) {
    this.input = input;
  }

  takeTurnWith(actor, game) {
    const options = [
      'Ba!',
      'Baa!',
      'Baaa!'
    ];
    const optionsText = options
      .map((t, i) => `(${i + 1}) "${t}"`)
      .join(', ');
    console.log(`What do you want to do with ${actor.constructor.name}? ${optionsText}?`);
    return this.input.getNextInput()
      .then(key => {
        switch(key) {
          case 'Digit1':
          case 'Digit2':
          case 'Digit3':
            const bleat = options[parseInt(key.replace('Digit', '')) - 1];
            return console.log(`Sheep #${game.actors.indexOf(actor)}: "${bleat}"`);
          default:
            return this.takeTurnWith(actor, game);
        }
      });
  }
}
