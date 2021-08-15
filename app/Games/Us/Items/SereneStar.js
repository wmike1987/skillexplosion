import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils';

var manipulations = {
    maxEnergy: 5,
    energyRegenerationRate: 0.5,
    events: {knifeKill: {callback: function(event) {
            var tint = 0xf629a8;
            event.equippedUnit.giveEnergy(2);
            graphicsUtils.applyGainAnimationToUnit(event.equippedUnit, tint);
        }
    }}
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Serene Star",
        description: ["Add +5 to maximum energy.", "Regenerate +0.5 energy per second.", "Gain 2 energy after knife kill."],
        icon: 'SereneStar',
        type: 'Marine'
    }, options);
    return new ic(item);
}
