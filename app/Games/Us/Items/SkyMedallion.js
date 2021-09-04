import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils';

var manipulations = {
    maxHealth: 10,
    gritAddition: 10,
    maxEnergy: 10,
    dodgeAddition: 3,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Sky Medallion",
        description: ["Add 10% to grit.", "Add 10 to maximum health.", "Add 10 to maximum energy.", "Add 3 to dodge"],
        icon: 'SilverMedalCircle1',
        type: 'Marine',
        fontType: 'shane'
    }, options);
    return new ic(item);
}
