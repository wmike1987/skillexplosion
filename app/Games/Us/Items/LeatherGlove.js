import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    knifeDamage: 5,
    knifeSpeed: 10
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Leather Glove",
        description: ["Add +5 to knife damage.", "Increase knife throwing speed."],
        icon: 'ThrowingGlove',
    }, options, shaneOnly);
    return new ic(item);
}
