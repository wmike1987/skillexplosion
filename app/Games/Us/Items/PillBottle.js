import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    maxHealth: 10,
    gritAddition: 10,
    defenseAddition: 0.4,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Pill Bottle",
        description: ["Add 10 to grit.", "Add 10 to maximum health.", "Add 0.4 to armor."],
        icon: 'PillBottle',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
