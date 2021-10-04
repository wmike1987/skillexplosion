import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Pep Pill",
        description: "Consume to add 2 to max energy.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'RichPepPill',
        fontType: 'stimulant',
        consume: function(unit) {
            unit.maxEnergy += 2;
        },
    }, options, Consumable);
    return new ic(item);
}
