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
    this.textureName = [null, null, null];
    this.radius = 12;
    this.where = 'stage';
    this.loneNZRadius = 50;
    this.tint = 0xffffff;
    this.randomHFlip = false;
    this.noShadow = true;
    this.sortYOffset = 0;
    this.scale = {
        x: 1.25,
        y: 1.45
    };
    // this.drawWire = true,
    this.bodyScale = {
        x: 1.3,
        y: 0.8
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
            y: -15
        };
        smokeAnimation.where = 'stageOne';
        smokeAnimation.play();
        this.textureName[1] = smokeAnimation;


        this.textureName[2] = {
            data: "CampDoodads/PitTint",
            name: "CampDoodads/PitTint",
            alpha: 0.75,
            tint: 0x494a4a,
            where: 'backgroundOne',
            scale: {
                x: 8,
                y: 8
            }
        };

        var grassName = mathArrayUtils.flipCoin() ? "CampDoodads/PitGrass1" : "CampDoodads/PitGrass2";
        this.textureName[3] = {
            data: grassName,
            name: grassName,
            alpha: 0.35,
            tint: 0xcccccc,
            where: 'backgroundOne',
            scale: {
                x: 1.1,
                y: 1.1
            }
        };
    };
};

export default rockPit;
