'use strict';

const {Entity, Sheep} = require('./Entities');
const {POSITION} = require('./Components');
const GLYPHS = {
  [Sheep.name]: 'S'
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
    return render.call(this, () => {
      const t = GLYPHS[entity.class] || '?';
      const {x, y, a} = entity.data[POSITION.class];
      this.ctx.textBaseline = 'middle';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = this.COLORS.WHITE;
      this.ctx.translate(x, y);
      this.ctx.rotate(a);
      this.ctx.fillText(t, 0, 0);
    });
  }
}

Output.prototype.COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF'
};

module.exports = Output;

function render(cb) {
  this.ctx.save();
  cb();
  this.ctx.restore();
  return this;
}
