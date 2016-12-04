const MIN = 1;
const MAX = 18;
const MODIFIERS = {
  17: 3,
  15: 2,
  12: 1,
  8: 0,
  5: -1,
  3: -2,
  0: -3
};

class Statistic {
  constructor(baseValue) {
    this.baseValue = baseValue;
    this.name = this.constructor.name;
  }

  getValue() {
    return this.baseValue;
  }
}
Statistic.prototype.ABBR = 'Stat';

class Health extends Statistic {
}
Health.prototype.ABBR = 'HP';

class Weight extends Statistic {
}
Weight.prototype.ABBR = 'WT';

class AbilityScore extends Statistic {
  constructor(baseValue) {
    if (baseValue < MIN || baseValue > MAX) {
      throw new Error(`Ability score out of range.`);
    }
    super(baseValue);
  }

  getMod() {
    const val = this.getValue();
    const CAPS = Object.keys(MODIFIERS).reverse();
    for (let i = 0; i < CAPS.length; i++) {
      if (val > CAPS[i]) {
        return MODIFIERS[CAPS[i]];
      }
    }
    throw new Error(`Ability modifier out of range.`);
  }

  getValue() {
    return Math.min(Math.max(Statistic.prototype.getValue.call(this), MIN), MAX);
  }
}

class Strength extends AbilityScore {
}
Strength.prototype.ABBR = 'Str';

class Constitution extends AbilityScore {
}
Constitution.prototype.ABBR = 'Con';

class Dexterity extends AbilityScore {
}
Dexterity.prototype.ABBR = 'Dex';

class Intelligence extends AbilityScore {
}
Intelligence.prototype.ABBR = 'Int';

class Wisdom extends AbilityScore {
}
Wisdom.prototype.ABBR = 'Wis';

class Charisma extends AbilityScore {
}
Charisma.prototype.ABBR = 'Cha';

module.exports = {
  MIN,
  MAX,
  Health,
  Weight,
  Strength,
  Constitution,
  Dexterity,
  Intelligence,
  Wisdom,
  Charisma
};
