import COLORS from './colors';
import {Loop, overrideEvent} from './../utils';

export default class Screen {
  constructor(map, bufferCount = 2) {
    this._map = map;
    this.offset = {x: 0, y: 0, angle: 0};
    /**
     * @type {HTMLCanvasElement[]}
     * @private
     */
    this._buffers = [];
    while (bufferCount--) {
      /**
       * @type {HTMLCanvasElement}
       */
      const canvas = document.createElement('canvas');
      canvas.setAttribute('id', `buffer-${bufferCount}`);
      canvas.setAttribute('width', '0');
      canvas.setAttribute('height', '0');
      this._buffers.push(canvas);
    }
    this._buffer = this._buffers[0];
    this._renderLoop = new Loop(60 / 1000, this.render.bind(this));
    window.onresize = overrideEvent(e => this.resize(window.innerWidth, window.innerHeight));
    this.resize(window.innerWidth, window.innerHeight);
  }

  start() {
    this._renderLoop.start();
    return this;
  }

  getBuffers() {
    return this._buffers;
  }

  resize(width, height) {
    this._buffers.forEach(buffer => {
      buffer.width = width;
      buffer.height = height;
    });
    return this;
  }

  /**
   * @returns {HTMLCanvasElement}
   * @private
   */
  _getNextBuffer() {
    const lastBuffer = this._buffers[this._buffers.indexOf(this._buffer)];
    this._buffer = this._buffers[(this._buffers.indexOf(lastBuffer) + 1) % this._buffers.length];
    lastBuffer.style.visibility = 'visible';
    this._buffer.style.visibility = 'hidden';
    return this._buffer;
  }

  render() {
    const ctx = this._getNextBuffer().getContext('2d');
    ctx.clearRect(0, 0, this._buffer.width, this._buffer.height);
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, this._buffer.width, this._buffer.height);
    this._map.actors.forEach(Screen._renderActor.bind(Screen, ctx, this.offset));
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} offset
   * @param {Player} actor
   * @private
   */
  static _renderActor(ctx, offset, actor) {
    ctx.save();
    ctx.translate(actor.x + offset.x, actor.y + offset.y);
    ctx.rotate(actor.angle + offset.angle);
    ctx.textAlign = 'middle';
    ctx.textBaseline = 'center';
    ctx.fillStyle = COLORS.RED;
    ctx.fillText('>', 0, 0);
    ctx.restore();
  }
}
