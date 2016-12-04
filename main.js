const STATS = require('./stats');
const ALIGNMENTS = require('./alignments');
const RACES = require('./races');
const ITEMS = require('./items');

class GameClass {
}
GameClass.prototype.baseHP = 0;
GameClass.prototype.baseLoad = 0;

class Thing extends GameClass {
}

class Entity {
  constructor(
    {
      name = 'Thing',
      look = "It's something, alright.",
      gameClass = new Thing(),
      stats = {},
      alignment = ALIGNMENTS.NEUTRAL,
      race = RACES.OBJECTS,
      equipment = [],
      inventory = []
    }
  ) {
    this.name = name;
    this.look = look;
    this.gameClass = gameClass;
    this.alignment = alignment;
    this.race = race;
    this.equipment = equipment;
    this.inventory = inventory;
    this.stats = Object.assign({
      hp: new STATS.Health(1),
      str: new STATS.Strength(1),
      con: new STATS.Constitution(1),
      dex: new STATS.Dexterity(1),
      int: new STATS.Intelligence(1),
      wis: new STATS.Wisdom(1),
      chr: new STATS.Charisma(1)
    }, stats);
  }

  getMaxHealth() {
    return this.stats.con.baseValue + this.gameClass.baseHP;
  }

  getCurrentHealth() {
    return this.stats.hp.getValue();
  }

  getMaxLoad() {
    return this.stats.str.getValue() + this.gameClass.baseLoad;
  }

  getCurrentLoad() {
    return [this.equipment, this.inventory]
      .reduce((total, container) => {
        return total + container.reduce((subtotal, item) => subtotal + item.weight.getValue(), 0);
      }, 0);
  }
}

const thing = new Entity({
  name: 'Ted',
  look: 'Soft and woolly.',
  stats: {
    str: new STATS.Strength(2),
  },
  equipment: [
    new ITEMS.Earring({})
  ],
  inventory: [
    new ITEMS.Coins({value: 3})
  ]
});
