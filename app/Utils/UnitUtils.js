/*
/*
 * Module containing unit utilities
 */
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import hs from '@utils/HS.js';
import * as $ from 'jquery';
import * as h from 'howler';
import styles from '@utils/Styles.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import gleamShader from '@shaders/GleamShader.js';
import seedrandom from 'seedrandom';
import {
    gameUtils
} from '@utils/GameUtils.js';
import {
    graphicsUtils
} from '@utils/GraphicsUtils.js';
import {
    mathArrayUtils
} from '@utils/MathArrayUtils.js';

var unitUtils = {
    getPendingAnimation: function() {
        var pendingAnimation = gameUtils.getAnimation({
            spritesheetName: 'BaseUnitAnimations1',
            animationName: 'IsometricSelectedPending',
            speed: 0.35,
            loop: true,
        });
        pendingAnimation.isPendingAnimation = true;
        return pendingAnimation;
    },

    flashSelectionCircleOfUnit: function(unit) {
        unit.renderlings.selected.visible = true;
        graphicsUtils.flashSprite({
            sprite: unit.renderlings.selected,
            duration: 100,
            times: 3,
            onEnd: () => {
                if (!unit.isSelected) {
                    unit.renderlings.selected.visible = false;
                }
            }
        });
    },

    applyGainAnimationToUnit: function(unit, tint) {
        var a1 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'lifegain2',
            // speed: 0.65 + Math.random() * 0.40,
            speed: 0.75,
            transform: [unit.position.x, unit.position.y, 0.85, 0.85]
        });
        a1.play();
        a1.alpha = 1.0;
        a1.tint = tint;
        gameUtils.attachSomethingToBody({
            something: a1,
            body: unit.body,
            offset: {
                x: Math.random() * 15 - 7.5,
                y: -40
            }
        });
        graphicsUtils.addSomethingToRenderer(a1, 'foreground');

        return a1;
    },

    applyEnergyGainAnimationToUnit: function(unit) {
        var fun = function() {
            var tint = 0xff00c7;
            var anim = this.applyGainAnimationToUnit(unit, tint);
            graphicsUtils.flashSprite({
                sprite: anim,
                duration: 75,
                times: 3,
                fromColor: tint,
                toColor: 0xe461ff
            });
        }.bind(this);

        globals.currentGame.debounceFunction(fun.bind(this), 'energyGain');
    },

    applyHealthGainAnimationToUnit: function(unit) {
        var fun = function() {
            var tint = 0xff0000;
            var anim = this.applyGainAnimationToUnit(unit, tint);
            graphicsUtils.flashSprite({
                sprite: anim,
                duration: 75,
                times: 3,
                fromColor: tint,
                toColor: 0xf95e5e
            });
        }.bind(this);

        globals.currentGame.debounceFunction(fun.bind(this), 'healthGain');
    },

    showBlockGraphic: function(options) {
        var attackOptions = options.attackOptions;
        var attackingUnit = options.attackingUnit;
        var unit = options.unit;

        //add block graphic
        let offset = 40;
        let attackLocation = attackOptions.isProjectile ? attackOptions.projectileData.startLocation : attackingUnit.position;
        let offsetLocation = mathArrayUtils.addScalarToVectorTowardDestination(unit.position, attackLocation, offset);
        let attachmentOffset = Matter.Vector.sub(offsetLocation, unit.position);
        let block = graphicsUtils.addSomethingToRenderer('Block', {
            where: 'stageOne',
            position: offsetLocation,
            scale: {
                x: 1.0,
                y: 1.0
            }
        });
        gameUtils.attachSomethingToBody({
            something: block,
            body: unit.body,
            offset: attachmentOffset,
            deathPactSomething: true
        });
        block.rotation = mathArrayUtils.pointInDirection(unit.position, offsetLocation);
        graphicsUtils.flashSprite({
            sprite: block,
            toColor: options.tint,
            duration: 100,
            times: 4
        });
        graphicsUtils.fadeSpriteOverTimeLegacy(block, 500);
    },

    pauseIdlingAndResumeUponNewScene: function() {
        var game = globals.currentGame;
        game.unitsInPlay.forEach((unit) => {
            unit.idleCancel = true;
        });
        gameUtils.matterOnce(game.currentScene, 'sceneFadeOutBegin', function() {
            game.unitsInPlay.forEach((unit) => {
                unit.idleCancel = false;
            });
        });
    },

    pauseTargetingAndResumeUponNewLevel: function() {
        var game = globals.currentGame;
        game.unitsInPlay.forEach((unit) => {
            unit.isTargetable = false;
        });
        gameUtils.matterOnce(game, 'EnterLevel', function() {
            game.unitsInPlay.forEach((unit) => {
                unit.isTargetable = true;
            });
        });
    }
};

export {
    unitUtils
};
