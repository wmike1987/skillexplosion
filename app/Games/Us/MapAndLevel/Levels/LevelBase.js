import * as $ from 'jquery'
import * as Matter from 'matter-js'
import {globals} from '@core/Fundamental/GlobalState.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

var levelBase = {
    resetLevel: function() {
        this.enemySets.forEach(set => {
            set.fulfilled = false;
        })
    },
    enterLevel: function(node) {
        Matter.Events.trigger(globals.currentGame, 'InitLevel', {node: node});
    },
    getEntrySound: function() {
        return this.entrySound;
    },
    enemySets: [],
    onCreate: function(options) {
        this.tileTint = mathArrayUtils.getRandomElementOfArray(options.acceptableTileTints);
        this.entrySound = options.entrySound;
    }
}

export default levelBase;
