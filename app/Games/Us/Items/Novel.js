import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Novel",
        description: ['Master of a state of mind.'],
        fontType: 'book',

        systemMessage: "Drop on a state of mind to increase its effectiveness.",
        icon: 'GoldBook',

        dropCallback: function(position) {
            this.owningUnit.removeUnlockerKey('mindMaster');
            this.owningUnit.clearUnlockContext('mindMaster');
            this.unlockHandler.removeHandler();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.hidePassivesForCurrentUnit();
            }
            return true;
        },

        grabCallback: function() {
            this.owningUnit.giveUnlockerKey('mindMaster');
            this.owningUnit.setUnlockContext('mindMaster', this);
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.showPassivesForUnit(this.owningUnit);
            }
            this.unlockHandler = gameUtils.matterOnce(this.owningUnit, 'unlockedSomething', function() {
                globals.currentGame.itemSystem.removeItem(this);

                globals.currentGame.soundPool.passiveUpgrade.play();

                //show the icon fading
                var fadingIcon = graphicsUtils.cloneSprite(this.icon);
                fadingIcon.where = 'hud';
                fadingIcon.position = {x: gameUtils.getPlayableCenter().x, y: gameUtils.getPlayableHeight() - 30};
                graphicsUtils.makeSpriteSize(fadingIcon, 40);
                graphicsUtils.addSomethingToRenderer(fadingIcon);
                graphicsUtils.addBorderToSprite({
                    sprite: fadingIcon,
                    thickness: 1,
                    tint: 0xffffff
                });

                var fadeDuration = 750;
                graphicsUtils.fadeSpriteOverTime({sprite: fadingIcon, duration: 1000, noKill: false});

                graphicsUtils.floatSpriteNew(fadingIcon,
                    fadingIcon.position, {
                    duration: fadeDuration,
                });
            }.bind(this));
        },

        placeCallback: function() {
            this.owningUnit.removeUnlockerKey('mindMaster');
            this.owningUnit.clearUnlockContext('mindMaster');
            this.unlockHandler.removeHandler();
            if(globals.currentGame.isCurrentLevelConfigurable()) {
                globals.currentGame.unitSystem.unitPanel.hidePassivesForCurrentUnit();
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
