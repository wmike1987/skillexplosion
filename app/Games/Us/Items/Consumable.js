import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals, keyStates} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default {
    grabPredicate: function() {
        if(keyStates.Control) {
            this._consume();
            return false;
        }
        return true;
    },
    _consume: function() {
        //convenience predicate
        if(this.preventConsumption) {
            return;
        }

        //customizable predicate
        if(this.consumptionPredicate) {
            if(!this.consumptionPredicate()) {
                return;
            }
        }

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

        var unit = globals.currentGame.unitSystem.unitPanel.prevailingUnit;
        this.consume(unit);
        Matter.Events.trigger(unit, 'consume', {item: this});
        globals.currentGame.itemSystem.removeItem(this);
    }
};
