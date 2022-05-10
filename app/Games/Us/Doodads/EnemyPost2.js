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
var enemyPost = function(options) {
    options = options || {};

    var possibleTextures = ['Pike1', 'Pike2', 'Pike3', 'Pike4', 'Pike5', 'Pike6', 'Pike7', 'Pike8', 'Pike9', 'Pike10'];
    possibleTextures = possibleTextures.map((name) => {
        return 'CampDoodads/' + name;
    });

    if(options.preventDuplicateDoodad) {
        var preventativeDoodadArray = mathArrayUtils.convertToArray(options.preventDuplicateDoodad);
        preventativeDoodadArray.forEach((doodad) => {
            doodad.rebuildOptions.texture.forEach((textName) => {
                mathArrayUtils.removeObjectFromArray(textName, possibleTextures);
            });
        });
    }

    this.textureName = mathArrayUtils.getRandomElementOfArray(possibleTextures);

    this.radius = 8;
    this.collides = false;
    this.where = 'stage';
    this.loneNZRadius = 5;
    // this.noShadow = true;
    this.tint = 0xffffff;
    this.randomHFlip = true;
    // this.sortYOffset = 28;
    this.shadowAlpha = 0.75;
    this.anchor = {x: 0.5, y: 1.0};
    this.shadowScale = {
        x: 0.35,
        y: 0.35
    };
    this.shadowOffset = {
        x: 0,
        y: 5
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
