import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function(options) {
    var item = Object.assign({
        name: "Awareness Tonic",
        description: "Consume to gain 3 dodge and increase max hp by 3.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'GreenSyringe',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.dodge += 3;
            currentUnit.maxHealth += 3;
        },
    }, options, Consumable);
    return new ic(item);
}
