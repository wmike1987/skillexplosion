import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Chemical Concentrate",
        description: "Consume to increase max health and max energy by 3.",
        systemMessage: "Ctrl+Click to consume.",
        icon: 'BlueSyringe',
        fontType: 'stimulant',
        consume: function(currentUnit) {
            currentUnit.maxEnergy += 3;
            currentUnit.maxHealth += 3;
        },
    }, options, Consumable);
    return new ic(item);
}
