'use strict';

class Collection extends Array {
  add(val) {
    if (!this.includes(val)) {
      this.push(val);
    }
    return this;
  }

  remove(val) {
    if (this.includes(val)) {
      this.splice(this.indexOf(val), 1);
    }
    return this;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Rectangle {
  constructor(topLeft = new Point(), bottomRight = new Point()) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
    this.width = 0;
    this.height = 0;
    Object.assign(this, this.calculateDimensions());
  }

  calculateDimensions() {
    return {
      width: this.bottomRight.x - this.topLeft.x,
      height: this.bottomRight.y - this.topLeft.y
    };
  }

  /**
   * @param {Point} point
   * @returns {boolean}
   */
  contains(point) {
    return (
      point.x < this.topLeft.x ||
      point.x > this.bottomRight.x ||
      point.y < this.topLeft.y ||
      point.y > this.bottomRight.y
    );
  }

  /**
   * @param {Point} point
   * @returns {Rectangle}
   */
  expandToContain(point) {
    if (!this.topLeft.x || point.x < this.topLeft.x) {
      this.topLeft.x = point.x;
    }
    if (!this.bottomRight.x || point.x > this.bottomRight.x) {
      this.bottomRight.x = point.x;
    }
    if (!this.topLeft.y || point.y < this.topLeft.y) {
      this.topLeft.y = point.y;
    }
    if (!this.bottomRight.y || point.y > this.bottomRight.y) {
      this.bottomRight.y = point.y;
    }
    Object.assign(this, this.calculateDimensions());
    return this;
  }
}

class Circle {
  constructor(center = new Point(), radius = 0) {
    this.center = center;
    this.radius = radius;
    this.topLeft = new Point();
    this.bottomRight = new Point();
    Object.assign(this, this.calculatePoints());
  }

  calculatePoints() {
    return {
      topLeft: new Point(this.center.x - this.radius, this.center.y - this.radius),
      bottomRight: new Point(this.center.x + this.radius, this.center.y + this.radius)
    }
  }
}

class Loop {
  constructor(timeout, cb) {
    this.timeout = timeout;
    this.cb = cb;
    this.interval = null
  }

  start() {
    this.interval = setInterval(this.cb, this.timeout);
    return this;
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
    return this;
  }
}

module.exports = {
  Collection,
  Point,
  Rectangle,
  Circle,
  Loop
};
