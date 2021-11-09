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

var attackSound1 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.1,
    rate: 1
});
var attackSound2 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.1,
    rate: 1.1
});
var attackSound3 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.1,
    rate: 0.9
});
var attackSound4 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.1,
    rate: 0.8
});
var attackSound5 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.1,
    rate: 1.2
});
var attackSounds = [attackSound1, attackSound2, attackSound3, attackSound4, attackSound5];
var deathSound = gameUtils.getSound('buzzdeath.mp3', {
    volume: 0.1,
    rate: 1.00
});

export default function DamageFlySwarm(options) {
    var flies = {};

    options = options || {};
    $.extend(options, {
        radius: 40
    }, options);

    var randomFlyNumber = mathArrayUtils.getRandomIntInclusive(1, 10);

    var flyAnim = gameUtils.getAnimation({
        spritesheetName: 'FlySwarmAnimations',
        animationName: 'Swarm_' + randomFlyNumber,
        speed: 0.3 + Math.random() * 0.1,
        loop: true,
    });

    flyAnim.tint = 0x360809;
    flyAnim.originalTint = flyAnim.tint;
    flyAnim.originalSpeed = flyAnim.animationSpeed;

    flies.tintMe = function(tint) {
        flyAnim.tint = tint;
    };

    flies.untintMe = function() {
        flyAnim.tint = flyAnim.originalTint;
    };

    var sc = {
        x: 0.1,
        y: 0.1
    };
    var adjustedUpDownsc = {
        x: 0.1,
        y: 0.1
    };
    var flipsc = {
        x: -1 * sc.x,
        y: sc.y
    };
    var yOffset = 22;
    var rc = [{
            id: 'selected',
            data: 'IsometricSelected',
            scale: {
                x: 1.1,
                y: 1.1
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
                x: 0.6,
                y: 0.6
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
            id: 'main',
            data: flyAnim,
            stage: 'stageOne',
            rotate: 'none',
            visible: true,
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: 0,
        }, {
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: {
                x: 2.0,
                y: 2.0
            },
            alpha: 0.3,
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: {
                x: 0,
                y: 20
            }
        }
    ];

    var unitProperties = $.extend({
        unitType: 'DamageFlies',
        health: 1,
        isoManaged: false,
        defense: 1,
        energy: 0,
        energyRegenerationRate: 0,
        experienceWorth: 20,
        forcedItemDropOffset: {
            y: 10
        },
        hitboxWidth: 50,
        hitboxHeight: 50,
        hitboxYOffset: 5,
        itemsEnabled: true,
        disregardItemBuffs: true,
        organic: true,
        flying: true,
        hazard: true,
        portrait: graphicsUtils.createDisplayObject('BoxPortrait'),
        wireframe: graphicsUtils.createDisplayObject('BoxGroupPortrait'),
        team: options.team || 49,
        priority: 50,
        name: options.name,
        // heightAnimation: 'main',
        idleSpecificAnimation: true,
        abilities: [],
        _init: function() {
            Matter.Sleeping.set(this.body, true);
        },
        death: function() {
            var self = this;
            deathSound.play();
            graphicsUtils.fadeSpriteOverTime({
                sprite: flyAnim,
                duration: 300,
                nokill: true
            });

            graphicsUtils.fadeSpriteOverTime({
                sprite: self.renderlings.shadow,
                duration: 300,
                nokill: true
            });

            graphicsUtils.flashSprite({
                sprite: flyAnim,
                onEnd: function() {
                    globals.currentGame.removeUnit(self);
                }
            });
        },
        _afterAddInit: function() {
            this.moveSpeed = 1.0 + Math.random() * 0.5;
            var currentPosition = this.position;

            var attackPosX = Math.random() * gameUtils.getPlayableWidth();
            var attackPosY = Math.random() * gameUtils.getPlayableHeight();
            var amPosition = {
                x: attackPosX,
                y: attackPosY
            };
            amPosition = mathArrayUtils.addScalarToVectorTowardDestination(currentPosition, amPosition, 9999);

            this.move(amPosition);
            flyAnim.play();
            unitUtils.createUnitRanOffStageListener(this, function() {
                globals.currentGame.removeUnit(this);
            }.bind(this));

            var self = this;

            var cooldown = 200;
            var damage = 3;
            this.attackTimer = globals.currentGame.addTimer({
                name: 'flyAttackTimer' + this.unitId,
                gogogo: true,
                timeLimit: cooldown,
                callback: function() {
                    var attacked = false;
                    flyAnim.animationSpeed = flyAnim.originalSpeed;
                    gameUtils.applyToUnitsByTeam(function(team) {
                        return self.team != team;
                    }, function(unit) {
                        return (mathArrayUtils.distanceBetweenBodies(self, unit.body) <= (60));
                    }.bind(this), function(target) {
                        if(!globals.currentGame.battleInProgress) {
                            return;
                        }
                        target.sufferAttack(damage, this, {ignoreAmor: true});
                        var bloodAnimation = gameUtils.getAnimation({
                            spritesheetName: 'UtilityAnimations1',
                            animationName: 'GenericHit',
                            speed: 1.0,
                            transform: [target.position.x + Math.random() * 8, target.position.y + Math.random() * 8, 0.25, 0.25]
                        });
                        graphicsUtils.addSomethingToRenderer(bloodAnimation, 'foreground');
                        bloodAnimation.play();
                        attacked = true;
                    });

                    if(attacked) {
                        flyAnim.animationSpeed = 0.5;
                        mathArrayUtils.getRandomElementOfArray(attackSounds).play();
                    }
                }.bind(this)
            });
            gameUtils.deathPact(this, this.attackTimer);
        }
    }, options);

    return UC({
        givenUnitObj: flies,
        renderChildren: rc,
        radius: options.radius,
        mass: options.mass || 8,
        mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
        slaves: [ /*attackSound, deathSound,*/ unitProperties.portrait, unitProperties.wireframe],
        unit: unitProperties,
        moveable: {
            moveSpeed: 2.0,
        }
    });
}
