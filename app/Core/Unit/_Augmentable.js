define(['jquery', 'matter-js', 'pixi', 'utils/GameUtils'], function($, Matter, PIXI, utils) {

    return {
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
})