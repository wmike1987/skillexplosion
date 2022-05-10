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

 var collideSound = gameUtils.getSound('woodburst.wav', {
     volume: 0.02,
     rate: 0.8
 });

var waterTrough = function(options) {
    var possibleTroughs = ['trough_1', 'trough_2', 'trough_3', 'trough_4', 'trough_5'];
    var chosenTrough = mathArrayUtils.getRandomElementOfArray(possibleTroughs);
    var troughAnimation = gameUtils.getAnimation({
        spritesheetName: 'TerrainAnimations2',
        animationName: chosenTrough,
        persists: true,
        where: 'stageNOne',
        speed: 0.5,
        loop: false,
        transform: [0, 0, 1.0, 1.0],
    });
    troughAnimation.name = 'animatedSprite';
    troughAnimation.tint = options.tint;
    this.textureName = troughAnimation;
    this.radius = 12;
    this.loneNZRadius = 30;
    this.isSensor = true;
    // this.drawWire = true;
    this.randomHFlip = true;
    this.animateOnCollision = true;
    this.collisionSound = collideSound;
    this.noShadow = true;
    this.sortYOffset = 0;
    this.shadowScale = {
        x: 0.8,
        y: 0.8
    };
    this.shadowOffset = {
        x: -5,
        y: 10
    };
    this.scale = {
        x: 1.0,
        y: 1.0
    };
    // this.drawWire = true,
    this.bodyScale = {
        x: 1,
        y: 1
    };
    this.offset = {
        x: 35,
        y: 0
    };
};

export default waterTrough;
