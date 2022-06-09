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

export default function Eruptlet(options) {
    var eruptlet = {};

    options = options || {};
    $.extend(options, {
        radius: 20
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

    var animationSpeed = 1.0;
    var runAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'run',
            speed: animationSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'run',
            speed: animationSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'run',
            speed: animationSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'run',
            speed: animationSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'run',
            speed: animationSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'run',
            speed: animationSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'run',
            speed: animationSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'run',
            speed: animationSpeed,
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

    var scale = 0.08;
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
                x: 1.1,
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
                x: 0.36,
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
                x: 1.0,
                y: 1.0
            },
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: {
                x: 0,
                y: 22
            }
        }
    ];

    var burstSound = gameUtils.getSound('eruptletburst.wav', {
        volume: 0.08,
        rate: 1
    });

    var unitProperties = $.extend({
        unitType: 'Eruptlet',
        health: 20,
        defense: 2,
        energy: 0,
        energyRegenerationRate: 0,
        experienceWorth: 20,
        hitboxWidth: 25,
        hitboxHeight: 25,
        hitboxYOffset: 10,
        buffYOffset: 28,
        itemsEnabled: true,
        // adjustHitbox: true,
        portrait: graphicsUtils.createDisplayObject('EruptletPortrait'),
        wireframe: graphicsUtils.createDisplayObject('EruptletGroupPortrait'),
        team: options.team || 4,
        priority: 50,
        name: options.name,
        manualUnitHeight: 1,
        idleSpecificAnimation: true,
        abilities: [],
        death: function() {
            if (!this.alreadyAttacked && !this.isAttacking) {
                this.attack();
            }
            globals.currentGame.removeUnit(this);
        },
        _afterAddInit: function() {
            $.each(this.body.renderlings, function(key, renderling) {
                if (renderling.skeleton) {
                    $.each(renderling.skeleton.slots, function(i, slot) {
                        if (slot.currentSprite) {
                            if (slot.currentSpriteName.includes('1---4') ||
                                (slot.currentSpriteName.includes('1---1') && !slot.currentSpriteName.includes('1---11') && slot.currentSpriteName.charAt(slot.currentSpriteName.length - 1) == '1') ||
                                (slot.currentSpriteName.includes('1---2') && !slot.currentSpriteName.includes('1---20')) ||
                                slot.currentSpriteName.includes('1---3') ||
                                slot.currentSpriteName.includes('NorthWest_0003_Layer-1---5') ||
                                slot.currentSpriteName.includes('North_0003_Layer-1---5')) {
                                slot.customColor = {
                                    r: 0.2,
                                    g: 1.0,
                                    b: 0.2,
                                    a: 1.0
                                };
                            }
                        }
                    });
                }
            });
        },
    }, options);

    return UC({
        givenUnitObj: eruptlet,
        renderChildren: rc,
        radius: options.radius,
        mass: options.mass || 8,
        mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
        slaves: [burstSound, unitProperties.portrait, unitProperties.wireframe],
        unit: unitProperties,
        moveable: {
            moveSpeed: 1.5,
            walkAnimations: runAnimations,
        },
        attacker: {
            attackAnimations: attackAnimations,
            cooldown: 650,
            honeRange: 300,
            range: options.radius * 2.3,
            damage: 12,
            attack: function(target) {
                var deathAnimation = gameUtils.getAnimation({
                    spritesheetName: 'EruptletAnimations1',
                    animationName: 'eruptletExplode',
                    speed: 1.2,
                    transform: [this.position.x, this.position.y, 1.5, 1.5]
                });

                deathAnimation.rotation = Math.random() * Math.PI;
                deathAnimation.play();
                burstSound.play();
                graphicsUtils.addSomethingToRenderer(deathAnimation, 'stageOne');

                var blastRadius = 70;
                var bodiesToDamage = [];
                unitUtils.applyToUnitsByTeam(function(team) {
                    return this.team != team;
                }.bind(this), function(unit) {
                    return (mathArrayUtils.distanceBetweenBodies(this.body, unit.body) <= blastRadius && unit.isTargetable & unit != eruptlet);
                }.bind(this), function(unit) {
                    // console.info('eruplet ' + this.unitId + ' attacked!');
                    unit.sufferAttack(this.damage, this);
                }.bind(this));
                this.alreadyAttacked = true;
                if (!this.isDead) {
                    this.sufferAttack(10000, null, {
                        dodgeable: false,
                        blockable: false,
                        systemDealt: true
                    });
                }
            }
        },
    });
}
