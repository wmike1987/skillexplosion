import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {globals, keyStates} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

export default {
    grabPredicate: function() {
        if(keyStates.Control) {
            this._consume();
            return false;
        }
        return true;
    },
    _consume: function() {
        if(this.preventConsumption) {
            return;
        }

        var unit = globals.currentGame.unitSystem.unitPanel.prevailingUnit;
        this.consume(unit);
        Matter.Events.trigger(unit, 'consume', {item: this});
        globals.currentGame.itemSystem.removeItem(this);
    }
};
