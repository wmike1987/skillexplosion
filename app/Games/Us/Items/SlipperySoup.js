import ic from '@core/Unit/ItemConstructor.js'
import * as Matter from 'matter-js'
import {globals} from '@core/Fundamental/GlobalState.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

export default function() {
    return ic({
        name: "Slippery Blend",
        description: "Consume to gain 4 dodge.",
        systemMessage: "Drop on unit portrait to consume.",
        icon: 'NeonGreenSyringe',
        placePredicate: function(position) {
            var currentUnitPortrait = globals.currentGame.unitSystem.unitPanel.currentPortrait;
            var currentUnit = globals.currentGame.unitSystem.unitPanel.prevailingUnit;
            if(currentUnitPortrait.containsPoint(position)) {
                currentUnit.dodge += 4;
                globals.currentGame.itemSystem.removeItem(this);
                return false;
            }
            return true;
        },
    })
};
