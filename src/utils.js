'use strict';

class Loop {
  constructor(timeout, cb) {
    this.timeout = timeout;
    this.cb = cb;
    this.interval = null;
  }

  start() {
    if (!this.interval) {
      this.interval = setInterval(this.cb, this.timeout);
    }
    return this;
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
    return this;
  }

  isRunning() {
    return Boolean(this.interval);
  }
}

module.exports = {
  Loop,
  overrideEvent
};

function overrideEvent(cb = () => false) {
  return e => e.preventDefault() || cb(e) || false;
}
