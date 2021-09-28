import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals, keyStates} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

var shaneOnly = {
    type: 'Marine',
    fontType: 'shane',
    borderTint: 0xdf3030
};

var ursulaOnly = {
    type: 'Medic',
    fontType: 'ursula',
    borderTint: 0x33a200
};

export {shaneOnly, ursulaOnly};
