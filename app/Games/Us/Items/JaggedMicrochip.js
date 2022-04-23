import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import chipBase from '@games/Us/Items/MicrochipBase.js';

var amount = 2;

export default function(options) {
    var item = Object.assign({}, chipBase, {
        name: "Jagged Microchip",
        description: ["Enable a Knife augment.", 'Add ' + amount + ' to knife damage.'],
        poweredByMessage: {text: 'Jagged Microchip', style: 'basicPoweredByStyle'},
        conditionalPoweredByMessage: {text: '+ ' + amount + ' damage.', style: 'basicPoweredByStyle'},
        additionCondition: function(augment) {
            return true;
        },
        plugCondition: function(ability, augment) {
            return ability.name == 'Throw Knife';
        },
        plug: function() {
            this.owningUnit.knifeDamage += amount;
        },
        unplug: function() {
            this.owningUnit.knifeDamage -= amount;
        },
        plugTint: 0xfb5c43,
        systemMessage: "Drop on augment to enable.",
        icon: 'JaggedMicrochip',
    }, options);
    return new ic(item);
}
