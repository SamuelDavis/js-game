"use strict";
let State = require("./state.js");

let player,
    inputs = {
        autoAttack: 49,
        turnRight: 68,
        turnLeft: 65,
        walkForward: 83,
        walkBackward: 87,
        strafeRight: 69,
        strafeLeft: 81
    };


class Input {
    static init() {
        document.addEventListener("click", this.mouseDown);
        document.addEventListener("keydown", this.keyDown);
        document.addEventListener("keyup", this.keyUp);
    }

    static setPlayer(entity) {
        player = entity;
    }

    static mouseDown(e) {
        console.log(e);
    }

    static keyDown(e) {
        switch (e.keyCode) {
            case inputs.walkForward:
            {
                player.enterState(State.WALK_FORWARD);
                break;
            }
            case inputs.walkBackward:
            {
                player.enterState(State.WALK_BACKWARD);
                break;
            }
            case inputs.turnLeft:
            {
                player.enterState(State.TURN_LEFT);
                break;
            }
            case inputs.turnRight:
            {
                player.enterState(State.TURN_RIGHT);
                break;
            }
            default:
                console.log(e.keyCode);
        }
    }

    static keyUp(e) {
        switch (e.keyCode) {
            case inputs.walkForward:
            {
                player.exitState(State.WALK_FORWARD);
                break;
            }
            case inputs.walkBackward:
            {
                player.exitState(State.WALK_BACKWARD);
                break;
            }
            case inputs.turnLeft:
            {
                player.exitState(State.TURN_LEFT);
                break;
            }
            case inputs.turnRight:
            {
                player.exitState(State.TURN_RIGHT);
                break;
            }
            default:
                console.log(e.keyCode);
        }
    }
}

module.exports = Input;