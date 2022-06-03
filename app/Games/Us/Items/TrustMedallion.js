import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    energyRegenerationRate: 0.5,
    healthRegenerationRate: 0.5,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Trust Medallion",
        description: ["Regenerate +0.5 health per second.",
                      "Regenerate +0.5 energy per second."],
        icon: 'SilverMedalCircle2',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
