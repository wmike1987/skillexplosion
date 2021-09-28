import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function(options) {
    var item = Object.assign({
        name: "Slippery Soup",
        description: "Consume to gain 4 dodge.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'NeonGreenSyringe',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.dodge += 4;
        },
    }, options, Consumable);
    return new ic(item);
}
