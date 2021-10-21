import ic from '@core/Unit/ItemConstructor.js';
import {globals} from '@core/Fundamental/GlobalState.js';
import * as Matter from 'matter-js';

var amount = 30;
var eventName = 'diamondLocketEnergyGain';

var manipulations = {
    defenseAddition: 1.0,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveEnergy(amount, null, {showGainAnimation: true});
                blockingUnit.applySpeedBuff({duration: 2000, amount: 0.6});

                event.energyGain = amount;
                Matter.Events.trigger(globals.currentGame, eventName, event);
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Diamond Locket",
        description: ["Add 1.0 to armor.", "Gain " + amount + " energy after dodging killing blow.", "Increase move speed for 2 second after dodging killing blow"],
        icon: 'DiamondLocket',
        collector: {
            eventName: eventName,
            collectorFunction: function(event) {
                this.value += event.energyGain;
            },
            presentation: {
                labels: ["Energy gained"],
                values: ["value"]
            }
        }
    }, options);
    return new ic(item);
}
