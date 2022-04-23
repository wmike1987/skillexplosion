import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Platelet Shot",
        description: "Consume to add 0.2 to health regeneration rate.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'RedSyringe2',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.healthRegenerationRate += 0.2;
        },
    }, options, Consumable);
    return new ic(item);
}
