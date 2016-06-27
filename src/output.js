'use strict';

const {Rectangle, Circle} = require('./jsExtensions');
const COLORS = {
  BLACK: '#000000',
  RED: '#FF0000',
  GREEN: '#00FF00'
};

module.exports = class Output {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    return this;
  }

  /**
   * @param {Rectangle} rect
   * @returns {Output}
   */
  clear(rect) {
    return this.draw(() => {
      this.ctx.clearRect(rect.topLeft.x, rect.topLeft.y, rect.width, rect.height);
      this.ctx.fillStyle = COLORS.BLACK;
      this.ctx.fillRect(rect.topLeft.x, rect.topLeft.y, rect.width, rect.height);
      return this;
    });
  }

  /**
   * @param {Circle} circle
   * @returns {Output}
   */
  renderCircle(circle) {
    return this.draw(() => {
      this.ctx.fillStyle = COLORS.RED;
      this.ctx.beginPath();
      this.ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI, false);
      this.ctx.fill();
      return this;
    })
  }

  /**
   * @param {Rectangle} rect
   * @returns {Output}
   */
  renderRectangle(rect) {
    return this.draw(() => {
      this.ctx.fillStyle = COLORS.GREEN;
      this.ctx.fillRect(rect.topLeft.x, rect.topLeft.y, rect.width, rect.height);
      return this;
    })
  }

  draw(cb) {
    this.ctx.save();
    const ret = cb();
    this.ctx.restore();
    return ret;
  }
};
