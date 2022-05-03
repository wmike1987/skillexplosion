import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import Consumable from '@games/Us/Items/Consumable.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default function(options) {
    var item = Object.assign({
        name: "Book",
        description: ['Learn a State of Mind.'],
        fontType: 'book',
        systemMessage: "Crtl+Click to read.",
        icon: 'BlueBook',
        consumptionPredicate: function() {
            return globals.currentGame.currentLevel.isLevelConfigurable();
        },
        consume: function(unit) {
            if(unit.availablePassives.length < 6) {
                let passive = unit.acquireRandomPassive();
                Matter.Events.trigger(globals.currentGame.unitSystem, 'stateOfMindLearned', {unit: unit, passive: passive});
                globals.currentGame.unitSystem.unitPanel.showPassivesForUnit(unit);
            }
        },
    }, options, Consumable);
    return new ic(item);
}
