import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Vitamin",
        description: "Consume to add 0.2 to armor.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'PepPillTwo',
        fontType: 'stimulant',
        consume: function(unit) {
            unit.defense += 0.2;
        },
    }, options, Consumable);
    return new ic(item);
}
