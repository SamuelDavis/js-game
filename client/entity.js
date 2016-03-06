"use strict";
let Component = require("./component.js"),
    State = require("./state.js");

let entities = [];

class Entity {
    constructor() {
        this.id = entities.indexOf(null) >= 0 ? entities.indexOf(null) : entities.length;
        entities[this.id] = this;
        this.states = new Set();
        this.data = {};
    }

    enterState(state) {
        state.bindTo(this).enter();
        if (!this.states.has(state)) {
            this.states.add(state);
        }
        if (this.states.size > 1) {
            this.exitState(State.IDLE);
        }
        return this;
    }

    exitState(state) {
        if (this.states.has(state)) {
            state.bindTo(this).exit();
            this.states.delete(state);
            if (this.states.size < 1) {
                this.enterState(State.IDLE);
            }
        }
        return this;
    }

    update(game) {
        this.states.forEach((state) => state.bindTo(this).update(game));
        return this;
    }

    serialize() {
        let states = [];
        this.states.forEach((state) => states.push(state.getId()));

        return {
            id: this.id,
            data: this.data,
            states: states
        }
    }
}

class Thing extends Entity {
    constructor(point, facing) {
        point = point || [0, 0];
        facing = facing || 0;
        super();
        Component.POSITION.bindTo(this).setPoint(point).setFacing(facing)
    }
}

module.exports = {
    Thing: Thing,
    list: entities
};
