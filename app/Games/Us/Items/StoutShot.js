import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function(options) {
    var item = Object.assign({
        name: "Stout Shot",
        description: "Consume to gain 3 grit and increase max hp by 3.",
        systemMessage: "Drop on unit portrait to consume.",
        icon: 'YellowSyringe',
        fontType: 'stimulant',
        placePredicate: function(position) {
            var currentUnitPortrait = globals.currentGame.unitSystem.unitPanel.currentPortrait;
            var currentUnit = globals.currentGame.unitSystem.unitPanel.prevailingUnit;
            if(currentUnitPortrait.containsPoint(position)) {
                currentUnit.grit += 3;
                currentUnit.maxHealth += 3;
                Matter.Events.trigger(currentUnit, 'consume', {});
                globals.currentGame.itemSystem.removeItem(this);
                return false;
            }
            return true;
        },
    }, options);
    return new ic(item);
}
