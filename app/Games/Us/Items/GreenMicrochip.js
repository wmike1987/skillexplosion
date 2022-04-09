import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import chipBase from '@games/Us/Items/MicrochipBase.js';

export default function(options) {
    var item = Object.assign({}, chipBase, {
        name: "Green Microchip",
        description: ["Enable a Dash augment or Vanish augment.", 'Decrease energy cost by 1.'],
        poweredByMessage: {text: 'Green Microchip', style: 'basicPoweredByStyle'},
        conditionalPoweredByMessage: {text: '-1 to energy cost.', style: 'basicPoweredByStyle'},
        additionCondition: function(augment) {
            return true;
        },
        plugCondition: function(ability, augment) {
            return ability.name == 'Dash' || ability.name == 'Vanish';
        },
        plug: function(ability) {
            ability.energyCost -= 1;
        },
        unplug: function(ability) {
            ability.energyCost += 1;
        },
        plugTint: 0x22ec5b,
        systemMessage: "Drop on augment to enable.",
        icon: 'GreenMicrochip',
    }, options);
    return new ic(item);
}
