import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import chipBase from '@games/Us/Items/MicrochipBase.js';

var demeterBuff = 0.1;
export default function(options) {
    var item = Object.assign({}, chipBase, {
        name: "Demeter Chip",
        description: ["Enable a Rifle augment.", 'Add 0.1 energy to cleaning kit.'],
        poweredByMessage: {text: 'Demeter Microchip', style: 'basicPoweredByStyle'},
        conditionalPoweredByMessage: {text: '+0.1 energy per attack.', style: 'basicPoweredByStyle'},
        additionCondition: function(augment) {
            return augment.name == 'cleaning kit';
        },
        plugCondition: function(ability, augment) {
            return ability.name == 'Rifle';
        },
        plug: function() {
            this.owningUnit.cleaningKitAdditions.push(demeterBuff);
        },
        unplug: function() {
            mathArrayUtils.removeObjectFromArray(demeterBuff, this.owningUnit.cleaningKitAdditions);
        },
        plugTint: 0xeb27fc,
        systemMessage: "Drop on augment to enable.",
        icon: 'DemeterMicrochip',
    }, options);
    return new ic(item);
}
