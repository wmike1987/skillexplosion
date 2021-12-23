import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';

var amount = 8;
var eventName = 'sharpPictureOfTheMoonEnergyGain';

var manipulations = {
    events: {
        dodgeAttack: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveEnergy(amount, null, {showGainAnimation: true});

                event.energyGain = amount;
                Matter.Events.trigger(globals.currentGame, eventName, event);
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Sharp Picture Of The Moon",
        description: ["Gain " + amount + " energy after dodging an attack."],
        icon: 'SharpPictureOfTheMoon',
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
