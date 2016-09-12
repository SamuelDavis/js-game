const ROT = require('rot-js');
import Input from './Input';
import Player from './Player';
import Display from './Display';
import Map from './Map';
import Game from './Game';
import {Sheep} from './actors';
ROT.RNG.setSeed(new Date().getMilliseconds());

const input = new Input();
const player = new Player(input);
const game = new Game(new Display(), new Map.Arena(25, 25), [
  new Sheep(Sheep),
  new Sheep(Sheep),
  new Sheep(player)
]);

game
  .update()
  .then(() => console.log('Done!'));
