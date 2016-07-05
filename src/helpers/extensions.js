'use strict';

Array.prototype.add = function (val) {
  return this.includes(val) ? null : this.push(val);
};
Array.prototype.remove = function (val) {
  return this.includes(val) ? this.splice(this.indexOf(val), 1) : null;
};
Array.prototype.includesAny = function (items) {
  for (let i = 0; i < items.length; i++) {
    if (this.includes(items[i])) {
      return true;
    }
  }
  return false;
}
