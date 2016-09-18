import Game from './Game';
import {Actor, TestActor} from './Actors';
import Input from './Input';
import Player from './Player';

const player = new Player(new Input());

const game = new Game([
  new TestActor(),
  new Actor(player),
  new TestActor()
]);

game.update();
