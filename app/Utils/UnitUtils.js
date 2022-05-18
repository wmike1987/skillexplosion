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
            speed: 0.45,
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

        globals.currentGame.debounceFunction(fun.bind(this), 'energyGain' + unit.unitId);
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

        globals.currentGame.debounceFunction(fun.bind(this), 'healthGain' + unit.unitId);
    },

    showBlockGraphic: function(options) {
        var attackContext = options.attackContext || {};
        var attackingUnit = options.attackingUnit;
        var unit = options.unit;

        //add block graphic
        let offset = 40;

        //resolve attack location
        let attackLocation = attackContext.isProjectile ? attackContext.projectileData.startLocation : attackingUnit.position;
        if (attackContext.source) {
            attackLocation = attackContext.source;
        }

        let offsetLocation = mathArrayUtils.addScalarToVectorTowardDestination(unit.position, attackLocation, offset);
        let attachmentOffset = Matter.Vector.sub(offsetLocation, unit.position);
        let block = graphicsUtils.addSomethingToRenderer('Block', {
            where: 'stageOne',
            position: offsetLocation,
            scale: options.scale || {
                x: 0.75,
                y: 0.75
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

    prepareUnitsForStationaryDraw: function() {
        var game = globals.currentGame;
        game.unitsInPlay.forEach((unit) => {
            unit.idleCancel = true;
            unit.noAvoid = true;
            unit.commandQueue.clear();
        });
        gameUtils.matterOnce(game.currentScene, 'sceneFadeOutBegin', function() {
            game.unitsInPlay.forEach((unit) => {
                unit.idleCancel = false;
                unit.noAvoid = false;
            });
        });
    },

    pauseTargetingAndResumeUponNewLevel: function() {
        var game = globals.currentGame;
        game.unitsInPlay.forEach((unit) => {
            unit.isTargetable = false;
        });
        gameUtils.matterOnce(game, 'onLevelPlayable', function() {
            game.unitsInPlay.forEach((unit) => {
                unit.isTargetable = true;
            });
        });
    },

    showExpandingCircleAnimation: function(options) {
        options = options || {};
        var unit = options.unit;
        var speed = options.speed || 0.4;
        var tint = options.tint || 0xffffff;
        var play = options.play;

        let anim = gameUtils.getAnimation({
            spritesheetName: 'BaseUnitAnimations1',
            animationName: 'PassiveReady',
            speed: speed,
        });
        anim.tint = tint;
        anim.scale = {
            x: 0.4,
            y: 0.5
        };
        gameUtils.moveSpriteOffScreen(anim);
        graphicsUtils.addSomethingToRenderer(anim, 'stageNOne');
        gameUtils.attachSomethingToBody({
            something: anim,
            body: unit.body,
            offset: unit.body.renderlings.selected.offset,
            deathPactSomething: true
        });

        if (play) {
            anim.play();
        }

        return anim;
    },

    createUnitRanOffStageListener: function(unit, callback) {
        var myTicker = globals.currentGame.addTickCallback(function() {
            if (gameUtils.bodyRanOffStage(unit.body)) {
                callback();
                globals.currentGame.removeTickCallback(myTicker);
            }
        });

        gameUtils.deathPact(unit, myTicker);
    },

    getItemsInPlayByTeam: function(options) {
        options = options || {};
        var items = [];
        unitUtils.applyToUnitsByTeam(function(team) {
            return options.team == team;
        }.bind(this), null, function(unit) {
            items = items.concat(unit.getAllItems({namesOnly: options.namesOnly}));
            if(options.includeMicrochips) {
                items.push(...unit.getAllPluggedMicrochipNames());
            }
        }.bind(this));


        return items;
    },

    addRandomAugmentToAbility: function(options) {
        options = Object.assign({random: true}, options);

        if(!options.unit) {
            return;
        }

        let filteredAbilities = options.unit.abilities.filter((ability) => {
            return !ability.allAugmentsAvailable();
        });

        let chosenAbility = mathArrayUtils.getRandomElementOfArray(filteredAbilities);
        return chosenAbility.addAvailableAugment();
    },

    getRandomAugments: function(options) {
        options = gameUtils.mixinDefaults({params: options, defaults: {
            number: 3
        }});

        let returnAugments = [];

        let filteredAbilities = options.unit.abilities.filter((ability) => {
            return !ability.allAugmentsAvailable();
        });

        let pendingAugments = [];
        filteredAbilities.forEach((ability) => {
            pendingAugments.push(...ability.getPendingAugments());
        });

        mathArrayUtils.repeatXTimes(() => {
            let randomAugment = mathArrayUtils.getRandomElementOfArray(pendingAugments);
            mathArrayUtils.removeObjectFromArray(randomAugment, pendingAugments);
            returnAugments.push(randomAugment);
        }, options.number);

        return returnAugments.filter((el) => {
            return el != null;
        });
    },

    getUnitAllies: function(meUnit, includeMe) {
        var allies = [];
        this.applyToUnitsByTeam(function(team) {
            return meUnit.team == team;
        }, function(unit) {
            return includeMe || meUnit != unit;
        }, function(unit) {
            allies.push(unit);
        });

        return allies;
    },

    getUnitEnemies: function(meUnit) {
        var enemies = [];
        this.applyToUnitsByTeam(function(team) {
            return meUnit.team != team;
        }, null, function(unit) {
            enemies.push(unit);
        });

        return enemies;
    },

    //apply something to bodies by team
    applyToUnitsByTeam: function(teamPredicate, unitPredicate, f) {
        teamPredicate = teamPredicate || function(team) {
            return true;
        };
        unitPredicate = unitPredicate || function(unit) {
            return true;
        };

        mathArrayUtils.operateOnObjectByKey(globals.currentGame.unitsByTeam, (key, teamGroup, i) => {
            if (teamPredicate(key)) {
                mathArrayUtils.operateOnObjectByKey(teamGroup, (teamKey, unit) => {
                    if (unitPredicate(unit)) {
                        f(unit);
                    }
                });
            }
        });
    },

    moveUnitOffScreen: function(unit) {
        unit.body.oneFrameOverrideInterpolation = true;
        unit.position = {
            x: 8000,
            y: 8000
        };
        if (unit.selectionBody)
            Matter.Body.setPosition(unit.selectionBody, unit.position);
        if (unit.smallerBody)
            Matter.Body.setPosition(unit.smallerBody, unit.position);
    },
};

export {
    unitUtils
};
