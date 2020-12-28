import ic from '@core/Unit/ItemConstructor.js'
import * as Matter from 'matter-js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils'

var manipulations = {
    maxEnergy: 5,
    energyRegenerationRate: .5,
    events: {knifeKill: {currentEnergy: 3, callback: function(unit) {
            var tint = 0xf629a8;
            graphicsUtils.applyGainAnimationToUnit(unit, tint);
        }
    }}
}

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Serene Star",
        description: ["Add +5 to maximum energy.", "Regenerate +0.5 energy per second.", "Gain 3 energy after knife kill."],
        icon: 'SereneStar',
        type: 'Marine'
    }, options);
    return new ic(item);
};
