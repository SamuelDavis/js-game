'use strict';

module.exports = (cfg = {}) => {
  const util = cfg.util || require('./util')();

  const ACTOR_STATES = util.keysToValues({
    WALK_FORWARD: null,
    WALK_LEFT: null,
    WALK_BACK: null,
    WALK_RIGHT: null
  });

  const KEY_STATE_MAP = {
    [ACTOR_STATES.WALK_FORWARD]: 87,
    [ACTOR_STATES.WALK_LEFT]: 65,
    [ACTOR_STATES.WALK_BACK]: 83,
    [ACTOR_STATES.WALK_RIGHT]: 68
  };

  const COLORS = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    RED: '#FF0000'
  };

  return {
    ACTOR_STATES,
    KEY_STATE_MAP,
    COLORS
  };
};
