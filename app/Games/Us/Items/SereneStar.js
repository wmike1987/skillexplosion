import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import {
    shaneOnly,
    ursulaOnly
} from '@games/Us/Items/SpecialtyValues.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';

var eventName = 'sereneStarEnergyGain';
var energyGain = 2;

var manipulations = {
    maxEnergy: 5,
    energyRegenerationRate: 0.25,
    events: {
        knifeKill: {
            callback: function(event) {
                event.equippedUnit.giveEnergy(energyGain);
                unitUtils.applyEnergyGainAnimationToUnit(event.equippedUnit);
                event.energyGain = energyGain;
                Matter.Events.trigger(globals.currentGame, eventName, event);
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Serene Star",
        description: ["Add 5 to maximum energy.", "Regenerate +0.25 energy per second.", "Gain 2 energy after knife kill."],
        icon: 'SereneStar',
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
    }, options, shaneOnly);
    return new ic(item);
}
