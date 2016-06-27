'use strict';

require('./jsExtensions');
const Output = require('./output');
const {Loop, overrideEvent} = require('./utils');
const {Sheep} = require('./Entities');

const output = new Output(document.getElementById('screen')).resize(window.innerWidth, window.innerHeight);
window.onresize = overrideEvent(output.resize.bind(output, window.innerWidth, window.innerHeight));

const actors = [
  new Sheep({x: 100, y: 100})
];

const update = new Loop(100 / 1000, () => {
  actors.forEach(actor => actor.update({x: 0, y: 0, width: window.innerWidth, height: window.innerHeight}));
}).start();

const render = new Loop(60 / 1000, () => {
  output.clear();
  actors.forEach(output.renderEntity.bind(output));
}).start();
