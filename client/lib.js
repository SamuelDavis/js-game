"use strict";

var QuadTree = require("simple-quadtree"),
    Component = require("./component.js");

class Point {
    static add(p1, p2) {
        return [
            p1[0] + p2[0],
            p1[1] + p2[1]
        ];
    }

    static subtract(p1, p2) {
        return [
            p1[0] - p2[0],
            p1[1] - p2[1]
        ];
    }

    static lessThan(p1, p2) {
        return Math.pow(p2[0], 2) + Math.pow(p2[1], 2) < Math.pow(p2[0], 2) + Math.pow(p2[1], 2);
    }
}

var qt, collisionConfig = {
    width: 250,
    height: 250
};

class Collision {
    constructor(width, height) {
        Object.assign(collisionConfig, {width, height});
        qt = new QuadTree(0, 0, collisionConfig.width, collisionConfig.height);
    }

    get(area) {
        return qt.get(area);
    }

    put(id, area) {
        area.id = id;
        qt.put(area);
        return area;
    }

    update(id, oldArea, newArea) {
        oldArea.id = id;
        newArea.id = id;
        return qt.update(oldArea, "id", newArea);
    }

    makeArea(point, bounds) {
        return {x: point[0], y: point[1], w: bounds[0], h: bounds[1]};
    }

    colliding(area1, area2) {
        let colliding = area1.x < area2.x + area2.w &&
            area1.x + area1.w > area2.x &&
            area1.y < area2.y + area2.h &&
            area1.h + area1.y > area2.y;

        return colliding
    }
}

module.exports = {
    POINT: Point,
    COLLISION: new Collision()
};