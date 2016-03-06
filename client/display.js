"use strict";
let Entity = require("./entity.js"),
    Component = require("./component.js"),
    Lib = require("./lib.js"),
    $ = require("jquery");

let config = {
    speed: 1000 / 60
};

var screen, screenWidth, screenHeight, screenCenter, ctx, $entityList, player;

class Display {
    constructor(customConfig) {
        Object.assign(config, customConfig);
        screen = document.getElementById("screen");
        screenWidth = $(screen).css("width").replace("px", "");
        screenHeight = $(screen).css("height").replace("px", "");
        screenCenter = 0;
        $entityList = $("#entity-list");
    }

    static rotate(rads) {
        $(screen).css("transform", `rotate(${rads}rad)`);
    }

    static setPlayer(entity) {
        player = entity;
    }

    start() {
        this.render(Date.now());
    }

    render(lastTimestamp) {
        let thisTimestamp = Date.now(),
            delta = thisTimestamp - lastTimestamp,
            display = this;

        screenCenter = Lib.POINT.subtract(
            Component.POSITION.bindTo(player).getPoint(),
            [screenWidth / 2, screenHeight / 2]
        );

        $entityList.find(":not(.clone)").remove();
        ctx = screen.getContext("2d");
        ctx.rotate(0);
        ctx.fillStyle = "#0FF";
        ctx.fillRect(0, 0, screenWidth, screenHeight);

        Entity.list.forEach((entity) => {
            if (!entity) {
                return;
            }
            Display.listEntity(entity);
            Display.renderEntity(entity);
        });

        if (player) {
        }

        setTimeout(() => {
            display.render(Date.now());
        }, Math.max(0, config.speed - delta));
    }

    static renderEntity(entity) {
        let position = Component.POSITION.bindTo(entity),
            point = position.getPoint(),
            facing = position.getFacing();

        ctx.fillStyle = "#000";
        ctx.save();
        ctx.translate(point[0] - screenCenter[0], point[1] - screenCenter[1]);
        ctx.rotate(facing * -1);
        ctx.fillText("^", -2.3, 5);
        ctx.fillRect(0, 0, 1, 1);
        ctx.restore();

        if (entity === player) {
            Display.rotate(facing);
        }
    }

    static listEntity(entity) {
        let $item = $entityList.find("#item-template").clone();
        $item.html(JSON.stringify(entity.serialize(), null, 2));
        $item.attr("id", `#entity-${entity.id}`);
        $entityList.append($item);
        $item.removeClass("clone");
    }
}

module.exports = Display;