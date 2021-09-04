import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils';

var manipulations = {
    maxHealth: 18,
    gritAddition: 10,
    defenseAddition: 1,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Pill Bottle",
        description: ["Add 10% to grit.", "Add 18 to maximum health.", "Add 1 to armor."],
        icon: 'PillBottle',
        type: 'Medic',
        fontType: 'ursula'
    }, options);
    return new ic(item);
}
