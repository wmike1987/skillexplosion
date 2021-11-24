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
var enemyTent = function() {
    this.textureName = mathArrayUtils.getRandomElementOfArray(['CampDoodads/EnemyTent1', 'CampDoodads/EnemyTent2', 'CampDoodads/EnemyTent3']);
    this.radius = 30;
    this.collides = true;
    this.where = 'stage';
    this.tint = 0xffffff;
    this.randomHFlip = true;
    this.sortYOffset = 18;
    this.loneNZRadius = 80;
    this.shadowIcon = 'IsoShadowBlurred';
    this.shadowAlpha = 1.0;
    this.bodyScale = {x: 1.75, y: 0.6};
    this.shadowScale = {
        x: 2,
        y: 2
    };
    this.shadowOffset = {
        x: -20,
        y: 20
    };
    this.scale = {
        x: 1.0,
        y: 1.0
    };
    this.offset = {
        x: 0,
        y: 0
    };
    this.noShadow = true;
};

export default enemyTent;
