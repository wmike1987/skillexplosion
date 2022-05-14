import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Iron",
        description: "Consume to add 0.1 to armor.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'VitaminOne',
        fontType: 'stimulant',
        consume: function(unit) {
            unit.defense += 0.1;
        },
    }, options, Consumable);
    return new ic(item);
}
