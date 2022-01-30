import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    energyRegenerationRate: 0.5,
    maxEnergy: 5,
    healthRegenerationRate: 0.5,
    maxHealth: 5
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Trust Medallion",
        description: ["Add " + manipulations.maxHealth + " to max health.", "Regenerate +0.5 health per second.",
                      "Add " + manipulations.maxEnergy + " to max energy.", "Regenerate +0.35 energy per second."],
        icon: 'SilverMedalCircle2',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
