"use strict";

let Game = require("./game.js"),
    Input = require("./input.js"),
    Display = require("./display.js"),
    Entity = require("./entity.js"),
    State = require("./state.js");

Input.init();

let display = new Display(),
    game = new Game(),
    player = new Entity.Thing([18, 18], Math.PI, [7.5, 7.5]);

new Entity.Thing([4, 2]);

player.enterState(State.IDLE);
Input.setPlayer(player);
Display.setPlayer(player);

game.start();

document.body.onload = () => display.start();
