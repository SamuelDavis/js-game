'use strict';

class Loop {
  constructor(timeout, cb) {
    this.timeout = timeout;
    this.cb = cb;
    this.interval = null;
  }

  start() {
    this.interval = setInterval(this.cb, this.timeout);
    return this;
  }
}

module.exports = {
  Loop,
  overrideEvent
};

function overrideEvent(cb = () => false) {
  return e => e.preventDefault() || cb(e) || false;
}
