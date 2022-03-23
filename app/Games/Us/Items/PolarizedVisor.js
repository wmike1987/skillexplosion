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

                if(unit.polarizedVisorHandler) {
                    unit.polarizedVisorHandler.removeHandler();
                }

                unit.polarizedVisorHandler = gameUtils.matterOnce(unit, 'kill', (event) => {
                    if(unit.enrageCounter > 0) {
                        unit.grantFreeKnife();
                    }
                });
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Ruby Visor",
        description: ["Gain a free knife (up to one) after delivering a killing blow while enraged."],
        icon: 'GoldenVisor'
    }, options, shaneOnly);
    return new ic(item);
}
