import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Steroid",
        description: "Consume to add 2 to grit.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'AlternatePillOne',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.grit += 2;
        },
    }, options, Consumable);
    return new ic(item);
}
