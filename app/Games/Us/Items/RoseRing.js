import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    healthRegenerationRate: 1.0,
    maxHealth: 15
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Rose Ring",
        description: ["Add " + manipulations.maxHealth + " to max health.", "Regenerate +1 hp per second."],
        icon: 'RoseRing',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
