import ic from '@core/Unit/ItemConstructor.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import * as Matter from 'matter-js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    events: {
        applyEnrageBuff: {
            callback: function(event) {
                var unit = event.equippedUnit;
                var item = event.item;

                if(unit.violetVisorHandler) {
                    unit.violetVisorHandler.removeHandler();
                }

                unit.violetVisorHandler = gameUtils.matterOnce(unit, 'dealNonLethalDamage', (event) => {
                    var target = event.sufferingUnit;
                    target.condemn({duration: 3000, condemningUnit: globals.currentGame.ursula});
                });
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Blue Visor",
        description: ["Condemn first target after becoming enraged on behalf of Ursula."],
        icon: 'BlueVisor'
    }, options, shaneOnly);
    return new ic(item);
}
