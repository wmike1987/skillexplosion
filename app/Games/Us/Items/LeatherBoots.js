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
var energySavedAmount = 2;
var speedDuration = 2;
var dodgeAdd = 5;

var manipulations = {
    genericEquip: function(equipped, item) {
        if (equipped) {
            this.getAbilityByName('Vanish').energyCost -= energySavedAmount;
        } else {
            this.getAbilityByName('Vanish').energyCost += energySavedAmount;
        }
    },
    events: {
        secretStepLand: {
            callback: function(event) {
                var unit = event.equippedUnit;
                unit.applySpeedBuff({
                    amount: 0.5,
                    duration: speedDuration * 1000
                });
                if (!event.isFreeStep) {
                    Matter.Events.trigger(globals.currentGame, eventName, event);
                }
            }
        }
    },
    dodgeAddition: dodgeAdd
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Leather Boots",
        description: ["Decrease Vanish cost by " + energySavedAmount + ".", "Gain movement speed for " + speedDuration + " seconds after vanishing.", "Add " + dodgeAdd +  " to dodge."],
        icon: 'SingleBoot3Blue',
        type: 'Medic',
        fontType: 'ursula',
        collector: {
            eventName: eventName,
            collectorFunction: function(event) {
                this.value += energySavedAmount;
            },
            presentation: {
                labels: ["Energy saved"],
                values: ["value"]
            }
        }
    }, options, ursulaOnly);
    return new ic(item);
}
