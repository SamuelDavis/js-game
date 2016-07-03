'use strict';

const _ = require('lodash/fp');

module.exports = {
  forOwn,
  keysToValues,
  overrideEvent
};

function forOwn(cb, obj) {
  let prop;
  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      cb(obj[prop], prop, obj);
    }
  }
  return this;
}

function keysToValues(obj) {
  return _.flow(_.keys, _.reduce((carry, key) => Object.assign(carry, {[key]: key}), {}))(obj);
}

function overrideEvent(cb = (() => null)) {
  return e => {
    e.preventDefault();
    cb(e);
    return false;
  }
}
