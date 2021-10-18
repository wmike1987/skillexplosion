import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    dodgeAddition: 5,
    events: {
        dodgeAttack: {
            callback: function(event) {
                var dodgingUnit = event.performingUnit;
                var item = event.item;

                if(!item.applied) {
                    dodgingUnit.applyDodgeBuff({duration: 3000, amount: 15, callback: function() {
                        item.applied = false;
                    }});
                    item.applied = true;
                }
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Jade Ring",
        description: ["Add " + manipulations.dodgeAddition + " to dodge.", "Add 15 dodge for 3 seconds after dodging attack (does not stack)."],
        icon: 'JadeRing',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
