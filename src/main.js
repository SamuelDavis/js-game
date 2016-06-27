'use strict';

require('./jsExtensions');
const Output = require('./output');
const {Loop, overrideEvent} = require('./utils');
const {Sheep} = require('./Entities');

const output = new Output(document.getElementById('screen')).resize(window.innerWidth, window.innerHeight);
window.onresize = overrideEvent(output.resize.bind(output, window.innerWidth, window.innerHeight));

const actors = [
  new Sheep()
];

const update = new Loop(100 / 1000, () => {
  actors.forEach(actor => actor.states.forOwn(state => state.update()));
}).start();

const render = new Loop(60 / 1000, () => {
  output.clear();
  actors.forEach(output.render.bind(output));
}).start();
