import Display from './Display';
import Map from './Map';
import UI from './UI';
import Game from './Game';
import Cursor from './cursor';
import TileMap from './TileMap';

const game = new Game();
const map = new Map([
  [1, 2, 2, 1, 4, 4, 4, 1, 1, 1],
  [1, 1, 2, 2, 2, 4, 4, 4, 3, 3],
  [4, 4, 3, 2, 2, 2, 2, 1, 3, 3],
  [4, 4, 3, 3, 2, 1, 1, 1, 1, 3],
  [1, 1, 1, 1, 1, 1, 1, 2, 2, 1],
  [2, 1, 4, 4, 4, 3, 1, 2, 2, 1],
  [2, 2, 4, 4, 4, 3, 3, 1, 2, 1],
  [2, 2, 1, 1, 1, 3, 3, 1, 4, 4],
  [3, 3, 3, 2, 4, 4, 1, 1, 4, 4],
  [1, 1, 3, 3, 4, 4, 1, 1, 1, 1]
], [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 91, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
]);


const cursor = new Cursor(map, 0, 0);
const tileMap = new TileMap(document.getElementById('tiles'), 7, 44, [16, 16]);
const display = new Display(10, 10, tileMap.buildOptions(), map, cursor)
  .unpause();
const ui = new UI(game, display, map, cursor).applyKeyBindings();
