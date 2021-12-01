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
var enemyPost = function() {
    this.textureName = 'CampDoodads/' + mathArrayUtils.getRandomElementOfArray(['EnemyPost1', 'EnemyPost2', 'EnemyPost3', 'EnemyPost4', 'EnemyPost5', 'EnemyPost6', 'EnemyPost7', 'EnemyPost8']);
    this.radius = 8;
    this.collides = false;
    this.where = 'stage';
    this.loneNZRadius = 40;
    this.tint = 0xffffff;
    this.randomHFlip = true;
    this.sortYOffset = 28;
    this.shadowAlpha = 0.75;
    this.shadowScale = {
        x: 0.5,
        y: 0.5
    };
    this.shadowOffset = {
        x: 0,
        y: 30
    };
    this.scale = {
        x: 1.0,
        y: 1.0
    };
    this.offset = {
        x: 0,
        y: 0
    };
};

export default enemyPost;
