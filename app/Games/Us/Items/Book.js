import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Book",
        description: ['Learn a random state of mind.'],
        fontType: 'book',
        systemMessage: "Crtl+Click to read.",
        icon: 'BlueBook',
        consume: function(unit) {
            if(unit.availablePassives.length < 6) {
                unit.acquireRandomPassive();
                globals.currentGame.unitSystem.unitPanel.showPassivesForUnit(unit);
            }
        },
    }, options, Consumable);
    return new ic(item);
}
