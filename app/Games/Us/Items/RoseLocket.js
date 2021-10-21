import ic from '@core/Unit/ItemConstructor.js';
import {globals} from '@core/Fundamental/GlobalState.js';
import * as Matter from 'matter-js';

var amount = 20;
var eventName = 'roseLocketHealthGain';

var manipulations = {
    defenseAddition: 1.0,
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
        name: "Rose Locket",
        description: ["Add 1.0 to armor.", "Gain " + amount + " hp after dodging killing blow."],
        icon: 'GoldenLocket',
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
