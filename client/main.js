'use strict';

const InputHandler = require('./services/InputHandler')();
const Screen = require('./models/Screen')();
const Actor = require('./models/Actor')();
const config = require('./config')();

const canvas = document.getElementById('screen');
const input = new InputHandler();
const screen = new Screen(canvas);
const player = new Actor();
input.handle(canvas, player);
screen.fitToWindow();

window.addEventListener('resize', () => screen.fitToWindow());
document.addEventListener('resize', screen.fitToWindow);

const tick = setInterval(() => {
  player.update();
  screen
    .clear()
    .setOffset(player.position[1], player.position[2])
    .renderText(JSON.stringify(player, null, 2))
    .renderSquare(0, canvas.width / 2, canvas.height / 2, 2, 2, config.COLORS.RED)
    .renderPlayer(player, 10, 10);
}, 10);
