"use strict";
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
}

module.exports = {
    POINT: Point
};