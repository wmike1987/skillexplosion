import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    shaneOnly,
    ursulaOnly
} from '@games/Us/Items/SpecialtyValues.js';

var dodgeGain = 15;
var eventName = 'jadeRingTimesActive';

var manipulations = {
    dodgeAddition: 4,
    events: {
        dodgeAttack: {
            callback: function(event) {
                var dodgingUnit = event.performingUnit;
                var item = event.item;

                if (!item.applied) {
                    Matter.Events.trigger(globals.currentGame, eventName, event);
                    dodgingUnit.applyDodgeBuff({
                        duration: 3000,
                        amount: dodgeGain,
                        callback: function() {
                            item.applied = false;
                        }
                    });
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
        description: ["Add " + manipulations.dodgeAddition + " to dodge.", "Add " + dodgeGain + " dodge for 3 seconds after dodging attack (does not stack)."],
        icon: 'JadeRing',
        type: 'Medic',
        fontType: 'ursula',
        collector: {
            eventName: eventName,
            collectorFunction: function(event) {
                this.value += 1;
            },
            presentation: {
                labels: ["Times activated"],
                values: ["value"]
            }
        }
    }, options, ursulaOnly);
    return new ic(item);
}
