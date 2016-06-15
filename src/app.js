'use strict';

const ui = require('./ui');

const ACTOR_STATES = {
  WALK_FORWARD: null,
  WALK_RIGHT: null,
  WALK_BACKWARD: null,
  WALK_LEFT: null
}.keysToValues();

module.exports = {
  update,
  buildActor,
  resolveActorCollision,
  ACTOR_STATES
};

function update(player, actors = []) {
  const startTime = new Date();
  const pressed = ui.INPUT.getPressed();
  const keys = ui.INPUT.getKeys();
  player.a = -ui.INPUT.calcCursorAngle(player.x, player.y);
  keys.forOwn((key, val) => {
    if (ACTOR_STATES.hasOwnProperty(key) && pressed.includes(val)) {
      player.states.add(key)
    } else {
      player.states.remove(key);
    }
  });
  actors.forEach(actor => {
    actor.a = -Math.TrigAngleBetween(actor.x, actor.y, player.x, player.y);
  });
  actors.concat(player).forEach(actor => {
    actor.update();
    actors.concat(player).forEach(resolveActorCollision.bind(null, actor));
  });
  setTimeout(update.bind(this, player, actors), Math.min(0, 1000 / 100 - (new Date() - startTime)));
}


function buildActor(attributes) {
  const actor = Object.assign({x: 0, y: 0, a: 0, speed: 1, states: []}, attributes);
  const actions = {
    moveForward: () => {
      actor.x += Math.TrigX(actor.a - Math.HalfPI, -actor.speed);
      actor.y += Math.TrigY(actor.a - Math.HalfPI, -actor.speed);
    },
    moveRight: () => {
      actor.x += Math.TrigX(actor.a, -actor.speed);
      actor.y += Math.TrigY(actor.a, -actor.speed);
    },
    moveBackward: () => {
      actor.x += Math.TrigX(actor.a - Math.HalfPI, actor.speed);
      actor.y += Math.TrigY(actor.a - Math.HalfPI, actor.speed);
    },
    moveLeft: () => {
      actor.x += Math.TrigX(actor.a, actor.speed);
      actor.y += Math.TrigY(actor.a, actor.speed);
    }
  };

  return Object.assign(actor, actions, {
    update: () => {
      if (actor.states.includes(ACTOR_STATES.WALK_FORWARD)) {
        actor.moveForward();
      }
      if (actor.states.includes(ACTOR_STATES.WALK_RIGHT)) {
        actor.moveRight();
      }
      if (actor.states.includes(ACTOR_STATES.WALK_BACKWARD)) {
        actor.moveBackward();
      }
      if (actor.states.includes(ACTOR_STATES.WALK_LEFT)) {
        actor.moveLeft();
      }
    }
  });
}

function resolveActorCollision(actor, check) {
  const origA = actor.a;
  while (actor !== check && Math.TrigDistBetween(actor.x, actor.y, check.x, check.y) < 5) {
    actor.a = -Math.TrigAngleBetween(actor.x, actor.y, check.x, check.y);
    actor.moveBackward();
  }
  actor.a = origA;
}
