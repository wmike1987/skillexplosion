import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    maxHealth: 15,
    gritAddition: 15,
    defenseAddition: 0.25,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Pill Bottle",
        description: ["Add 15 to grit.", "Add 15 to maximum health.", "Add 0.25 to armor."],
        icon: 'PillBottle',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
