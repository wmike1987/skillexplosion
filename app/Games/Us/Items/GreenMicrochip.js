import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function(options) {
    var item = Object.assign({
        name: "Green Microchip",
        description: ["Enable a Dash augment or Secret Step augment.", 'Decrease energy cost by 1.'],
        poweredByMessage: {text: 'Green Microchip', style: 'basicPoweredByStyle'},
        conditionalPoweredByMessage: {text: '-1 to energy cost.', style: 'basicPoweredByStyle'},
        additionCondition: function(augment) {
            return true;
        },
        plugCondition: function(ability, augment) {
            return ability.name == 'Dash' || ability.name == 'Secret Step';
        },
        plug: function(ability) {
            ability.energyCost -= 1;
        },
        unplug: function(ability) {
            ability.energyCost += 1;
        },
        plugTint: 0x22ec5b,
        systemMessage: "Drop on augment to enable.",
        icon: 'GreenMicrochip',

        dropCallback: function(position) {
            this.owningUnit.removeUnlockerKey('augment');
            this.unlockHandler.removeHandler();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.hideAugmentsForUnit();
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
            this.unlockHandler.removeHandler();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.hideAugmentsForUnit();
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
