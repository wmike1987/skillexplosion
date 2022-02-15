import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    knifeDamage: 3,
    knifeSpeed: 12
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Leather Glove",
        description: ["Add 3 to knife damage.", "Increase knife speed."],
        icon: 'ThrowingGlove',
    }, options, shaneOnly);
    return new ic(item);
}
