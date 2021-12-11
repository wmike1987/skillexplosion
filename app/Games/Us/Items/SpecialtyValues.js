import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals, keyStates} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

var shaneOnly = {
    type: 'Marine',
    fontType: 'shane',
    borderTint: 0xdf3030,
    footprintTint: 0xff4040
};

var ursulaOnly = {
    type: 'Medic',
    fontType: 'ursula',
    borderTint: 0x33a200,
    footprintTint: 0x00E41D
};

export {shaneOnly, ursulaOnly};
