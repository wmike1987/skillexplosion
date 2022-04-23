import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import chipBase from '@games/Us/Items/MicrochipBase.js';

var durationBuff = 6000;
export default function(options) {
    var item = Object.assign({}, chipBase, {
        name: "Toxic Microchip",
        description: ["Enable a Mine augment.", 'Increase Scorch area duration by 6 seconds.'],
        poweredByMessage: {
            text: 'Toxic Microchip',
            style: 'basicPoweredByStyle'
        },
        conditionalPoweredByMessage: {
            text: '+6 seconds to scorched area duration.',
            style: 'basicPoweredByStyle'
        },
        additionCondition: function(augment) {
            return augment.name == 'scorch';
        },
        plugCondition: function(ability, augment) {
            return ability.name == 'Mine';
        },
        plug: function() {
            this.owningUnit.scorchDurationAdditions.push(durationBuff);
        },
        unplug: function() {
            mathArrayUtils.removeObjectFromArray(durationBuff, this.owningUnit.scorchDurationAdditions);
        },
        plugTint: 0x8a0da3,
        systemMessage: "Drop on augment to enable.",
        icon: 'ToxicMicrochip',
    }, options);
    return new ic(item);
}
