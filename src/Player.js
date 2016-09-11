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
    return new Promise(resolve => {
      this.input.getInput(code => {
        const option = parseInt(code.replace('Digit', '')) - 1;
        if (options.hasOwnProperty(option)) {
          console.log(options[option]);
          resolve();
        }
        return this.takeTurnWith(actor, game).then(resolve);
      });
    }).then(this.input.getInput(null));
  }
}
