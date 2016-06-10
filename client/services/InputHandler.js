'use strict';

module.exports = (cfg = {}) => {
  const _ = cfg._ || require('lodash/fp');
  const config = cfg.config || require('./../config')();

  return class InputHandler {
    handle(container, player) {
      document.onmousemove = e => {
        const center = {
          x: container.offsetLeft + Math.floor(container.offsetWidth / 2),
          y: container.offsetTop + Math.floor(container.offsetHeight / 2)
        };
        player.position[0] = Math.atan2(e.pageY - center.y, e.pageX - center.x);
      };

      document.onkeydown = e => {
        const state = convertKeyEventToState(e);
        if (player.states.indexOf(state) === -1) {
          player.states.push(state);
        }
      };

      document.onkeyup = e => {
        const index = player.states.indexOf(convertKeyEventToState(e));
        if (index !== -1) {
          player.states.splice(index, 1);
        }
      };
    }
  };

  function convertKeyEventToState(e) {
    return _.findKey(val => val === e.keyCode, config.KEY_STATE_MAP);
  }
};
