import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function(options) {
    var item = Object.assign({
        name: "Technology Key",
        description: "Unlocks an ability.",
        systemMessage: "Drop on ability to unlock.",
        icon: 'TechnologyKey',
        dropCallback: function(position) {
            this.owningUnit.removeUnlockerKey();
            this.unlockHandler.removeHandler();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.hideAugmentsAndPassivesForUnit();
            }
            return true;
        },
        grabCallback: function() {
            this.owningUnit.giveUnlockerKey();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.showAugmentsAndPassivesForUnit(this.owningUnit);
            }
            this.unlockHandler = gameUtils.matterOnce(this.owningUnit, 'unlockedSomething', function() {
                globals.currentGame.itemSystem.removeItem(this);
            }.bind(this));
        },
        placeCallback: function() {
            this.owningUnit.removeUnlockerKey();
            this.unlockHandler.removeHandler();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.hideAugmentsAndPassivesForUnit();
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
