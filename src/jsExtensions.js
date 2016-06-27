'use strict';

Object.prototype.forOwn = function (cb) {
  let key;
  for (key in this) {
    if (this.hasOwnProperty(key) && cb(this[key], key, this) === false) {
      break;
    }
  }
  return this;
};
