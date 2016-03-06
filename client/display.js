"use strict";
let Entity = require("./entity.js"),
    Component = require("./component.js"),
    Lib = require("./lib.js"),
    $ = require("jquery");

let config = {
    speed: 1000 / 60,
    width: 100,
    height: 100,
    screenCount: 2
};

let screens = [], screen, screenCenter, $entityList, player;

function addScreens(count) {
    for (count = 0; count < config.screenCount; count++) {
        let $screen = $("<canvas>");
        $screen.css({
            width: config.width + "px",
            height: config.height + "px",
            "background-color": "green"
        });
        $screen.attr("width", config.width);
        $screen.attr("height", config.height);
        $screen.hide();
        $("body").prepend($screen);
        screens.push($screen.get(0));
    }
    screen = screens[0];
}

class Display {
    constructor(customConfig) {
        Object.assign(config, customConfig);
        addScreens(config.screenCount);
        screenCenter = [config.width / 2, config.height / 2];
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
        let oldScreen = screen;
        screen = screens[(screens.indexOf(screen) + 1) % screens.length];
        let thisTimestamp = Date.now(),
            delta = thisTimestamp - lastTimestamp,
            ctx = screen.getContext("2d"),
            display = this;

        screenCenter = Lib.POINT.subtract(
            Component.POSITION.bindTo(player).getPoint(),
            [config.width / 2, config.height / 2]
        );

        $entityList.find(":not(.clone)").remove();
        ctx.rotate(0);
        ctx.fillStyle = "#AAA";
        ctx.fillRect(0, 0, config.width, config.height);

        Entity.list.forEach((entity) => {
            if (!entity) {
                return;
            }
            Display.listEntity(entity);
            Display.renderEntity(ctx, entity);
        });

        $(screen).show();
        $(oldScreen).hide();

        Display.rotate(Component.POSITION.bindTo(player).getFacing());

        setTimeout(() => {
            display.render(Date.now());
        }, Math.max(0, config.speed - delta));
    }

    static renderEntity(ctx, entity) {
        let position = Component.POSITION.bindTo(entity),
            bounds = Component.BOUNDS.bindTo(entity).getBounds(),
            point = position.getPoint(),
            facing = position.getFacing();

        ctx.save();
        ctx.translate(point[0] - screenCenter[0], point[1] - screenCenter[1]);
        ctx.rotate(facing * -1);
        ctx.fillStyle = "#F00";
        ctx.fillRect(bounds[0] / 2 * -1, bounds[1] / 2 * -1, bounds[0], bounds[1]);
        ctx.fillStyle = "#000";
        Display.renderGlyph(ctx, entity);
        ctx.fillRect(0, 0, 1, 1);
        ctx.restore();
    }

    static listEntity(entity) {
        let $item = $entityList.find("#item-template").clone();
        $item.html(JSON.stringify(entity.serialize(), null, 2));
        $item.attr("id", `#entity-${entity.id}`);
        $entityList.append($item);
        $item.removeClass("clone");
    }

    static renderGlyph(ctx, entity) {
        switch (entity.constructor) {
            case Entity.Thing:
                ctx.fillText("^", -2.6, 5);
                break;
            default:
                ctx.fillText("?", -2.8, 4);
        }
    }
}

module.exports = Display;