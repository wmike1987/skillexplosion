import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Painkiller",
        description: "Consume to gain 0.5 armor.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'BlackSyringe',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.defense += 0.5;
        },
    }, options, Consumable);
    return new ic(item);
}
