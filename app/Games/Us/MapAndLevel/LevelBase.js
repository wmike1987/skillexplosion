import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

var levelBase = {
    resetLevel: function() {
        this.enemySets.forEach(set => {
            set.fulfilled = false;
        })
    },
    enemySets: [],
    onCreate: function(options) {
        this.tileTint = mathArrayUtils.getRandomElementOfArray(options.acceptableTileTints);
    }
}

export default levelBase;
