import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default {
    unlockerInit: function() {
        var self = this;
        this.keyPoints = {};
        this.unlockContext = {};
    },

    giveUnlockerKey: function(id) {
        var existingPoints = this.keyPoints.id;

        if(this.keyPoints[id] == null) {
            this.keyPoints[id] = 1;
        } else {
            this.keyPoints[id] += 1;
        }
    },

    setUnlockContext: function(id, context) {
        this.unlockContext[id] = context;
    },

    clearUnlockContext: function(id) {
        this.unlockContext[id] = null;
    },

    removeUnlockerKey: function(id) {
        this.keyPoints[id] -= 1;
    },

    canUnlockSomething: function(id) {
        return this.keyPoints[id] != null && this.keyPoints[id] >= 1;
    },

    unlockSomething: function(id, something) {
        if(something) {
            something.unlocked = true;
        }
        Matter.Events.trigger(this, 'unlockedSomething', {something: something});
        Matter.Events.trigger(something, 'unlockedSomething');
        this.keyPoints[id] -= 1;
        this.unlockContext[id] = null;
    },
};
