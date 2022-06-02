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
var log = function() {
    this.textureName = [null];
    this.radius = 8;
    this.collides = false;
    this.where = 'stageNOne';
    this.loneNZRadius = 30;
    this.tint = 0xffffff;
    this.randomHFlip = true;
    this.sortYOffset = 0;
    this.shadowIcon = 'IsoShadowBlurredRectangle';
    this.shadowAlpha = 1.0;
    this.shadowScale = {
        x: 1.0,
        y: 1.0
    };
    this.shadowOffset = {
        x: 2,
        y: 2
    };
    this.scale = {
        x: 1.2,
        y: 1.0
    };
    this.offset = {
        x: 0,
        y: 0
    };
    this.noShadow = false;
    this.initialize = function() {
        var possibleData = ['Log1', 'Log2', 'Log3'];
        if(possibleData == 'Log3') {
            this.shadowScale.x = 0.75;
        } else {
            this.shadowScale.x = 1.1;
        }
        this.textureName[0] = 'CampDoodads/' + mathArrayUtils.getRandomElementOfArray(possibleData);
    };
};

export default log;
