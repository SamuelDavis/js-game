"use strict";
let Entity = require("./entity.js");

let config = {
    speed: 1000 / 120
};

class Game {
    constructor(customConfig) {
        Object.assign(config, customConfig);
    }

    start() {
        this.update(Date.now());
    }

    update(lastTimestamp) {
        let thisTimestamp = Date.now(),
            delta = thisTimestamp - lastTimestamp,
            game = this;

        Entity.list.forEach((entity) => {
            if (entity) {
                entity.update(game);
            }
        });

        setTimeout(function () {
            game.update(Date.now());
        }, Math.max(0, config.speed - delta));
    }
}

module.exports = Game;