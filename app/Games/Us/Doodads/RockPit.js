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
var rockPit = {
    textureName: ['RockFirePit', null],
    radius: 8,
    where: 'stage',
    tint: 0xffffff,
    randomHFlip: true,
    sortYOffset: 0,
    scale: {
        x: 1.25,
        y: 1.25
    },
    offset: {
        x: 0,
        y: 0
    },
    initialize: function() {
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
            y: -1
        };
        smokeAnimation.where = 'stage';
        smokeAnimation.play();
        this.textureName[1] = smokeAnimation;
    }
};

export default rockPit;
