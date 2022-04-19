import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Potassium",
        description: "Consume to add 0.1 to health regeneration.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'VitaminBFour',
        fontType: 'stimulant',
        consume: function(unit) {
            unit.healthRegenerationRate += 0.1;
        },
    }, options, Consumable);
    return new ic(item);
}
