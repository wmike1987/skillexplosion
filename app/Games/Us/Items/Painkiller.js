import ic from '@core/Unit/ItemConstructor.js'
import * as Matter from 'matter-js'
import {globals} from '@core/Fundamental/GlobalState.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

export default function() {
    return ic({
        name: "Painkiller",
        description: "Consume to gain 1 armor.",
        systemMessage: "Drop on unit portrait to consume.",
        icon: 'BlackSyringe',
        placePredicate: function(position) {
            var currentUnitPortrait = globals.currentGame.unitSystem.unitPanel.currentPortrait;
            var currentUnit = globals.currentGame.unitSystem.unitPanel.prevailingUnit;
            if(currentUnitPortrait.containsPoint(position)) {
                currentUnit.defense += 1;
                Matter.Events.trigger(currentUnit, 'consume', {});
                globals.currentGame.itemSystem.removeItem(this);
                return false;
            }
            return true;
        },
    })
};
