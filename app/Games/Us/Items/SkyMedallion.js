import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    shaneOnly,
    ursulaOnly
} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    maxHealth: 8,
    gritAddition: 10,
    maxEnergy: 8,
    dodgeAddition: 5,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Sky Medallion",
        description: ["Add " + manipulations.gritAddition + " to grit.", "Add " + manipulations.maxHealth + " to maximum health.", "Add " + manipulations.maxEnergy + " to maximum energy.", "Add " + manipulations.dodgeAddition + " to dodge"],
        icon: 'SilverMedalCircle1',
    }, options, shaneOnly);
    return new ic(item);
}
