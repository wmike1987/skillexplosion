import ic from '@core/Unit/ItemConstructor.js';
import {globals} from '@core/Fundamental/GlobalState.js';
import * as Matter from 'matter-js';

var amount = 15;
var dodgeGain = 10;
var eventName = 'jadeLocketHEGain';

var manipulations = {
    dodgeAddition: 4,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                blockingUnit.giveHealth(amount, null, {showGainAnimation: true});
                blockingUnit.giveEnergy(amount, null, {showGainAnimation: true});

                event.healthGain = amount;
                event.energyGain = amount;
                Matter.Events.trigger(globals.currentGame, eventName, event);

                var item = event.item;

                if(!item.applied) {
                    blockingUnit.applyDodgeBuff({duration: 3000, amount: dodgeGain, callback: () => {
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
        name: "Jade Locket",
        description: ["Add 4 to dodge.", "Gain " + amount + " hp and energy after dodging killing blow.", "Gain " + dodgeGain + " dodge for 3 seconds after dodging killing blow (does not stack)."],
        icon: 'JadeLocket',
        collector: {
            eventName: eventName,
            init: function() {
                this.health = 0;
                this.energy = 0;
            },
            collectorFunction: function(event) {
                this.health += event.healthGain;
                this.energy += event.energyGain;
            },
            presentation: {
                labels: ["Health gained", "Energy gained"],
                values: ["health", "energy"]
            }
        }
    }, options);
    return new ic(item);
}
