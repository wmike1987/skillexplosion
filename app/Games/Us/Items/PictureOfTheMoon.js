import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    StatCollector
} from '@games/Us/StatCollector.js';

var amount = 4;
var eventName = 'PictureOfTheMoonEnergyGain';

var manipulations = {
    events: {
        dodgeAttack: {
            callback: function(event) {
                var equippedUnit = event.equippedUnit;
                var item = event.item;
                equippedUnit.giveEnergy(amount, null, {showGainAnimation: true});

                event.energyGain = amount;
                Matter.Events.trigger(globals.currentGame, eventName, event);
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Picture Of The Moon",
        description: ["Gain " + amount + " energy after dodging an attack."],
        icon: 'PictureOfTheMoon',
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
