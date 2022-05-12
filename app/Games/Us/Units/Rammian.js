import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import style from '@utils/Styles.js';
import {
    globals
} from '@core/Fundamental/GlobalState';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';

var mineExplosionSound = gameUtils.getSound('critterdeath.wav', {
    volume: 0.06,
    rate: 1.2
});

export default function Rammian(options) {
    var rammian = {};

    options = options || {};
    $.extend(options, {
        radius: 25
    }, options);

    //animation settings
    var runSpeed = 0.6;
    var runSpeedBonus = 0.25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterN'].spineData);
    var spineSouth = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterS'].spineData);
    var spineWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterW'].spineData);
    var spineEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterW'].spineData);
    var spineSouthWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterSW'].spineData);
    var spineSouthEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterSW'].spineData);
    var spineNorthWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterNW'].spineData);
    var spineNorthEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterNW'].spineData);

    var runAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
    };

    var attackAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
    };

    var scale = 0.1;
    var sc = {
        x: scale,
        y: scale
    };
    var adjustedUpDownsc = {
        x: scale,
        y: scale
    };
    var flipsc = {
        x: -1 * sc.x,
        y: sc.y
    };
    var yOffset = 22;
    var rc = [{
            id: 'selected',
            data: 'IsometricSelectedSmall',
            scale: {
                x: 1.2,
                y: 1.3
            },
            stage: 'stageNOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {
                x: 0,
                y: 22
            },
        },
        {
            id: 'selectionPending',
            data: unitUtils.getPendingAnimation(),
            scale: {
                x: 0.35,
                y: 0.42
            },
            stage: 'stageNOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {
                x: 0,
                y: 22
            },
        }, {
            id: 'left',
            data: spineWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            },
        }, {
            id: 'right',
            data: spineEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            }
        },
        {
            id: 'up',
            data: spineNorth,
            scale: adjustedUpDownsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            }
        },
        {
            id: 'down',
            data: spineSouth,
            scale: adjustedUpDownsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            }
        },
        {
            id: 'upLeft',
            data: spineNorthWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            }
        },
        {
            id: 'upRight',
            data: spineNorthEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            }
        },
        {
            id: 'downRight',
            data: spineSouthEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            }
        }, {
            id: 'downLeft',
            data: spineSouthWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            }
        }, {
            id: 'shadow',
            data: 'IsoShadowBlurredSmall',
            scale: {
                x: 1.2,
                y: 1.2
            },
            visible: true,
            tint: 0x3b0101,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: {
                x: 0,
                y: 22
            }
        }
    ];

    var attackSound = gameUtils.getSound('critterhit.wav', {
        volume: 0.2,
        rate: 0.7
    });
    var deathSound = gameUtils.getSound('critterdeath.wav', {
        volume: 0.08,
        rate: 1.4
    });

    var unitProperties = $.extend({
        unitType: 'Rammian',
        health: 30,
        grit: 20,
        defense: 2,
        energy: 0,
        energyRegenerationRate: 0,
        healthRegenerationRate: 2,
        experienceWorth: 20,
        hitboxWidth: 25,
        hitboxHeight: 25,
        hitboxYOffset: 10,
        buffYOffset: 48,
        manualUnitHeight: 30,
        itemsEnabled: true,
        // adjustHitbox: true,
        portrait: graphicsUtils.createDisplayObject('RammianPortrait'),
        wireframe: graphicsUtils.createDisplayObject('GargoyleGroupPortrait'),
        team: options.team || 4,
        priority: 50,
        name: options.name,
        heightAnimation: 'up',
        idleSpecificAnimation: true,
        abilities: [],
        death: function() {
            var self = this;
            var anim = gameUtils.getAnimation({
                spritesheetName: 'CritterAnimations1',
                animationName: 'critterdeath',
                speed: 0.25,
                persists: true,
                transform: [self.deathPosition.x, self.deathPosition.y, 1.1, 1.1]
            });
            anim.tint = 0xff9090;
            graphicsUtils.addSomethingToRenderer(anim);
            anim.play();
            deathSound.play();

            this.deathTimer = graphicsUtils.flashSprite({
                sprite: anim,
                duration: 500,
                fromColor: anim.tint,
                times: 1 + Math.ceil(Math.random() * 3),
                onEnd: () => {
                    this.deathTimer = graphicsUtils.flashSprite({
                        sprite: anim,
                        duration: 100,
                        fromColor: anim.tint,
                        times: 6,
                        onEnd: () => {
                            graphicsUtils.removeSomethingFromRenderer(anim);

                            //explode animation
                            var mineExplosionAnimation = gameUtils.getAnimation({
                                spritesheetName: 'MedicAnimations1',
                                animationName: 'mineexplosion',
                                speed: 2.8,
                                transform: [self.deathPosition.x, self.deathPosition.y, 2.0, 2.0]
                            });
                            var blastRadius = 100;
                            graphicsUtils.makeSpriteSize(mineExplosionAnimation, {
                                x: blastRadius * 2.9,
                                y: blastRadius * 2.9
                            });
                            mineExplosionAnimation.tint = 0xe2391b;
                            mineExplosionAnimation.play();

                            mineExplosionSound.play();
                            graphicsUtils.addSomethingToRenderer(mineExplosionAnimation, 'stageOne');

                            //smoke animation
                            var smokeExplosionAnimation = gameUtils.getAnimation({
                                spritesheetName: 'MedicAnimations1',
                                animationName: 'explosion-c',
                                speed: 0.4,
                                transform: [self.deathPosition.x, self.deathPosition.y - 30, 3, 3]
                            });
                            graphicsUtils.makeSpriteSize(smokeExplosionAnimation, {
                                x: blastRadius * 1.25,
                                y: blastRadius * 1.25
                            });
                            smokeExplosionAnimation.alpha = 0.4;
                            smokeExplosionAnimation.play();
                            graphicsUtils.addSomethingToRenderer(smokeExplosionAnimation, 'stageOne');

                            unitUtils.applyToUnitsByTeam(function(team) {
                                return rammian.team != team;
                            }, function(unit) {
                                return (mathArrayUtils.distanceBetweenBodies({
                                    position: {
                                        x: self.deathPosition.x,
                                        y: self.deathPosition.y
                                    }
                                }, unit.body) <= (blastRadius + unit.body.circleRadius) && unit.isTargetable && unit.canTakeAbilityDamage);
                            }.bind(this), function(unit) {
                                var dmg = 40;
                                unit.sufferAttack(dmg, null, {
                                    dodgeable: false,
                                    source: {x: self.deathPosition.x, y: self.deathPosition.y}
                                });
                                var variation = Math.random() * 0.3;
                                var maimBlast = gameUtils.getAnimation({
                                    spritesheetName: 'MedicAnimations1',
                                    animationName: 'maimblast',
                                    speed: 0.4 + variation,
                                    transform: [unit.position.x, unit.position.y, 1 + variation, 1 + variation]
                                });
                                maimBlast.rotation = Math.random() * Math.PI;
                                maimBlast.play();
                                maimBlast.tint = 0xd71100;
                                graphicsUtils.addSomethingToRenderer(maimBlast, 'stageOne');
                            });

                        }
                    });
                }
            });

            gameUtils.matterOnce(globals.currentGame, "VictoryOrDefeat OutingLevelCompleted", function() {
                if(this.deathTimer) {
                    this.deathTimer.invalidate();
                }
            }.bind(this));

            var shadow = graphicsUtils.addSomethingToRenderer('IsoShadowBlurred', {
                where: 'stageNTwo',
                scale: {
                    x: 0.75,
                    y: 0.75
                },
                position: mathArrayUtils.clonePosition(self.deathPosition, {
                    y: 22
                })
            });
            graphicsUtils.fadeSpriteOverTimeLegacy(shadow, 1500);
            graphicsUtils.addSomethingToRenderer(shadow);
            globals.currentGame.removeUnit(this);
            return [shadow, anim];
        },
        _afterAddInit: function() {
            $.each(this.body.renderlings, function(key, renderling) {
                if (renderling.skeleton) {
                    $.each(renderling.skeleton.slots, function(i, slot) {
                        if(!slot.attachment) {
                            return;
                        }
                        slot.customColor = {
                            r: mathArrayUtils.flipCoin() ? 0.6 : 0.8,
                            g: 0.2,
                            b: 0.2,
                            a: 1.0
                        };
                        if(slot.currentSprite) {
                            if(slot.currentSpriteName.includes('1---4') ||
                              (slot.currentSpriteName.includes('1---1') && !slot.currentSpriteName.includes('1---11') && slot.currentSpriteName.charAt(slot.currentSpriteName.length-1) == '1') ||
                              (slot.currentSpriteName.includes('1---2') && !slot.currentSpriteName.includes('1---20')) ||
                              slot.currentSpriteName.includes('1---3') ||
                              slot.currentSpriteName.includes('NorthWest_0003_Layer-1---5') ||
                              slot.currentSpriteName.includes('North_0003_Layer-1---5'))
                            {
                                slot.customColor = {
                                    r: 1.0,
                                    g: 1.0,
                                    b: 1.0,
                                    a: 1.0
                                };
                            }
                        }
                    });
                }
            });

            //enrage
            this.enrageAvailable = true;
            this.enrageCooldown = 1800;
            this.enrageLength = 2000;
            this.chargeTime = 800;
            Matter.Events.on(this, 'sufferNonLethalAttack', function(event) {
                if (this.enrageAvailable && this.currentHealth < this.maxHealth / 2) {
                    this.enrageAvailable = false;

                    gameUtils.deathPact(this, gameUtils.doSomethingAfterDuration(() => {
                        this.enrageAvailable = true;
                    }, this.enrageCooldown + this.enrageLength));

                    this.stop(null, {
                        peaceful: true
                    });
                    this.canMove = false;
                    this.canAttack = false;
                    graphicsUtils.flashSprite({
                        sprite: this,
                        tintableName: 'isoManagedTint',
                        toColor: 0x0341df,
                        duration: 100,
                        times: 4
                    });
                    gameUtils.deathPact(this, gameUtils.doSomethingAfterDuration(() => {
                        this.stop();
                        this.canMove = true;
                        this.canAttack = true;
                        this.applySpeedBuff({
                            duration: this.enrageLength,
                            amount: 2.25
                        });
                    }, this.chargeTime));
                }
            }.bind(this));
        },
    }, options);

    return UC({
        givenUnitObj: rammian,
        renderChildren: rc,
        radius: options.radius,
        mass: options.mass || 8,
        mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
        slaves: [attackSound, deathSound, unitProperties.portrait, unitProperties.wireframe],
        unit: unitProperties,
        moveable: {
            moveSpeed: 2.2,
            walkAnimations: runAnimations,
        },
        attacker: {
            attackAnimations: attackAnimations,
            cooldown: 750,
            honeRange: 300,
            range: options.radius * 2 + 14,
            isMelee: true,
            damage: 25,
            attackExtension: function(target) {
                var bloodAnimation = gameUtils.getAnimation({
                    spritesheetName: 'UtilityAnimations3',
                    animationName: 'hit3',
                    speed: 1.0,
                    transform: [target.position.x + Math.random() * 8, target.position.y + Math.random() * 8, 1.25, 1.25]
                });
                bloodAnimation.rotation = Math.random();
                graphicsUtils.graduallyTint(bloodAnimation, 0xff2f2f, 0x540000, 500, null, null, 1);
                graphicsUtils.addSomethingToRenderer(bloodAnimation, 'foreground');
                bloodAnimation.play();
                attackSound.play();
            },
        },
    });
}
