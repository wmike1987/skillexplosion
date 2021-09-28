import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function(options) {
    var item = Object.assign({
        name: "Life Extract",
        description: "Consume to increase max hp by 6.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'RedSyringe',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.maxHealth += 6;
        },
    }, options, Consumable);
    return new ic(item);
}
