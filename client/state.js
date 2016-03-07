"use strict";
let EntityFlyweight = require("./entity_flyweight.js"),
    Component = require("./component.js"),
    Lib = require("./lib.js");

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

    getUpdated() {
        return this.getData("update");
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

        //while (position.getColliding()) {
        //    let reversedPoint = [
        //        speed * Math.sin(facing) * this.dir * -1,
        //        speed * Math.cos(facing) * this.dir * -1
        //    ];
        //    position.setPoint(reversedPoint);
        //}

        position.move([
            speed * Math.sin(facing) * this.dir,
            speed * Math.cos(facing) * this.dir
        ]);

        return this;
    }
}

class Strafe extends State {
    constructor(dir) {
        super();
        this.dir = dir;
        this.id.push("Strafe");
        this.id.push((dir > 0) ? "R" : "L");
    }

    update(game) {
        super.update(game);
        let position = Component.POSITION.bindTo(this.entity),
            facing = position.getFacing() + Math.PI / 2,
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
    STRAFE_RIGHT: new Strafe(1),
    STRAFE_LEFT: new Strafe(-1),
    TURN_RIGHT: new Turn(-1),
    TURN_LEFT: new Turn(1)
};
