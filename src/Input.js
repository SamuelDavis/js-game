export default class Input {
  constructor() {
    this.inputCb = null;
    window.addEventListener('keydown', this.handleKeypress.bind(this));
  }

  handleKeypress({code}) {
    if (this.inputCb) {
      this.inputCb(code);
    }
  }

  getInput(cb) {
    this.inputCb = cb;
  }
}
