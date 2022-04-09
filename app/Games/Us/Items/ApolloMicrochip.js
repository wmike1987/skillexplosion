import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import chipBase from '@games/Us/Items/MicrochipBase.js';

var apolloBuff = 0.2;
export default function(options) {
    var item = Object.assign({}, chipBase, {
        name: "Apollo Microchip",
        description: ["Enable a Rifle augment.", 'Add 0.2 hp to first aid pouch.'],
        poweredByMessage: {text: 'Apollo Microchip', style: 'basicPoweredByStyle'},
        conditionalPoweredByMessage: {text: '+0.2 hp per attack.', style: 'basicPoweredByStyle'},
        additionCondition: function(augment) {
            return augment.name == 'first aid pouch';
        },
        plugCondition: function(ability, augment) {
            return ability.name == 'Rifle';
        },
        plug: function() {
            this.owningUnit.firstAidPouchAdditions.push(apolloBuff);
        },
        unplug: function() {
            mathArrayUtils.removeObjectFromArray(apolloBuff, this.owningUnit.firstAidPouchAdditions);
        },
        plugTint: 0xffab08,
        systemMessage: "Drop on augment to enable.",
        icon: 'AriesMicrochip',
    }, options);
    return new ic(item);
}
