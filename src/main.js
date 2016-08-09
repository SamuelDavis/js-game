import Screen from './display/Screen';
import Player from './Player';
import Input from './Input';
import {Loop} from './utils';

const map = {
  actors: []
};
const screen = new Screen(map);
screen.getBuffers().forEach(document.body.appendChild.bind(document.body));
screen.start();

const player = new Player(50, 50);
const input = new Input(player);
map.actors.push(player);

const updateLoop = new Loop(10, () => {
  map.actors.forEach(actor => actor.update());
});

updateLoop.start();

