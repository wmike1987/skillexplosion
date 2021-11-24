import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';
import {globals} from '@core/Fundamental/GlobalState.js';

var manipulations = {
    gritAddition: 6,
    maxEnergy: 12,
    energyRegenerationRate: 1,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Beret",
        description: ["Add 6 to grit.", "Add 12 to energy", "Regenerate +1 energy per second."],
        icon: 'GreenBeret',
    }, options, shaneOnly);
    return new ic(item);
}
