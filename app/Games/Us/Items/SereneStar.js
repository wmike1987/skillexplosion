import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    maxEnergy: 6,
    energyRegenerationRate: 0.25,
    events: {knifeKill: {callback: function(event) {
            event.equippedUnit.giveEnergy(2);
            unitUtils.applyEnergyGainAnimationToUnit(event.equippedUnit);
        }
    }}
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Serene Star",
        description: ["Add 6 to maximum energy.", "Regenerate +0.25 energy per second.", "Gain 2 energy after knife kill."],
        icon: 'SereneStar',
    }, options, shaneOnly);
    return new ic(item);
}
