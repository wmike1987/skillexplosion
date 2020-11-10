import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

export default {
    augmentableInit: function() {
        var self = this;
        this.augmentPoints = 0;
        Matter.Events.on(this, 'levelup', function(event) {
            self.augmentPoints += 1;
        })
    },

    canUnlockAugment: function(augment) {
        return this.augmentPoints >= 1;
    },

    unlockAugment: function(augment) {
        augment.unlocked = true;
        this.augmentPoints -= 1;
    }
}
