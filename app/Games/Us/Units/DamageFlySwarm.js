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
    volume: 0.08,
    rate: 1
});
var attackSound2 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.08,
    rate: 1.1
});
var attackSound3 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.08,
    rate: 0.9
});
var attackSound4 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.08,
    rate: 0.8
});
var attackSound5 = gameUtils.getSound('buzz1.mp3', {
    volume: 0.08,
    rate: 1.2
});
var attackSounds = [attackSound1, attackSound2, attackSound3];
var deathSound = gameUtils.getSound('buzzdeath.mp3', {
    volume: 0.1,
    rate: 1.00
});

export default function DamageFlySwarm(options) {
    var flies = {};

    var sizeScale = 1.0;

    options = options || {};
    $.extend(options, {
        radius: 50 * sizeScale
    }, options);

    var randomFlyNumber = mathArrayUtils.getRandomIntInclusive(1, 10);
    var randomFlyNumber2 = mathArrayUtils.getRandomIntInclusive(1, 10);

    var flyAnim = gameUtils.getAnimation({
        spritesheetName: 'FlySwarmAnimations',
        animationName: 'Swarm_' + randomFlyNumber,
        speed: 0.4 + Math.random() * 0.1,
        loop: true,
    });

    var blackFlyScale = 0.6 * sizeScale;
    var blackFlyAnim = gameUtils.getAnimation({
        spritesheetName: 'FlySwarmAnimations',
        animationName: 'Swarm_' + randomFlyNumber2,
        speed: 0.3,
        loop: true,
    });
    blackFlyAnim.scale = {x: blackFlyScale, y: blackFlyScale};
    blackFlyAnim.alpha = 0.8;
    blackFlyAnim.tint = 0x000000;

    flyAnim.tint = 0xde3c3c;
    flyAnim.originalTint = flyAnim.tint;
    flyAnim.originalSpeed = flyAnim.animationSpeed;
    flyAnim.scale = {x: sizeScale, y: sizeScale};

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
            stage: 'stage',
            rotate: 'continuous',
            visible: true,
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: 60,
        }, {
            id: 'main2',
            data: blackFlyAnim,
            stage: 'stage',
            rotate: 'none',
            visible: true,
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: 60,
        }, {
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: {
                x: 2.0 * sizeScale,
                y: 2.0 * sizeScale
            },
            alpha: 0.5,
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: {
                x: 0,
                y: 20 * sizeScale
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
        death: function() {
            var self = this;
            this.isTargetable = false;
            this.canTakeAbilityDamage = false;
            deathSound.play();
            graphicsUtils.fadeSpriteOverTime({
                sprite: flyAnim,
                duration: 300,
                nokill: true
            });

            graphicsUtils.fadeSpriteOverTime({
                sprite: blackFlyAnim,
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
            this.moveSpeed = 0.4 + Math.random() * 0.7;
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
            blackFlyAnim.play();
            var myRunOffListener = unitUtils.createUnitRanOffStageListener(this, function() {
                globals.currentGame.removeUnit(this);
            }.bind(this));

            var self = this;

            var expandOut = true;
            this.innerFlyExpandTimer = globals.currentGame.addTimer({
                name: 'gritDodgeTimer' + this.unitId,
                timeLimit: 3000,
                runs: 1,
                tickCallback: function() {
                    var alternateAmount = sizeScale - blackFlyScale;
                    if(expandOut) {
                        blackFlyAnim.scale = {x: blackFlyScale + (alternateAmount * this.percentDone), y: blackFlyScale + (alternateAmount * this.percentDone)};
                    } else {
                        blackFlyAnim.scale = {x: 1 - (alternateAmount * this.percentDone), y: 1 - (alternateAmount * this.percentDone)};
                    }
                },
                totallyDoneCallback: function() {
                    this.timeLimit = 3000 + Math.random() * 1000;
                    expandOut = !expandOut;
                    this.reset();
                }
            });

            var cooldown = 200;
            var damage = 3;
            this.attackTimer = globals.currentGame.addTimer({
                name: 'flyAttackTimer' + this.unitId,
                gogogo: true,
                timeLimit: cooldown,
                callback: function() {
                    if(this.isDead) {
                        return;
                    }
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
                        target.sufferAttack(damage, this, {ignoreArmor: true});
                        var bloodAnimation = gameUtils.getAnimation({
                            spritesheetName: 'UtilityAnimations1',
                            animationName: 'GenericHit',
                            speed: 1.0,
                            transform: [target.position.x + Math.random() * 8, target.position.y + Math.random() * 8, 0.25, 0.25]
                        });
                        graphicsUtils.addSomethingToRenderer(bloodAnimation, 'foreground');
                        bloodAnimation.play();
                        attacked = true;
                    }.bind(this));

                    if(attacked) {
                        flyAnim.animationSpeed = 0.5;
                        mathArrayUtils.getRandomElementOfArray(attackSounds).play();
                    }
                }.bind(this)
            });
            gameUtils.deathPact(this, this.attackTimer);
            gameUtils.deathPact(this, this.innerFlyExpandTimer);
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
            alwaysTry: true
        }
    });
}
