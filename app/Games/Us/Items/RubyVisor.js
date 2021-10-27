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

var armorGainDuration = 6000;
var armorGain = 2;
var chargeLength = 2000;

var manipulations = {
    events: {
        applyEnrageBuff: {
            callback: function(event) {
                var unit = event.equippedUnit;
                var item = event.item;

                if(unit.rubyVisorHandler) {
                    unit.rubyVisorHandler.removeHandler();
                }

                unit.rubyVisorHandler = gameUtils.matterOnce(unit, 'dealNonLethalDamage', (event) => {
                    var target = event.sufferingUnit;
                    target.condemn({duration: 3000, condemningUnit: unit});
                });
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Ruby Visor",
        description: ["Condemn first target after becoming enraged."],
        icon: 'RubyVisor'
    }, options, shaneOnly);
    return new ic(item);
}
