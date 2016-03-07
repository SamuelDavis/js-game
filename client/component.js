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

    init(point, facing) {
        let area = Lib.COLLISION.makeArea(point, module.exports.BOUNDS.bindTo(this.entity).getBounds());
        this.setArea(Lib.COLLISION.put(this.entity.id, area));
        this.setPoint(point);
        this.setFacing(facing);
        return this;
    }

    setArea(area) {
        return this.setData("area", area);
    }

    getArea() {
        return this.getData("area");
    }

    setLastPoint(point) {
        return this.setData("last-point", point);
    }

    getLastPoint() {
        return this.getData("last-point");
    }

    setPoint(point) {
        this.setLastPoint(this.getPoint());
        let area = Lib.COLLISION.makeArea(point, module.exports.BOUNDS.bindTo(this.entity).getBounds());
        Lib.COLLISION.update(this.entity.id, this.getArea(), area);
        return this.setData("point", point);
    }

    getPoint() {
        return this.getData("point");
    }

    setFacing(facing) {
        return this.setData("facing", facing);
    }

    setColliding(colliding) {
        return this.setData("colliding", colliding);
    }

    getColliding() {
        return this.getData("colliding");
    }

    getFacing() {
        return this.getData("facing");
    }

    move(point) {
        let newPoint = Lib.POINT.add(this.getPoint(), point),
            area = Lib.COLLISION.makeArea(this.getPoint(), module.exports.BOUNDS.bindTo(this.entity).getBounds()),
            otherEntities = Lib.COLLISION.get(area),
            colliding = false;

        otherEntities.forEach((otherArea) => {
            if (otherArea.id !== this.entity.id && Lib.COLLISION.colliding(area, otherArea)) {
                colliding = otherArea;
                return false;
            }
        });

        this.setColliding(colliding);

        this.setPoint(newPoint);
        return this;
    }

    turn(r) {
        this.setFacing((this.getFacing() + r) % (2 * Math.PI));
        return this;
    }
}

class Bounds extends Component {
    constructor() {
        super();
        this.id.push("Bounds");
    }

    init(bounds) {
        this.setBounds(bounds);
        return this;
    }

    setBounds(bounds) {
        return this.setData("bounds", bounds);
    }

    getBounds() {
        return this.getData("bounds");
    }
}

module.exports = {
    POSITION: new Position(),
    BOUNDS: new Bounds()
};
