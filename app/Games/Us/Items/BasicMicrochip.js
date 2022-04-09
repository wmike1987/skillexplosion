import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import chipBase from '@games/Us/Items/MicrochipBase.js';

export default function(options) {
    var item = Object.assign({}, chipBase, {
        name: "Gen-1 Microchip",
        creationName: "BasicMicrochip",
        description: "Enable an augment.",
        poweredByMessage: {text: 'Gen-1 Microchip', style: 'basicPoweredByStyle'},
        systemMessage: "Drop on agument to enable.",
        icon: 'BasicMicrochip',
        fontType: 'microchip',

        plugCondition: function() {
            return true;
        },
    }, options);
    return new ic(item);
}
