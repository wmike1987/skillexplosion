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
var enemyTent = {
    textureName: 'CampDoodads/EnemyTent1',
    radius: 30,
    collides: true,
    where: 'stage',
    loneNZRadius: 80,
    tint: 0xffffff,
    randomHFlip: true,
    sortYOffset: 0,
    shadowIcon: 'IsoShadowBlurred',
    shadowAlpha: 1.0,
    bodyScale: {x: 1.75, y: 0.6},
    shadowScale: {
        x: 2,
        y: 2
    },
    shadowOffset: {
        x: -20,
        y: 20
    },
    scale: {
        x: 1.0,
        y: 1.0
    },
    offset: {
        x: 0,
        y: 0
    },
    noShadow: true,
    initialize: function() {

    }
};

export default enemyTent;
