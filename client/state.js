"use strict";
let EntityFlyweight = require("./entity_flyweight.js"),
    Component = require("./component.js");

class State extends EntityFlyweight {
    constructor() {
        super();
        this.id = ["State"]
    }

    enter() {
        this.setData("enter", new Date());
        return this;
    }

    update(game) {
        this.setData("update", new Date());
        return this;
    }

    exit() {
        this.setData("exit", new Date());
        return this;
    }
}

class Idle extends State {
    constructor() {
        super();
        this.id.push("Idle");
    }
}

class Walk extends State {
    constructor(dir) {
        super();
        this.dir = dir;
        this.id.push("Walk");
        this.id.push((dir > 0) ? "F" : "B");
    }

    update(game) {
        super.update(game);
        let position = Component.POSITION.bindTo(this.entity),
            facing = position.getFacing(),
            speed = this.getData("speed") || 1;

        position.move([
            speed * Math.sin(facing) * this.dir,
            speed * Math.cos(facing) * this.dir
        ]);

        return this;
    }
}

class Turn extends State {
    constructor(dir) {
        super();
        this.dir = dir * (Math.PI / 180);
        this.id.push("Turn");
        this.id.push((dir > 0) ? "R" : "L");
    }

    update(game) {
        super.update(game);
        let position = Component.POSITION.bindTo(this.entity),
            speed = this.getData("speed") || 1;

        position.turn(this.dir * speed);

        return this;
    }
}

module.exports = {
    IDLE: new Idle(),
    WALK_FORWARD: new Walk(1),
    WALK_BACKWARD: new Walk(-1),
    TURN_RIGHT: new Turn(-1),
    TURN_LEFT: new Turn(1)
};
