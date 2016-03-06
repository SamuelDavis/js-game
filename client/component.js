"use strict";
let EntityFlyweight = require("./entity_flyweight.js"),
    Lib = require("./lib.js");

class Component extends EntityFlyweight {
    constructor() {
        super();
        this.id = ["Component"];
        this.getId()
    }
}

class Position extends Component {
    constructor() {
        super();
        this.id.push("Position");
    }

    setPoint(vec) {
        return this.setData("vector", vec);
    }

    getPoint() {
        return this.getData("vector");
    }

    setFacing(facing) {
        return this.setData("facing", facing);
    }

    getFacing() {
        return this.getData("facing");
    }

    move(point) {
        this.setPoint(Lib.POINT.add(this.getPoint(), point));
        return this;
    }

    turn(r) {
        this.setFacing((this.getFacing() + r) % (2 * Math.PI));
        return this;
    }
}

module.exports = {
    POSITION: new Position()
};
