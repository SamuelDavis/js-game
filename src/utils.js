'use strict';

function forOwn(cb, obj) {
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      cb(obj[prop], prop, obj);
    }
  }
  return obj;
}

function overrideEvent(cb = (() => false)) {
  return e => {
    cb(e);
    return e;
  }
}

function loopInterval(loop) {
  console.log('interval');
  const start = new Date().getMilliseconds();
  loop.cb();
  if (loop.running) {
    setTimeout(loopInterval.bind(this, loop), loop.timing - (start - new Date().getMilliseconds()));
  }
}

class Loop {
  constructor(timing, cb) {
    this.timing = timing;
    this.cb = cb;
    this.running = false;
    this.interval = () => false;
  }

  isRunning() {
    return this.running;
  }

  start() {
    this.running = true;
    this.interval = loopInterval.bind(loopInterval, this);
    this.interval();
    return this;
  }

  stop() {
    this.running = false;
    this.interval = () => false;
    return this;
  }
}

export {
  forOwn,
  overrideEvent,
  Loop
};
