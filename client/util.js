'use strict';

module.exports = (cfg = {}) => {
  const _ = cfg._ || require('lodash/fp');

  return {
    keysToValues: (obj) => {
      return _.flow(_.keys, _.reduce((carry, key) => Object.assign(carry, {[key]: key}), {}))(obj);
    },
    calculatePosition: (rads, velocity) => {
      const x = velocity * Math.cos(rads);
      const y = velocity * Math.sin(rads);

      return {
        x: x.toString().indexOf('e-') !== -1 ? 0 : x,
        y: y.toString().indexOf('e-') !== -1 ? 0 : y
      }
    }
  };
};
