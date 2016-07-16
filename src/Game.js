'use strict';

let paused = false;

export default class Game {
  isPaused() {
    return paused;
  }

  pause() {
    paused = true;
    return this;
  }

  unpause() {
    paused = false;
    return this;
  }
}
