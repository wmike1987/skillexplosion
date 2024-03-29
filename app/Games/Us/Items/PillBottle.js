import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    gritAddition: 10,
    defenseAddition: 0.7,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Pill Bottle",
        description: ["Add 10 to grit.", "Add 0.7 to armor."],
        icon: 'PillBottle',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
