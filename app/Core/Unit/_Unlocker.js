import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

export default {
    unlockerInit: function() {
        var self = this;
        this.keyPoints = 0;
    },

    giveUnlockerKey: function() {
        this.keyPoints += 1;
    },

    removeUnlockerKey: function() {
        this.keyPoints -= 1;
    },

    canUnlockSomething: function() {
        return this.keyPoints >= 1;
    },

    unlockSomething: function(something) {
        something.unlocked = true;
        Matter.Events.trigger(this, 'unlockedSomething', {something: something})
        this.keyPoints -= 1;
    },
}
