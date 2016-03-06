"use strict";

class EntityFlyweight {
    constructor() {
        this.entity = null;
        this.id = [];
    }

    getId() {
        return this.id.join(".");
    }

    bindTo(entity) {
        this.entity = entity;
        if (!this.entity.data.hasOwnProperty(this.getId())) {
            this.entity.data[this.getId()] = {};
        }
        return this;
    }

    getData(key) {
        return this.entity.data[this.getId()][key];
    }

    setData(key, value) {
        this.entity.data[this.getId()][key] = value;
        return this;
    }
}

module.exports = EntityFlyweight;
