import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    mineDamage: 6
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Extra Shrapnel",
        description: ["Add 6 to mine damage."],
        icon: 'SharpShrapnel',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
