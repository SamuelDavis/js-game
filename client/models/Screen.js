'use strict';

module.exports = (cfg = {}) => {
  const config = cfg.config || require('./../config')();

  return class Screen {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.offsetX = 0;
      this.offsetY = 0;
    }

    setOffset(offsetX, offsetY) {
      this.offsetX = offsetX;
      this.offsetY = offsetY;
      return this;
    }

    fitToWindow() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      return this;
    }

    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = config.COLORS.BLACK;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return this;
    }

    renderText(text, x = 0, y = 0) {
      this.ctx.fillStyle = config.COLORS.WHITE;
      this.ctx.textBaseline = 'top';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(text, x, y, this.ctx.width);
      return this;
    }

    renderSquare(r, x, y, w, h, color = config.COLORS.WHITE) {
      this.ctx.save();
      this.ctx.rotate(r);
      this.ctx.translate(-Math.floor(w / 2), -Math.floor(h / 2));
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x - this.offsetX, y - this.offsetY, w, h);
      this.ctx.restore();
      return this;
    }

    renderPlayer(player, w, h, color = config.COLORS.WHITE) {
      const centerWidth = Math.floor(this.canvas.width / 2);
      const centerHeight = Math.floor(this.canvas.height / 2);
      const [r, x, y] = player.position.slice(0, 3);
      this.ctx.translate(centerWidth, centerHeight);
      this.renderSquare(r, x, y, w, h, color);
      this.ctx.translate(-centerWidth, -centerHeight);
      return this;
    }
  };
};
