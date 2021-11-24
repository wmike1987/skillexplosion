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
var rockPit = function() {
    this.textureName = [null, null];
    this.radius = 8;
    this.where = 'stage';
    this.loneNZRadius = 40;
    this.tint = 0xffffff;
    this.randomHFlip = false;
    this.noShadow = true;
    this.sortYOffset = 0;
    this.scale = {
        x: 1.25,
        y: 1.25
    };
    this.offset = {
        x: 0,
        y: 0
    };
    this.initialize = function() {
        var possiblePits = ['RockFirePit', 'RockFirePit2', 'RockFirePit3'];
        this.textureName[0] = mathArrayUtils.getRandomElementOfArray(possiblePits);

        var smokeAnimation = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'smokepitsmoke',
            speed: 0.5,
            loop: true,
            transform: [0, 0, 2.0, 3.0],
        });
        smokeAnimation.alpha = 0.5;
        smokeAnimation.offset = {
            x: 0,
            y: -3
        };
        smokeAnimation.where = 'stageOne';
        smokeAnimation.play();
        this.textureName[1] = smokeAnimation;
    };
};

export default rockPit;
