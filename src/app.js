'use strict';

const ui = require('./ui');

module.exports = {
  update,
  buildActor,
  resolveActorCollision
};

function update(player, actors = []) {
  const startTime = new Date();
  const pressed = ui.INPUT.getPressed();
  player.a = -ui.INPUT.calcCursorAngle(player.x, player.y);
  if (pressed.includes(ui.INPUT.getKeys().WALK_FORWARD)) {
    player.moveForward();
  }
  if (pressed.includes(ui.INPUT.getKeys().WALK_RIGHT)) {
    player.moveRight();
  }
  if (pressed.includes(ui.INPUT.getKeys().WALK_BACKWARD)) {
    player.moveBackward();
  }
  if (pressed.includes(ui.INPUT.getKeys().WALK_LEFT)) {
    player.moveLeft();
  }
  actors.forEach(actor => {
    actor.a = -Math.TrigAngleBetween(actor.x, actor.y, player.x, player.y);
    actor.moveForward();
  });
  actors.concat(player).forEach(actor => {
    actors.concat(player).forEach(resolveActorCollision.bind(null, actor));
  });
  setTimeout(update.bind(this, player, actors), Math.min(0, 1000 / 100 - (new Date() - startTime)));
}


function buildActor(attributes) {
  const actor = Object.assign({x: 0, y: 0, a: 0, speed: 1}, attributes);
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

  return Object.assign(actor, actions);
}

function resolveActorCollision(actor, check) {
  const origA = actor.a;
  while (actor !== check && Math.TrigDistBetween(actor.x, actor.y, check.x, check.y) < 5) {
    actor.a = -Math.TrigAngleBetween(actor.x, actor.y, check.x, check.y);
    actor.moveBackward();
  }
  actor.a = origA;
}
