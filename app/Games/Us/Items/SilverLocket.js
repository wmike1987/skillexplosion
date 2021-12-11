import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';

var amount = 10;
var eventName = 'silverLocketEnergyGain';

var manipulations = {
    defenseAddition: 0.4,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveHealth(amount, null, {showGainAnimation: true});

                event.healthGain = amount;
                Matter.Events.trigger(globals.currentGame, eventName, event);
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Silver Locket",
        description: ["Add 0.4 to armor.", "Gain " + amount + " hp after dodging killing blow."],
        icon: 'Locket',
        collector: {
            eventName: eventName,
            collectorFunction: function(event) {
                this.value += event.healthGain;
            },
            presentation: {
                labels: ["Health gained"],
                values: ["value"]
            }
        }
    }, options);
    return new ic(item);
}
