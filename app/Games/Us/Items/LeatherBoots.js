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

var eventName = 'leatherBootsEnergySaved';
var energyAmount = 1;

var manipulations = {
    genericEquip: function(equipped, item) {
        if(equipped) {
            this.getAbilityByName('Vanish').energyCost -= energyAmount;
        } else {
            this.getAbilityByName('Vanish').energyCost += energyAmount;
        }
    },
    events: {
        secretStepLand: {
            callback: function(event) {
                var unit = event.equippedUnit;
                unit.applySpeedBuff({amount: 0.5, duration: 2000});
                if(!event.isFreeStep) {
                    Matter.Events.trigger(globals.currentGame, eventName, event);
                }
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Leather Boots",
        description: ["Decrease Vanish cost by 1.", "Gain movement speed for 2 seconds after vanishing."],
        icon: 'SingleBoot3',
        type: 'Medic',
        fontType: 'ursula',
        collector: {
            eventName: eventName,
            collectorFunction: function(event) {
                this.value += energyAmount;
            },
            presentation: {
                labels: ["Energy saved"],
                values: ["value"]
            }
        }
    }, options, ursulaOnly);
    return new ic(item);
}
