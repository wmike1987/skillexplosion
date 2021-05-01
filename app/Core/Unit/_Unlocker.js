import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default {
    unlockerInit: function() {
        var self = this;
        this.keyPoints = {};
    },

    giveUnlockerKey: function(id) {
        var existingPoints = this.keyPoints.id;

        if(this.keyPoints.id == null) {
            this.keyPoints.id = 1;
        } else {
            this.keyPoints.id += 1;
        }
    },

    removeUnlockerKey: function(id) {
        this.keyPoints.id -= 1;
    },

    canUnlockSomething: function(id) {
        return this.keyPoints.id == null || this.keyPoints.id >= 1;
    },

    unlockSomething: function(id, something) {
        if(something) {
            something.unlocked = true;
        }
        Matter.Events.trigger(this, 'unlockedSomething', {something: something});
        this.keyPoints.id -= 1;
    },
};
