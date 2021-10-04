import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Sugar Pill",
        description: "Consume to add 2 to max health.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'SugarPill',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.maxHealth += 2;
        },
    }, options, Consumable);
    return new ic(item);
}
