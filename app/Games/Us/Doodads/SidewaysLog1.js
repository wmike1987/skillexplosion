import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';

/*
 * options
 */
var enemyPost = {
    textureName: [null],
    radius: 8,
    collides: false,
    where: 'stageNOne',
    loneNZRadius: 40,
    tint: 0xffffff,
    randomHFlip: true,
    sortYOffset: 0,
    shadowIcon: 'IsoShadowBlurredRectangle',
    shadowAlpha: 1.0,
    shadowScale: {
        x: 1.2,
        y: 1.0
    },
    shadowOffset: {
        x: 2,
        y: 2
    },
    scale: {
        x: 1.2,
        y: 1.2
    },
    offset: {
        x: 0,
        y: 0
    },
    noShadow: false,
    initialize: function() {
        var possibleData = ['Log1', 'Log2', 'Log3'];
        if(possibleData == 'Log3') {
            this.shadowScale.x = 0.75;
        } else {
            this.shadowScale.x = 1.1;
        }
        this.textureName[0] = 'CampDoodads/' + mathArrayUtils.getRandomElementOfArray(possibleData);
    }
};

export default enemyPost;
