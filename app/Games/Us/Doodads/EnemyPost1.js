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
    where: 'stage',
    loneNZRadius: 40,
    tint: 0xffffff,
    randomHFlip: true,
    sortYOffset: 0,
    shadowScale: {
        x: 0.5,
        y: 0.5
    },
    shadowOffset: {
        x: 0,
        y: 30
    },
    scale: {
        x: 1.0,
        y: 1.0
    },
    offset: {
        x: 0,
        y: 0
    },
    initialize: function() {
        var possibleData = ['EnemyPost1', 'EnemyPost2'];
        this.textureName[0] = 'CampDoodads/' + mathArrayUtils.getRandomElementOfArray(possibleData);
    }
};

export default enemyPost;
