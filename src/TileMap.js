let tileSheet, sheetWidth, sheetHeight, tileSize;

export default class TileMap {
  constructor(_tileSheet, _sheetWidth, _sheetHeight, _tileSize) {
    tileSheet = _tileSheet;
    sheetWidth = _sheetWidth;
    sheetHeight = _sheetHeight;
    tileSize = _tileSize;
  }

  buildOptions() {
    const tileMap = {};

    for (let y = 0; y < 44; y++) {
      for (let x = 0; x < 7; x++) {
        tileMap[y * 7 + x + 1] = [x, y].map((val, i) => val * tileSize[i]);
      }
    }

    return {
      tileSet: tileSheet,
      bg: 'transparent',
      tileWidth: tileSize[0],
      tileHeight: tileSize[1],
      tileMap
    };
  }
}
