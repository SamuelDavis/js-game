'use strict';

const {Entity, Sheep} = require('./Entities');
const GLYPHS = {
  [Sheep.constructor.name]: 'S'
};

class Output {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    return this;
  }

  clear() {
    return render.call(this, () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.COLORS.BLACK;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    });
  }

  /**
   * @param {Entity} entity
   */
  renderEntity(entity) {
    return render.call(this, drawGlyph.bind(this, this.ctx, entity));
  }
}

Output.prototype.COLORS = {
  BLACK: '#000000'
};

module.exports = Output;

function render(cb) {
  this.ctx.save();
  cb();
  this.ctx.restore();
  return this;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Entity} entity
 */
function drawGlyph(ctx, entity) {
}
