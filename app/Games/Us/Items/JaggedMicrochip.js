import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

var amount = 4;

export default function(options) {
    var item = Object.assign({
        name: "Jagged Microchip",
        description: ["Enable a Knife augment.", 'Add ' + amount + ' to knife damage.'],
        poweredByMessage: {text: 'Jagged Microchip', style: 'basicPoweredByStyle'},
        conditionalPoweredByMessage: {text: '+ ' + amount + ' damage.', style: 'basicPoweredByStyle'},
        additionCondition: function(augment) {
            return true;
        },
        plugCondition: function(ability, augment) {
            return ability.name == 'Throw Knife';
        },
        plug: function() {
            this.owningUnit.knifeDamage += amount;
        },
        unplug: function() {
            this.owningUnit.knifeDamage -= amount;
        },
        plugTint: 0xfb5c43,
        systemMessage: "Drop on augment to enable.",
        icon: 'JaggedMicrochip',

        dropCallback: function(position) {
            this.owningUnit.removeUnlockerKey('augment');
            this.owningUnit.clearUnlockContext('augment');
            this.unlockHandler.removeHandler();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.hideAugmentsForCurrentUnit();
            }
            return true;
        },

        grabCallback: function() {
            this.owningUnit.giveUnlockerKey('augment');
            this.owningUnit.setUnlockContext('augment', this);
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.showAugmentsForUnit(this.owningUnit);
            }
            this.unlockHandler = gameUtils.matterOnce(this.owningUnit, 'unlockedSomething', function() {
                globals.currentGame.itemSystem.removeItem(this);
            }.bind(this));
        },

        placeCallback: function() {
            this.owningUnit.removeUnlockerKey('augment');
            this.owningUnit.clearUnlockContext('augment');
            this.unlockHandler.removeHandler();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.hideAugmentsForCurrentUnit();
            }
        },
        dropPredicate: function(dropPosition) {
            //if we're outsite the playing area, drop
            if(!gameUtils.isPositionWithinPlayableBounds(dropPosition)) {
                return true;
            }

            //else check to see if we're trying to drop within an augment panel, in which case don't drop
            var unitAugmentPanel = globals.currentGame.unitSystem.unitPanel.unitAugmentPanel;
            var unitPassivePanel = globals.currentGame.unitSystem.unitPanel.unitPassivePanel;
            return (!unitAugmentPanel.collidesWithPoint(dropPosition) && !unitPassivePanel.collidesWithPoint(dropPosition));
        }
    }, options);
    return new ic(item);
}
