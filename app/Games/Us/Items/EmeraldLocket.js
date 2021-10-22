import ic from '@core/Unit/ItemConstructor.js';
import {globals} from '@core/Fundamental/GlobalState.js';
import * as Matter from 'matter-js';

var eventName = 'emeraldLocketTimeActive';

var manipulations = {
    dodgeAddition: 4,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                var attackingUnit = event.attackingUnit;

                attackingUnit.petrify({duration: 3000, petrifyingUnit: blockingUnit});
                Matter.Events.trigger(globals.currentGame, eventName, event);
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Emerald Locket",
        description: ["Upon dodging killing blow, petrify attacker for 3 seconds."],
        icon: 'EmeraldLocket',
        collector: {
            eventName: eventName,
            init: function() {
                this.health = 0;
                this.energy = 0;
            },
            collectorFunction: function(event) {
                this.value += 1;
            },
            presentation: {
                labels: ["Times activated"],
                values: ["value"]
            }
        }
    }, options);
    return new ic(item);
}
