import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function(options) {
    var item = Object.assign({
        name: "Coarse Brine",
        description: "Consume to gain 6 grit.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'BlueYellowSyringe',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.grit += 6;
        },
    }, options, Consumable);
    return new ic(item);
}
