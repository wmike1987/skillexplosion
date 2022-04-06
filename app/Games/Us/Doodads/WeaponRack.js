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
     rate: 1.1
 });

var waterTrough = function(options) {
    var possibleRacks = ['Gun_Racks', 'Gun_Racks-a', 'Gun_Racks-b', 'Gun_Racks-c', 'Gun_Racks-d'];
    var chosenRack = mathArrayUtils.getRandomElementOfArray(possibleRacks);
    var rackAnimation = gameUtils.getAnimation({
        spritesheetName: 'TerrainAnimations2',
        animationName: chosenRack,
        persists: true,
        where: 'stageNOne',
        speed: 0.5,
        loop: false,
        transform: [0, 0, 1.0, 1.0],
    });
    rackAnimation.name = 'animatedSprite';
    rackAnimation.tint = options.tint;
    this.textureName = rackAnimation;
    this.radius = 12;
    this.loneNZRadius = 100;
    this.isSensor = true;
    // this.drawWire = true;
    this.randomHFlip = true;
    this.animateOnCollision = true;
    this._onCollision = function(options) {
        var body = options.body;
        graphicsUtils.fadeSpriteOutQuickly(body.renderlings.shadow, 500);
    };
    this.collisionSound = collideSound;
    this.noShadow = false;
    this.sortYOffset = 0;
    this.shadowScale = {
        x: 0.8,
        y: 0.8
    };
    this.shadowOffset = {
        x: 0,
        y: 14
    };
    this.scale = {
        x: 0.8,
        y: 0.8
    };
    // this.drawWire = true,
    this.bodyScale = {
        x: 1,
        y: 1
    };
    this.offset = {
        x: 0,
        y: 0
    };
};

export default waterTrough;
