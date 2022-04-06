import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import styles from '@utils/Styles.js';

export default {
    revivableInit: function() {
        this.reviveSound = gameUtils.getSound('fullheal.wav', {
            volume: 0.05,
            rate: 0.5
        });
        gameUtils.deathPact(this, this.reviveSound);

        this.reviveTime = this.reviveTime || 6000;
        var reviveTickTime = 100;
        var originalDeath = this.death;
        var revivableDeath = function() {
            this.reviveAmount = 0;
            this.grave = graphicsUtils.addSomethingToRenderer(this.graveSpriteName, {
                where: 'stage',
                position: mathArrayUtils.clonePosition(this.position, {
                    y: 20
                }),
                anchor: {
                    x: 0.5,
                    y: 0.5
                },
                scale: {
                    x: 0.85,
                    y: 0.85
                }
            });
            //fade in
            graphicsUtils.fadeSpriteOverTimeLegacy(this.grave, 2000, true);

            this.reviveCenter = mathArrayUtils.clonePosition(this.position);
            this.grave.tint = graphicsUtils.percentAsHexColor(0, {
                start: {
                    r: 255,
                    g: 255,
                    b: 255
                },
                final: {
                    r: 255,
                    g: 0,
                    b: 0
                }
            });

            this.canAttack = false;
            this.canMove = false;
            this.isTargetable = false;
            unitUtils.moveUnitOffScreen(this);
            Matter.Events.trigger(globals.currentGame.unitSystem, "removeUnitFromSelectionSystem", {
                unit: this
            });
            this.isSelectable = false;
            this.stop();

            var levelLocalEntities = originalDeath.call(this);

            this.reviveTimer = globals.currentGame.addTimer({
                name: 'revive' + this.unitId,
                gogogo: true,
                timeLimit: reviveTickTime,
                callback: function() {
                    var canRevive = false;
                    var revivingUnit = null;
                    unitUtils.applyToUnitsByTeam(function(team) {
                        return team == this.team;
                    }.bind(this), function(unit) {
                        return this != unit;
                    }.bind(this), function(unit) {
                        if (mathArrayUtils.distanceBetweenPoints(this.reviveCenter, unit.position) <= 50) {
                            revivingUnit = unit;
                            canRevive = true;
                        }
                    }.bind(this));

                    if (canRevive) {
                        this.reviveAmount += reviveTickTime;
                        this.revivePercent = this.reviveAmount / this.reviveTime;

                        if (!this.gravePercentageText) {
                            this.gravePercentageText = graphicsUtils.addSomethingToRenderer('TEX+:', {
                                position: mathArrayUtils.clonePosition(this.grave.position, {
                                    x: 0,
                                    y: 50
                                }),
                                where: 'foreground',
                                style: styles.fatigueText
                            });
                        } else {
                            this.gravePercentageText.text = Math.floor(this.revivePercent * 100) + '%';
                        }

                        if (!this.graveIsFlashing) {
                            graphicsUtils.flashSprite({
                                sprite: this.grave,
                                duration: 150,
                                pauseDurationAtEnds: 80,
                                onEnd: () => {
                                    this.graveIsFlashing = false;
                                },
                                times: 1,
                                toColor: 0x9ffff2
                            });
                            this.graveIsFlashing = true;
                        }

                        if (this.revivePercent >= 1) {
                            this.revive({
                                revivingUnit: revivingUnit
                            });
                        }
                    }
                }.bind(this)
            });
            return levelLocalEntities;
        };
        this.death = revivableDeath;
    },

    softRevive: function() {
        globals.currentGame.invalidateTimer(this.reviveTimer);
        graphicsUtils.removeSomethingFromRenderer(this.grave);
        graphicsUtils.removeSomethingFromRenderer(this.gravePercentageText);

        this.gravePercentageText = null;
        this.graveIsFlashing = false;

        this.isDead = false;

        gameUtils.executeSomethingNextFrame(() => {
            this.isTargetable = true;
            this.isSelectable = true;
            this.canAttack = true;
            this.canMove = true;
        });
    },

    revive: function(options) {
        if (!this.isDead) {
            return;
        }

        options = Object.assign({
            gravePosition: mathArrayUtils.clonePosition(this.grave.position),
            health: 0.333,
            energy: 0.333,
        }, options);

        globals.currentGame.invalidateTimer(this.reviveTimer);
        graphicsUtils.removeSomethingFromRenderer(this.grave);
        graphicsUtils.removeSomethingFromRenderer(this.gravePercentageText);

        this.gravePercentageText = null;
        this.graveIsFlashing = false;

        this.isDead = false;
        this.setHealth(0.0);
        this.giveHealth(this.maxHealth * options.health);
        this.setEnergy(0.0);
        this.giveEnergy(this.maxEnergy * options.energy);

        var revivingPosition = options.revivingUnit ? mathArrayUtils.addScalarToVectorTowardDestination(options.revivingUnit.position, gameUtils.getCanvasCenter(), 60) : options.gravePosition;
        this.position = revivingPosition;


        gameUtils.executeSomethingNextFrame(() => {
            this.isTargetable = true;
            this.isSelectable = true;
            this.canAttack = true;
            this.canMove = true;
        });

        this.reviveSound.play();
        var replenAnimation = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations1',
            animationName: 'lifegain1',
            speed: 0.8,
            transform: [this.position.x, this.position.y + 10, 1.2, 1.2]
        });
        replenAnimation.tint = 0xf3ff09;
        replenAnimation.play();
        graphicsUtils.addSomethingToRenderer(replenAnimation, 'stageOne');
    },

    hideGrave: function() {
        if (this.grave) {
            if (this.corpse) {
                graphicsUtils.removeSomethingFromRenderer(this.corpse);
            }
            graphicsUtils.removeSomethingFromRenderer(this.grave);

            if (this.gravePercentageText) {
                graphicsUtils.removeSomethingFromRenderer(this.gravePercentageText);
                this.gravePercentageText = null;
            }
            this.grave = null;
        }
    }
};
