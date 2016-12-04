const STATS = require('./stats');

class Item {
  constructor({value = 0, weight = new STATS.Weight(0)}) {
    this.value = value;
    this.weight = weight;
  }
}

class Coins extends Item {
  constructor(
    {
      value = 1,
    }
  ) {
    super(Object.assign({value, weight: new STATS.Weight(value / 100)}, arguments[0]));
  }
}

class Earring extends Item {
  constructor(
    {
      weight = new STATS.Weight(1)
    }
  ) {
    super(Object.assign({weight}, arguments[0]));
  }
}

module.exports = {
  Coins,
  Earring
};
