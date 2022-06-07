import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import Passive from '@core/Unit/UnitPassive.js';
import rv from '@core/Unit/_Revivable.js';
import styles from '@utils/Styles.js';
import {
    globals
} from '@core/Fundamental/GlobalState';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';

export default function Marine(options) {
    var marine = {};

    options = options || {};

    //animation settings
    var walkSpeed = 0.9;
    var walkSpeedBonus = 0.25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.marineN.spineData);
    var spineSouth = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.marineS.spineData);
    var spineWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.marineW.spineData);
    var spineEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.marineW.spineData);
    var spineSouthWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.marineSW.spineData);
    var spineSouthEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.marineSW.spineData);
    var spineNorthWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.marineNW.spineData);
    var spineNorthEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.marineNW.spineData);

    var walkAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
    };

    var attackAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'shoot',
            setupUponStop: true,
            speed: 2,
            times: 3,
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'shoot',
            setupUponStop: true,
            speed: 2,
            times: 3,
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'shoot',
            setupUponStop: true,
            speed: 2,
            times: 3,
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'shoot',
            setupUponStop: true,
            speed: 2,
            times: 3,
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'shoot',
            setupUponStop: true,
            speed: 2,
            times: 3,
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'shoot',
            setupUponStop: true,
            speed: 2,
            times: 3,
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'shoot',
            setupUponStop: true,
            speed: 2,
            times: 3,
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'shoot',
            setupUponStop: true,
            speed: 2,
            times: 3,
        }),
    };

    var throwAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'throw',
            speed: 0.5,
            mixedAnimation: true
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'throw',
            times: 1,
            speed: 0.5,
            mixedAnimation: true
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'throw',
            times: 1,
            speed: 0.5,
            mixedAnimation: true
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'throw',
            speed: 0.5,
            mixedAnimation: true
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'throw',
            speed: 0.5,
            mixedAnimation: true
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'throw',
            speed: 0.5,
            mixedAnimation: true
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'throw',
            speed: 0.5,
            mixedAnimation: true
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'throw',
            speed: 0.5,
            mixedAnimation: true
        }),
    };

    var otherAnimations = {

    };

    var sc = {
        x: 0.38,
        y: 0.38
    };
    var adjustedUpsc = {
        x: 0.4,
        y: 0.4
    };
    var adjustedDownsc = {
        x: 0.4,
        y: 0.4
    };
    var flipsc = {
        x: -1 * sc.x,
        y: sc.y
    };
    var yOffset = 22;
    var sortYOffset = 0;
    var rc = [{
            id: 'selected',
            data: 'IsometricSelectedSmall',
            scale: {
                x: 1.26,
                y: 1.40
            },
            stage: 'stageNOne',
            visible: false,
            avoidIsoMgr: true,
            roundPixels: true,
            rotate: 'none',
            offset: {
                x: 0,
                y: 20
            },
        },
        {
            id: 'selectionPending',
            data: unitUtils.getPendingAnimation(),
            scale: {
                x: 0.4,
                y: 0.48
            },
            stage: 'stageNOne',
            visible: false,
            avoidIsoMgr: true,
            roundPixels: true,
            rotate: 'none',
            offset: {
                x: 0,
                y: 20
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
            sortYOffset: sortYOffset,
        }, {
            id: 'right',
            data: spineEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            },
            sortYOffset: sortYOffset,
        },
        {
            id: 'up',
            data: spineNorth,
            scale: adjustedUpsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset - 2
            },
            sortYOffset: sortYOffset,
        },
        {
            id: 'down',
            data: spineSouth,
            scale: adjustedDownsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset - 2
            },
            sortYOffset: sortYOffset,
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
            },
            sortYOffset: sortYOffset,
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
            },
            sortYOffset: sortYOffset,
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
            },
            sortYOffset: sortYOffset,
        }, {
            id: 'downLeft',
            data: spineSouthWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            },
            sortYOffset: sortYOffset,
        }, {
            id: 'shadow',
            data: 'IsoShadowBlurredSmall',
            scale: {
                x: 1.2,
                y: 1.2
            },
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

    var fireSound = gameUtils.getSound('machinegun.wav', {
        volume: 0.002,
        rate: 3
    });
    var knifeBreakSound = gameUtils.getSound('knifebreak.wav', {
        volume: 0.0065,
        rate: 2.0
    });
    var dodgeSound = gameUtils.getSound('shane_dodge.mp3', {
        volume: 0.4,
        rate: 1
    });
    var holdPositionSound = gameUtils.getSound('shane_dodge.mp3', {
        volume: 0.25,
        rate: 0.8
    });
    var poisonSound = gameUtils.getSound('poisonhit1.wav', {
        volume: 0.01,
        rate: 0.6
    });

    //crit
    var criticalHitSound = gameUtils.getSound('criticalhit.wav', {
        volume: 0.03,
        rate: 1.0
    });

    //crit
    var shockSound = gameUtils.getSound('shanehumph1.wav', {
        volume: 0.1,
        rate: 1.0
    });

    //death
    var deathSound = gameUtils.getSound('marinedeathsound.wav', {
        volume: 0.2,
        rate: 1.0
    });
    var deathSoundBlood = gameUtils.getSound('marinedeathbloodsound.wav', {
        volume: 0.06,
        rate: 1.2
    });

    //other
    var healsound = gameUtils.getSound('healsound.wav', {
        volume: 0.006,
        rate: 1.3
    });
    var manaHealSound = gameUtils.getSound('healsound.wav', {
        volume: 0.007,
        rate: 0.9
    });
    var yeahsound = gameUtils.getSound('shaneyeah.wav', {
        volume: 0.1,
        rate: 1.0
    });

    //Dash
    var dashVelocity = 0.8;
    var dashSound = gameUtils.getSound('dashsound2.wav', {
        volume: 0.04,
        rate: 1.2
    });
    var dash = function(destination, commandObj) {
        //get current augment
        var thisAbility = this.getAbilityByName('Dash');
        var defensivePostureAugment = thisAbility.isAugmentEnabled('defensive posture');
        var deathWishAugment = thisAbility.isAugmentEnabled('death wish');
        var shockAugment = thisAbility.isAugmentEnabled('shock');
        var blitzAugment = thisAbility.isAugmentEnabled('blitz');

        this.stop(null, {
            peaceful: true
        }); //stop any movement
        this.moveSpeedAugment = this.moveSpeed;
        this.body.frictionAir = 0.2;
        var velocityVector = Matter.Vector.sub(destination, this.position);
        var alteredVelocity = blitzAugment ? dashVelocity * blitzAugment.dashFactor : dashVelocity;
        var velocityScaled = alteredVelocity / Matter.Vector.magnitude(velocityVector);
        Matter.Body.applyForce(this.body, this.position, {
            x: velocityScaled * velocityVector.x,
            y: velocityScaled * velocityVector.y
        });
        dashSound.play();
        Matter.Events.trigger(globals.currentGame, 'dash', {
            performingUnit: this
        });
        Matter.Events.trigger(this, 'dash');

        //play animation
        var dashAnimation = gameUtils.getAnimation({
            spritesheetName: 'MarineAnimations1',
            animationName: 'dash',
            speed: 0.3,
            transform: [this.position.x, this.position.y, 3.5, blitzAugment ? 4.0 : 2.5]
        });

        dashAnimation.tint = blitzAugment ? 0xffdb44 : 0x8f0000;

        dashAnimation.play();
        dashAnimation.alpha = 0.8;
        dashAnimation.rotation = mathArrayUtils.pointInDirection(this.position, destination, 'north');
        graphicsUtils.addSomethingToRenderer(dashAnimation, 'stageNOne');

        var self = this;
        self.dashTimer = globals.currentGame.addTimer({
            name: 'dashDoneTimer' + self.unitId,
            runs: 1,
            timeLimit: 280,
            callback: function() {
                if (self.commandQueue.getCurrentCommand().id == commandObj.command.id) {
                    //only stop if we're still on the current dash command
                    self.stop();
                }
                if (self.commandQueue.getCurrentCommand().id == 'empty' || self.commandQueue.getCurrentCommand().method.name == 'throwKnife') {
                    //if we're a knife or empty, become on alert
                    self._becomeOnAlert();
                }

                if (self.shockCollision) {
                    self.shockCollision.removeHandler();
                }

                commandObj.command.done();
            }
        });

        var defensivePostureGain = 2;
        if (defensivePostureAugment) {
            marine.applyDefenseBuff({
                id: 'defpostbuff',
                duration: 5000,
                amount: defensivePostureGain
            });
            Matter.Events.trigger(globals.currentGame, dPostureEventName, {
                value: 1
            });
        }

        if (blitzAugment) {
            marine.applySpeedBuff({
                id: 'blitzPostBuff',
                duration: 1000,
                amount: blitzAugment.moveSpeedIncrease
            });
            Matter.Events.trigger(globals.currentGame, blitzEventName, {
                value: 1
            });
        }

        if (shockAugment) {
            unitUtils.showBlockGraphic({
                scale: {
                    x: 0.9,
                    y: 0.9
                },
                attackingUnit: {
                    position: destination
                },
                unit: self,
                tint: 0xd4631a
            });
            dashAnimation.tint = 0xd67400;
        }

        if (self.shockCollision) {
            self.shockCollision.removeHandler();
        }
        if (shockAugment) {
            self.shockCollision = gameUtils.matterConditionalOnce(this.body, 'onCollideActive onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == self.body ? pair.pair.bodyA : pair.pair.bodyB;
                if (!otherBody.isCollisionBody || !otherBody.unit) return false;
                var otherUnit = otherBody.unit;
                shockSound.play();
                otherUnit.sufferAttack(shockAugment.damage, self, {
                    dodgeable: false,
                    ignoreArmor: false,
                    id: 'shock',
                    abilityType: false,
                });
                otherUnit.petrify({
                    duration: shockAugment.petrifyDuration,
                    petrifyingUnit: self
                });
                Matter.Events.trigger(globals.currentGame, shockEventName, {
                    value: 1
                });
                return true;
            });
        }

        if (deathWishAugment) {
            if (marine.deathWishListener) {
                marine.deathWishCollectorTurnOffTimer.invalidate();
            } else {
                marine.deathWishListener = Matter.Events.on(marine, 'dealDamage', (event) => {
                    if (event.attackContext.id == 'rifle') {
                        let subtractableDamage = event.eventSubtractableDamage;
                        let bonusDamage = Math.min(deathWishAugment.damageIncrease, subtractableDamage);
                        event.eventSubtractableDamage -= bonusDamage;
                        Matter.Events.trigger(globals.currentGame, deathWishEventName, {
                            value: bonusDamage
                        });
                    }
                });
            }
            marine.deathWishCollectorTurnOffTimer = gameUtils.doSomethingAfterDuration(() => {
                Matter.Events.off(marine, 'dealDamage', marine.deathWishListener);
                marine.deathWishListener = null;
            }, 2000);

            marine.enrage({
                id: "deathwishbuff",
                duration: 2000,
                amount: deathWishAugment.damageIncrease
            });
        }

        gameUtils.deathPact(this, self.dashTimer, 'dashDoneTimer');
    };

    var vrHpCost = 2;
    var vrECost = 2;
    var vitalReservesEventName = 'vitalReservesCollector';
    var deathWishEventName = 'deathWishCollector';
    var dPostureEventName = 'defensivePostureCollector';
    var shockEventName = 'shockCollector';
    var blitzEventName = 'blitzCollector';
    var dashAbility = new Ability({
        name: 'Dash',
        key: 'd',
        type: 'click',
        icon: graphicsUtils.createDisplayObject('DashIcon'),
        method: dash,
        title: 'Dash',
        description: 'Quickly move throughout the battlefield.',
        hotkey: 'D',
        energyCost: 3,
        enablers: [function(commandObj) {
            return marine.canMove;
        }.bind(this)],
        augments: [{
                name: 'vital reserves',
                icon: graphicsUtils.createDisplayObject('VitalReserves'),
                title: 'Vital Reserves',
                description: ['Decrease energy cost by ' + vrECost, 'Add ' + vrHpCost + ' hp to cost.'],
                equip: function(unit) {
                    this.ability.energyCost -= vrECost;
                    this.ability.hpEnable = this.ability.enablers.push(function() {
                        return unit.currentHealth > vrHpCost;
                    });
                    this.ability.hpCost = this.ability.costs.push(function() {
                        return unit.currentHealth -= vrHpCost;
                    });
                    this.ability.customCostTextUpdater = function() {
                        var thisAbilityCost = marine.getAbilityByName('Dash').energyCost;
                        return 'HP: ' + vrHpCost + ' and E: ' + thisAbilityCost;
                    };

                    this.vitalReserveDashProxy = Matter.Events.on(marine, 'dash', () => {
                        Matter.Events.trigger(globals.currentGame, vitalReservesEventName, {
                            healthSpent: vrHpCost,
                            energySaved: vrECost
                        });
                    });
                },
                unequip: function(unit) {
                    this.ability.energyCost += vrECost;
                    this.ability.enablers.splice(this.ability.enablers.indexOf(this.ability.hpEnable), 1);
                    this.ability.costs.splice(this.ability.costs.indexOf(this.ability.hpCost), 1);
                    this.ability.customCostTextUpdater = null;

                    Matter.Events.off(marine, 'dash', this.vitalReserveDashProxy);
                    this.vitalReserveDashProxy = null;
                },
                collector: {
                    eventName: vitalReservesEventName,
                    init: function() {
                        this.energySaved = 0;
                        this.healthSpent = 0;
                    },
                    presentation: {
                        labels: ["Energy saved", "Health spent"],
                        values: ["energySaved", "healthSpent"],
                    }
                }
            },
            {
                name: 'defensive posture',
                icon: graphicsUtils.createDisplayObject('DefensivePosture'),
                title: 'Defensive Posture',
                description: 'Gain 2 defense upon dashing for 5 seconds.',
                collector: {
                    eventName: dPostureEventName,
                    presentation: {
                        labels: ["Times activated"]
                    }
                }
            },
            {
                name: 'death wish',
                icon: graphicsUtils.createDisplayObject('DeathWish'),
                title: 'Death Wish',
                description: 'Become enraged upon dashing for 2 seconds.',
                damageIncrease: 3,
                collector: {
                    eventName: deathWishEventName,
                    presentation: {
                        labels: ["Addtl. damage from death wish"]
                    }
                }
            },
            {
                name: 'shock',
                icon: graphicsUtils.createDisplayObject('RamIcon'),
                title: 'Shock',
                description: ['Petrify unit for 4 seconds by dashing into it.', 'Deal 5 damage to unit by dashing into it.'],
                damage: 5,
                petrifyDuration: 4000,
                collector: {
                    eventName: shockEventName,
                    presentation: {
                        labels: ["Units petrified"]
                    }
                }
            },
            {
                name: 'blitz',
                icon: graphicsUtils.createDisplayObject('BlitzIcon'),
                title: 'Blitz',
                description: ['Increase dash length.', 'Increase movement speed upon dashing for 1 second.'],
                moveSpeedIncrease: 1.0,
                dashFactor: 1.5,
                collector: {
                    eventName: blitzEventName,
                    presentation: {
                        labels: ["Duration of increased speed"]
                    }
                }
            },
        ],
    });

    //Knife
    var knifeThrowSound = gameUtils.getSound('knifethrow.wav', {
        volume: 0.03,
        rate: 1.5
    });
    var knifeImpactSound = gameUtils.getSound('knifeimpact.wav', {
        volume: 0.05,
        rate: 1
    });
    marine.knifeSpeed = 22;
    marine.knifeDamage = 15;
    marine.trueKnife = false;
    var throwKnife = function(destination, commandObj, childKnife) {
        //get augments
        var thisAbility = this.getAbilityByName('Throw Knife');
        var multiThrowAugment = thisAbility.isAugmentEnabled('multi throw');
        var pierceAugment = thisAbility.isAugmentEnabled('pierce');
        var poisonTipAugment = thisAbility.isAugmentEnabled('poison tip');
        var friendlyFireAugment = thisAbility.isAugmentEnabled('friendly fire');
        var leftoverShardAugment = thisAbility.isAugmentEnabled('leftover shards');

        if (!childKnife && multiThrowAugment) {
            var distance = mathArrayUtils.distanceBetweenPoints(destination, this.position);
            var maxDistance = 250;
            if (distance > maxDistance) {
                destination = mathArrayUtils.addScalarToVectorTowardDestination(this.position, destination, maxDistance);
            }
            var perpVector = Matter.Vector.normalise(Matter.Vector.perp(Matter.Vector.sub(destination, this.position)));

            var start = (multiThrowAugment.knives - 1) / -2;
            var spacing = 25;
            for (var n = start; n < start + multiThrowAugment.knives; n++) {
                if (n == 0) continue;
                thisAbility.method.call(this, Matter.Vector.add(destination, Matter.Vector.mult(perpVector, n * spacing)), null, true);
            }
        }

        //look for free knives
        if (this.freeKnives) {
            this.getBuffById('freeKnife' + this.freeKnives).removeBuff({
                detached: true
            });
        }

        //create knife body
        var knife = Matter.Bodies.circle(0, 0, childKnife ? 3 : 5, {
            restitution: 0.95,
            frictionAir: 0,
            mass: options.mass || 5,
            isSensor: true,
            // drawWire: true,
            isChildKnife: childKnife
        });
        knife.collisionFilter.category = globals.currentGame.unitSystem.projectileCollisionCategory;
        // knife.collisionFilter.mask += globals.currentGame.unitSystem.flyingBodyCollisionCategory;

        if (pierceAugment) {
            knife.lives = pierceAugment.lives;
        }

        Matter.Body.setPosition(knife, this.position);
        var knifeTint = 0xFFFFFF;
        if (poisonTipAugment) {
            knifeTint = 0x009933;
        }
        if (pierceAugment) {
            knifeTint = 0x6666ff;
        }
        if (pierceAugment && poisonTipAugment) {
            knifeTint = 0xe88a1b;
        }

        var knifeScale = {
            x: 0.7,
            y: 0.7
        };
        var childKnifeScale = {
            x: 0.3,
            y: 0.3
        };
        var trueScale = knife.isChildKnife ? childKnifeScale : knifeScale;

        var shadowScale = {
            x: 1,
            y: 0.8
        };
        var childShadowScale = {
            x: 0.6,
            y: 0.3
        };
        var trueShadowScale = knife.isChildKnife ? childShadowScale : shadowScale;

        knife.renderChildren = [{
                id: 'knife',
                data: 'ThrowingDaggerBase',
                scale: trueScale,
                rotate: mathArrayUtils.pointInDirection(knife.position, destination),
            },
            {
                id: 'knifeblade',
                data: 'ThrowingDaggerBlade',
                scale: trueScale,
                rotate: mathArrayUtils.pointInDirection(knife.position, destination),
                tint: knifeTint,
            },
            {
                id: 'shadow',
                data: 'IsoShadowBlurredThin',
                scale: trueShadowScale,
                offset: {
                    x: 15,
                    y: 20
                },
                rotate: mathArrayUtils.pointInDirection(knife.position, destination, 'east'),
                stage: "stageNTwo",
            }
        ];
        globals.currentGame.addBody(knife);

        //send knife
        knifeThrowSound.play();
        knife.deltaTime = this.body.deltaTime;
        knife.destination = destination;

        if (leftoverShardAugment) {
            Matter.Events.on(knife, 'onremove', function() {
                if (!knife.canLeaveShards) return;
                var shard = Matter.Bodies.circle(knife.position.x, knife.position.y + 20, 8, {
                    isSensor: true,
                    noWire: true,
                });

                globals.currentGame.addBody(shard);
                knifeBreakSound.play();
                shard.isShard = true;
                var shardImage = graphicsUtils.addSomethingToRenderer('Shards', 'stageNOne', {
                    position: {
                        x: this.position.x,
                        y: this.position.y + 20
                    },
                    scale: {
                        x: mathArrayUtils.flipCoin() ? -1 : 1,
                        y: 1
                    },
                });
                graphicsUtils.flashSprite({
                    sprite: shardImage
                });

                gameUtils.deathPact(shard, shardImage);

                Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {
                    entity: shard
                });

                Matter.Events.on(shard, 'onCollide', function(pair) {
                    if (shard.alreadyActivated) {
                        return;
                    }

                    var otherBody = pair.pair.bodyB == shard ? pair.pair.bodyA : pair.pair.bodyB;
                    var otherUnit = otherBody.unit;
                    if (otherUnit && otherUnit.team != self.team) {
                        shard.alreadyActivated = true;
                        Matter.Events.trigger(globals.currentGame, leftoverShardsCollectorEventName, {
                            value: leftoverShardAugment.damage
                        });
                        otherUnit.sufferAttack(leftoverShardAugment.damage, marine);
                        var bloodPierceAnimation = gameUtils.getAnimation({
                            spritesheetName: 'UtilityAnimations1',
                            animationName: 'pierce',
                            speed: 0.95,
                            transform: [shard.position.x, shard.position.y, 0.45, 0.45]
                        });
                        knifeImpactSound.play();
                        bloodPierceAnimation.play();
                        graphicsUtils.addSomethingToRenderer(bloodPierceAnimation, 'foreground');
                        graphicsUtils.fadeSpriteOverTime({
                            sprite: shardImage,
                            duration: 300,
                            callback: function() {
                                globals.currentGame.removeBody(shard);
                            }
                        });
                    }
                }.bind(this));
            });
        }

        gameUtils.sendBodyToDestinationAtSpeed(knife, destination, marine.knifeSpeed, true, true);
        var removeSelf = globals.currentGame.addTickCallback(function() {
            if (leftoverShardAugment) {
                if (gameUtils.bodyRanOffStage(knife, null, 17, -52, -32, 35)) {
                    knife.canLeaveShards = true;
                    globals.currentGame.removeBody(knife);
                }
            } else {
                if (gameUtils.bodyRanOffStage(knife)) {
                    globals.currentGame.removeBody(knife);
                }
            }
        });
        gameUtils.deathPact(knife, removeSelf);

        //play spine animation
        this.isoManager.playSpecifiedAnimation('throw', gameUtils.isoDirectionBetweenPositions(this.position, destination), {
            movePrecedence: true
        });

        var self = this;
        Matter.Events.on(knife, 'onCollide', function(pair) {
            var otherBody = pair.pair.bodyB == knife ? pair.pair.bodyA : pair.pair.bodyB;
            var otherUnit = otherBody.unit;

            if (otherUnit && otherUnit != this && otherUnit.canTakeAbilityDamage && otherUnit.team != this.team) {
                let alteredDamage = marine.knifeDamage;
                if (knife.isChildKnife) {
                    alteredDamage = marine.knifeDamage / 2.0;
                }
                var damageRet = otherUnit.sufferAttack(alteredDamage, self, {
                    dodgeable: !self.trueKnife,
                    ignoreArmor: self.trueKnife,
                    id: 'knife',
                    abilityType: true,
                    knife: knife
                }); //we can make the assumption that a body is part of a unit if it's attackable

                if (damageRet && !damageRet.attackLanded) {
                    return;
                }

                if (poisonTipAugment) {
                    knife.poisonTimer = globals.currentGame.addTimer({
                        name: 'poisonTimer' + knife.id,
                        runs: poisonTipAugment.seconds * 2,
                        killsSelf: true,
                        timeLimit: 500,
                        callback: function() {
                            if (otherUnit.isDead) {
                                globals.currentGame.invalidateTimer(this);
                                return;
                            }
                            poisonSound.play();
                            var poisonAnimation = gameUtils.getAnimation({
                                spritesheetName: 'UtilityAnimations2',
                                animationName: 'poisonhit1',
                                speed: 2.1,
                                transform: [otherUnit.position.x, otherUnit.position.y, 0.4, 0.4]
                            });
                            poisonAnimation.rotation = Math.random() * Math.PI * 2;
                            graphicsUtils.addSomethingToRenderer(poisonAnimation, 'stageOne');
                            poisonAnimation.play();
                            var poisonRet = otherUnit.sufferAttack(poisonTipAugment.damage / (poisonTipAugment.seconds * 2), self, {
                                dodgeable: false,
                                ignoreArmor: true,
                                id: 'poison',
                                abilityType: true
                            });
                            if (poisonRet.attackLanded) {
                                Matter.Events.trigger(globals.currentGame, poisonKnifeCollectorEventName, {
                                    value: poisonRet.damageDone
                                });
                            }
                        }
                    });
                }

                if (knife.isChildKnife && !knife.alreadyHitPrimary) {
                    Matter.Events.trigger(globals.currentGame, multiThrowCollectorEventName, {
                        value: damageRet.damageDone
                    });
                }

                if (otherUnit.isDead) {
                    if (leftoverShardAugment) {
                        knife.canLeaveShards = true;
                    }
                    Matter.Events.trigger(this, 'knifeKill');
                    Matter.Events.trigger(globals.currentGame, 'knifeKill', {
                        performingUnit: this
                    });
                }
                var bloodPierceAnimation = gameUtils.getAnimation({
                    spritesheetName: 'UtilityAnimations1',
                    animationName: 'pierce',
                    speed: 0.95,
                    transform: [knife.position.x, knife.position.y, 0.25, 0.25]
                });
                knifeImpactSound.play();
                bloodPierceAnimation.play();
                bloodPierceAnimation.rotation = mathArrayUtils.pointInDirection(knife.position, knife.destination, 'east');
                graphicsUtils.addSomethingToRenderer(bloodPierceAnimation, 'foreground');
                if (pierceAugment) {
                    if (knife.alreadyHitPrimary) {
                        Matter.Events.trigger(globals.currentGame, piercingKnifeCollectorEventName, {
                            value: damageRet.damageDone
                        });
                    }
                    knife.alreadyHitPrimary = true;
                    knife.lives -= 1;
                    if (knife.lives == 0) {
                        globals.currentGame.removeBody(knife);
                    }
                } else {
                    globals.currentGame.removeBody(knife);
                }
            } else if (otherUnit && otherUnit.team == this.team && otherUnit != self && friendlyFireAugment) {
                if (self.friendlyFireApply == 'health') {
                    otherUnit.applyHealthGem({
                        duration: friendlyFireAugment.duration,
                        id: 'friendlyFireHealth'
                    });
                    self.friendlyFireApply = 'energy';
                } else {
                    otherUnit.applyEnergyGem({
                        duration: friendlyFireAugment.duration,
                        id: 'friendlyFireEnergy'
                    });
                    self.friendlyFireApply = 'health';
                }

                Matter.Events.trigger(globals.currentGame, friendlyFireCollectorEventName, {
                    value: 1
                });
            }

            if (otherBody.isMine) {
                Matter.Events.trigger(this, 'knifeMine');
                otherBody.explode();
            }
        }.bind(this));

        if (commandObj) {
            globals.currentGame.addTimer({
                name: 'knifeDoneTimer' + knife.id,
                runs: 1,
                killsSelf: true,
                timeLimit: 125,
                callback: function() {
                    commandObj.command.done();
                }
            });
        }

        Matter.Events.trigger(globals.currentGame, 'knifeThrow', {
            performingUnit: this
        });
        Matter.Events.trigger(this, 'knifeThrow');
    };

    var piercingKnifeCollectorEventName = 'piercingKnifeCollector';
    var poisonKnifeCollectorEventName = 'poisonKnifeCollector';
    var multiThrowCollectorEventName = 'multiThrowKnifeCollector';
    var friendlyFireCollectorEventName = 'friendlyFireKnifeCollector';
    var leftoverShardsCollectorEventName = 'leftoverShardsCollector';
    var knifeAbility = new Ability({
        name: 'Throw Knife',
        key: 'f',
        type: 'click',
        icon: graphicsUtils.createDisplayObject('KnifeIcon'),
        method: throwKnife,
        title: 'Throwing Knife',
        description: 'Throw a knife, dealing ' + marine.knifeDamage + ' damage.',
        updaters: {
            descriptions: function() {
                return {
                    index: 0,
                    value: 'Throw a knife, dealing ' + marine.knifeDamage + ' damage.'
                };
            }
        },
        hotkey: 'F',
        energyCost: 6,
        activeAugment: null,
        enablers: [function(commandObj) {
            return marine.canAttack;
        }.bind(this)],
        augments: [{
                name: 'pierce',
                lives: 3,
                icon: graphicsUtils.createDisplayObject('PiercingKnife'),
                title: 'Piercing Blow',
                description: 'Pierce 3 enemies with a single knife.',
                collector: {
                    eventName: piercingKnifeCollectorEventName,
                    presentation: {
                        labels: ["Knife damage after piercing primary target"],
                    }
                }
            },
            {
                name: 'poison tip',
                seconds: 5,
                damage: 30,
                icon: graphicsUtils.createDisplayObject('PoisonTip'),
                title: 'Poison Tip',
                description: 'Deal an additional 30 damage over 5 seconds.',
                collector: {
                    eventName: poisonKnifeCollectorEventName,
                    presentation: {
                        labels: ["Poison damage"],
                        formats: "fixed1"
                    }
                }
            },
            {
                name: 'multi throw',
                knives: 3,
                icon: graphicsUtils.createDisplayObject('MultiShot'),
                title: 'Multi-throw',
                description: 'Throw multiple knives in a fan.',
                systemMessage: 'Auxiliary knives deal half damage.',
                collector: {
                    eventName: multiThrowCollectorEventName,
                    presentation: {
                        labels: ["Auxiliary knife damage"],
                        formats: "fixed1"
                    }
                }
            },
            {
                name: 'friendly fire',
                duration: 6000,
                icon: graphicsUtils.createDisplayObject('FriendlyFireIcon'),
                title: 'Friendly Fire',
                description: ['Grant allies health/energy gems for 6 seconds', 'by hitting them with a knife.'],
                systemMessage: 'Health and energy gems are granted alternately.',
                collector: {
                    eventName: friendlyFireCollectorEventName,
                    presentation: {
                        labels: ["Gems granted"]
                    }
                }
            },
            {
                name: 'leftover shards',
                damage: 10,
                icon: graphicsUtils.createDisplayObject('LeftoverShardsIcon'),
                title: 'Leftover Shards',
                description: 'Knives leave behind shards, dealing 10 damage upon collision.',
                collector: {
                    eventName: leftoverShardsCollectorEventName,
                    presentation: {
                        labels: ["Shard damage"],
                        formats: "fixed1"
                    }
                }
            },
        ],
    });

    //Main Attack
    var hpCollectorEventName = 'hoodedPeepCollector';
    var fullAutoCollectorEventName = 'fullAutoCollector';
    var firstAidCollectorEventName = 'firstAidCollector';
    var cleaningKitCollectorEventName = 'cleaningKitCollector';
    var leadBulletsCollectorEventName = 'leadBulletsCollector';
    var gunAbility = new Ability({
        name: 'Rifle',
        manualDispatch: true,
        icon: graphicsUtils.createDisplayObject('M14Icon'),
        title: 'M14 Rifle',
        description: 'Deal damage to an enemy unit.',
        hotkey: 'A',
        activeAugment: null,
        enablers: [function(commandObj) {
            return marine.canAttack;
        }.bind(this)],
        augments: [{
                name: 'fully auto',
                delta: -120,
                icon: graphicsUtils.createDisplayObject('FullyAuto'),
                title: 'Full Auto',
                description: 'Increase rate of fire.',
                equip: function(unit) {
                    unit.cooldown += this.delta;
                },
                unequip: function(unit) {
                    unit.cooldown -= this.delta;
                }
            },
            {
                name: 'hooded peep',
                chance: 0.18,
                multiplier: 2,
                icon: graphicsUtils.createDisplayObject('HoodedPeepIcon'),
                title: 'Hooded Peep',
                description: 'Gain a 18% chance to deal 2x damage.',
                collector: {
                    eventName: hpCollectorEventName,
                    presentation: {
                        labels: ["Critical hits"],
                        values: ["value"]
                    }
                }
            },
            {
                name: 'first aid pouch',
                healAmount: 0.6,
                icon: graphicsUtils.createDisplayObject('FirstAidPouchIcon'),
                title: 'First Aid Pouch',
                description: '',
                updaters: {
                    descriptions: function() {
                        var sum = 0.6;
                        var addition = marine.firstAidPouchAdditions.forEach((addition) => {
                            sum += addition;
                        });
                        return {
                            index: 0,
                            value: 'Heal self and nearby allies for ' + sum.toFixed(1) + ' hp after firing rifle.'
                        };
                    }
                },
                collector: {
                    eventName: firstAidCollectorEventName,
                    presentation: {
                        labels: ["Healing done"],
                        values: ["value"],
                        formats: [function(v) {
                            return v.toFixed(1);
                        }]
                    }
                }
            },
            {
                name: 'cleaning kit',
                energyGrant: 0.3,
                icon: graphicsUtils.createDisplayObject('CleaningKitIcon'),
                title: 'Cleaning Kit',
                description: '',
                updaters: {
                    descriptions: function() {
                        var sum = 0.3;
                        var addition = marine.cleaningKitAdditions.forEach((addition) => {
                            sum += addition;
                        });
                        return {
                            index: 0,
                            value: 'Grant self and nearby allies ' + sum.toFixed(1) + ' energy after firing rifle.'
                        };
                    }
                },
                collector: {
                    eventName: cleaningKitCollectorEventName,
                    presentation: {
                        labels: ["Energy granted"],
                        values: ["value"],
                        formats: [function(v) {
                            return v.toFixed(1);
                        }]
                    }
                }
            },
            {
                name: 'lead bullets',
                armorSubtractor: 1,
                dodgeManipulator: 0.5,
                icon: graphicsUtils.createDisplayObject('LeadBulletsIcon'),
                title: 'Lead Bullets',
                description: 'Attacks bypass 50% of target\'s dodge and ignore up to 1 armor.',
                collector: {
                    eventName: leadBulletsCollectorEventName,
                    presentation: {
                        labels: ["Armor Ignored"],
                        values: ["value"],
                        formats: [function(v) {
                            return v.toFixed(1);
                        }]
                    }
                }
            },
        ],
    });

    var highlight = function(st) {
        return '<highlight>' + st + '</highlight>';
    }
    var markMultiText = function(st) {
        return '<st>' + st + '</st>';
    }
    var gsDDuration = 300;
    var gsADuration = 300;
    var allyArmorDuration = 7000;
    var armorGiven = 1.0;
    var allyHeal = 3;
    var allyEnergyHeal = 1;
    var passiveAllyPercentageHeal = 15;
    var givingSpirit = new Passive({
        title: 'Giving Spirit',
        getDefenseDescription: () => {
            return ['Defensive Mode (When hit)', markMultiText('Heal ally for ' + highlight(allyHeal) + ' hp and ' + highlight(allyEnergyHeal) + ' energy.')];
        },
        getAggressionDescription: () => {
            return ['Agression Mode (Upon kill)', markMultiText('Grant ally ' + highlight(armorGiven) + ' def for 7 seconds.')];
        },
        getUnequippedDescription: () => {
            return  ['Initial Boost (Upon camp start)', markMultiText('Heal ally for ' + highlight(passiveAllyPercentageHeal + '%') + ' of max hp.')];
        },
        textureName: 'PositiveMindset',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseDuration: gsDDuration,
        defenseCooldown: 2000,
        aggressionEventName: 'kill',
        aggressionDuration: gsADuration,
        aggressionCooldown: 4000,
        upgrade: function() {
            allyHeal += 3;
            allyEnergyHeal += 1;

            armorGiven += 1;

            passiveAllyPercentageHeal += 5;
        },
        passiveAction: function(event) {
            var allies = unitUtils.getUnitAllies(marine);
            allies.forEach((ally) => {
                var healthToGive = ally.maxHealth * (passiveAllyPercentageHeal / 100);
                ally.giveHealth(healthToGive, marine);
                unitUtils.applyHealthGainAnimationToUnit(ally);
                healsound.play();
            });
        },
        defenseAction: function(event) {
            var allies = unitUtils.getUnitAllies(marine);
            var healthGiven = 0;
            var energyGiven = 0;
            allies.forEach((ally) => {
                if (ally.isDead) return;

                healthGiven += ally.giveHealth(allyHeal, marine);
                unitUtils.applyHealthGainAnimationToUnit(ally);
                healsound.play();

                energyGiven += ally.giveEnergy(allyEnergyHeal, marine);
                gameUtils.doSomethingAfterDuration(() => {
                    unitUtils.applyEnergyGainAnimationToUnit(ally);
                    manaHealSound.play();
                }, 200);
            });

            return {
                value: {
                    health: healthGiven,
                    energy: energyGiven
                }
            };
        },
        aggressionAction: function(event) {
            var allies = unitUtils.getUnitAllies(marine);
            allies.forEach((ally) => {
                if (ally.isDead) return;
                var id = mathArrayUtils.getId();
                ally.applyDefenseBuff({
                    duration: allyArmorDuration,
                    amount: armorGiven
                });
            });

            return {
                value: armorGiven
            };
        },
        collector: {
            aggressionLabel: 'Total armor granted',
            defensiveLabel: 'Health/Energy granted',
            defensiveFormat: function(v) {
                return v.health.toFixed(1) + '/' + v.energy.toFixed(1);
            },
            _init: function() {
                this.defensePassive = {
                    health: 0,
                    energy: 0
                };
            },
            defenseCollectorFunction: function(event) {
                this.defensePassive.health += event.health;
                this.defensePassive.energy += event.energy;
            }
        }
    });

    var robDDuration = 1000;
    var robADuration = 4000;
    var robHeal = 10;
    var rushOfBlood = new Passive({
        title: 'Rush Of Blood',
        getDefenseDescription: () => {
            var secondText = robDDuration == 1000 ? ' second.' : ' seconds.';
            return ['Defensive Mode (Upon being healed)', 'Absorb 2x healing for ' + robDDuration/1000 + secondText];
        },
        getAggressionDescription: () => {
            return ['Agression Mode (Upon dealing damage)', 'Increase movement speed for ' + robADuration/1000 + ' seconds.'];
        },
        getUnequippedDescription: () => {
            return  ['Initial Boost (Upon camp start)', 'Gain ' + robHeal + '% of max hp.'];
        },
        textureName: 'RushOfBlood',
        unit: marine,
        defenseEventName: 'preReceiveHeal',
        defenseDuration: robDDuration,
        defenseCooldown: 5000,
        aggressionEventName: 'dealDamage',
        aggressionDuration: robADuration,
        aggressionCooldown: 4000,
        upgrade: function() {
            robDDuration += 500;
            this.defenseDuration += 500;

            robADuration += 1000;
            this.aggressionDuration += 1000;

            robHeal += 5;
        },
        passiveAction: function(event) {
            var healthToGive = marine.maxHealth / robHeal;
            marine.giveHealth(healthToGive, marine);
            unitUtils.applyHealthGainAnimationToUnit(marine);
            healsound.play();
        },
        defensePredicate: function(event) {
            return event.performingUnit.name != 'empty';
        },
        defenseAction: function(event) {
            var f = {};
            marine.applyBuff({
                id: "rushofbloodabsorb",
                textureName: 'RushOfBloodBuff',
                duration: robDDuration,
                applyChanges: function() {
                    f.handler = Matter.Events.on(marine, 'preReceiveHeal', function(event) {
                        event.healingObj.amount *= 2;
                    });
                },
                removeChanges: function() {
                    Matter.Events.off(marine, 'preReceiveHeal', f.handler);
                }
            });

            return {
                value: robDDuration / 1000
            };
        },
        aggressionAction: function(event) {
            marine.applySpeedBuff({
                id: 'rushofbloodspeedBuff',
                duration: robADuration,
                amount: 0.5
            });

            return {
                value: robADuration / 1000
            };
        },
        collector: {
            aggressionLabel: 'Duration of increased speed',
            aggressionSuffix: 'seconds',
            defensiveLabel: 'Duration of 2x heal absorption',
            defensiveSuffix: 'seconds',
        }
    });

    marine.grantFreeKnife = function(limit) {
        if (!marine.freeKnives) {
            marine.freeKnives = 0;
        }

        //limit... may need to rethink this
        // if (marine.freeKnives >= 2) {
        //     return;
        // }

        marine.applyBuff({
            id: 'freeKnife' + (marine.freeKnives + 1),
            textureName: 'FreeKnifeBuff',
            duration: null,
            applyChanges: function() {
                marine.freeKnives += 1;

                if (!marine.freeKinfeBuffs) {
                    marine.freeKinfeBuffs = [];
                }
                marine.freeKinfeBuffs.push('freeKnife' + marine.freeKnives);

                var ss = marine.getAbilityByName('Throw Knife');
                ss.manuallyEnabled = true;
                ss.byPassEnergyCost = true;
            },
            removeChanges: function() {
                mathArrayUtils.removeObjectFromArray('freeKnife' + marine.freeKnives, marine.freeKinfeBuffs);
                marine.freeKnives -= 1;
                if (marine.freeKnives == 0) {
                    var ss = marine.getAbilityByName('Throw Knife');
                    ss.manuallyEnabled = false;
                    ss.byPassEnergyCost = false;
                }
            }
        });
    };

    var kiEnrageAmount = 3;
    var kiDefenseDuration = 2000;
    var kiAggressionDuration = 4000;
    var kiKniveStart = 2;
    var killerInstinct = new Passive({
        title: 'Killer Instinct',
        getDefenseDescription: () => {
            return ['Defensive Mode (When hit)', 'Become enraged (+' + kiEnrageAmount + ') for ' + Math.trunc(kiDefenseDuration/1000) + ' seconds.'];
        },
        getAggressionDescription: () => {
            return ['Agression Mode (Upon dealing damage)', 'Maim enemy for ' + Math.trunc(kiAggressionDuration/1000) + ' seconds.'];
        },
        getUnequippedDescription: () => {
            return  ['Initial Boost (Upon camp start)', 'Gain ' + kiKniveStart + ' free knives.'];
        },
        textureName: 'KillerInstinct',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 3000,
        defenseDuration: kiDefenseDuration,
        aggressionEventName: 'dealNonLethalDamage',
        aggressionCooldown: 5000,
        upgrade: function() {
            kiEnrageAmount += 2;
            kiDefenseDuration += 1000;
            this.defenseDuration += 1000;

            kiAggressionDuration += 2000;

            kiKniveStart += 2;
        },
        passiveAction: function(event) {
            mathArrayUtils.repeatXTimes(() => {
                marine.grantFreeKnife();
            }, kiKniveStart);
        },
        defenseAction: function(event) {
            marine.enrage({
                duration: kiDefenseDuration,
                amount: kiEnrageAmount
            });

            let matterEvent = Matter.Events.on(marine, 'dealDamage', (event) => {
                if (event.attackContext.id == 'rifle') {
                    let subtractableDamage = event.eventSubtractableDamage;
                    let bonusDamage = Math.min(kiEnrageAmount, subtractableDamage);
                    event.eventSubtractableDamage -= bonusDamage;
                    this.createDefenseCollectorEvent({
                        value: bonusDamage
                    });
                }
            });

            this.removeDealDamage = () => {
                Matter.Events.off(marine, 'dealDamage', matterEvent);
            };
        },
        defenseStopAction: function() {
            if (this.removeDealDamage) {
                this.removeDealDamage();
            }
        },
        aggressionAction: function(event) {
            var targetUnit = event.sufferingUnit;
            targetUnit.maim({
                duration: kiAggressionDuration
            });

            return {
                value: 1
            };
        },
        collector: {
            aggressionLabel: 'Targets maimed',
            defensiveLabel: 'Addtl. damage from enrage'
        }
    });

    var cpADuration = 4000;
    var cpRange = 180;
    var vpKnives = 1;
    var vpPassiveDuration = 10000;
    var clearPerspective = new Passive({
        title: 'Clear Perspective',
        getDefenseDescription: () => {
            let knifeText = vpKnives == 1 ? ' knife' : ' knives';
            return ['Defensive Mode (When hit by projectile)', 'Throw ' + vpKnives + knifeText + ' in attacker\'s direction.'];
        },
        getAggressionDescription: () => {
            return ['Agression Mode (Upon dealing damage)', 'Add ' + cpRange + ' to rifle range for ' + Math.trunc(cpADuration/1000) + ' seconds.'];
        },
        getUnequippedDescription: () => {
            return  ['Initial Boost (Upon camp start)', 'Add ' + cpRange + ' to rifle range for ' + vpPassiveDuration/1000 + ' seconds.'];
        },
        textureName: 'ClearPerspective',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 4000,
        aggressionEventName: 'dealDamage',
        aggressionCooldown: 4000,
        aggressionDuration: cpADuration,
        upgrade: function() {
            vpKnives += 1;

            cpRange += 70;
            cpADuration += 1000;
            this.aggressionDuration += 1000;

            vpPassiveDuration += 4000;
        },
        passiveAction: function(event) {
            var currentRange = marine.range;
            marine.applyRangeBuff({
                duration: vpPassiveDuration,
                amount: currentRange
            });
        },
        defensePredicate: function(event) {
            return event.attackContext.isProjectile;
        },
        defenseAction: function(event) {
            let delay = 0;
            mathArrayUtils.repeatXTimes(() => {
                gameUtils.doSomethingAfterDuration(() => {
                    marine.getAbilityByName('Throw Knife').method.call(marine, event.performingUnit.position);
                }, delay);
                delay += 100;
            }, vpKnives);

            return {
                value: vpKnives
            };
        },
        aggressionAction: function(event) {
            marine.applyRangeBuff({
                duration: cpADuration,
                amount: cpRange
            });

            return {
                value: cpADuration / 1000
            };
        },
        collector: {
            aggressionLabel: 'Duration of increased range',
            aggressionSuffix: 'seconds',
            defensiveLabel: 'Knives thrown'
        }
    });

    var ssDDuration = 4000;
    var ssADuration = 1000;
    var spiritualState = new Passive({
        title: 'Spiritual State',
        getDefenseDescription: () => {
            return ['Defensive Mode (When hit by projectile)', 'Self and allies gain an energy gem for ' + Math.trunc(ssDDuration/1000) + ' seconds.'];
        },
        getAggressionDescription: () => {
            var secondText = ssADuration == 1000 ? ' second.' : ' seconds.';
            return ['Agression Mode (Upon being healed)', 'Gain 1 energy for every 1 hp recieved from healing for ' + ssADuration/1000 + secondText];
        },
        getUnequippedDescription: () => {
            return  ['Initial Boost (Upon camp start)', 'Self and allies gain an energy gem for ' + Math.trunc(ssDDuration/1000) + ' seconds.'];
        },
        textureName: 'SpiritualState',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 5000,
        defenseDuration: ssDDuration,
        aggressionEventName: 'preReceiveHeal',
        aggressionCooldown: 6000,
        aggressionDuration: ssADuration,
        upgrade: function() {
            ssDDuration += 2000;
            this.aggressionDuration += 2000;

            ssADuration += 500;
            this.aggressionDuration += 500;
        },
        passiveAction: function(event) {
            var alliesAndSelf = unitUtils.getUnitAllies(marine, true);
            alliesAndSelf.forEach((unit) => {
                unit.applyEnergyGem({
                    id: "spiritualStateGain",
                    duration: ssDDuration
                });
            });
        },
        defensePredicate: function(event) {
            return event.attackContext.isProjectile;
        },
        defenseAction: function(event) {
            var alliesAndSelf = unitUtils.getUnitAllies(marine, true);
            alliesAndSelf.forEach((unit) => {
                unit.applyBuff({
                    id: "spiritualStateGain",
                    textureName: 'SpiritualStateEnergyGainBuff',
                    duration: ssDDuration,
                    applyChanges: function() {
                        unit.energyRegenerationMultiplier *= 2;
                    },
                    removeChanges: function() {
                        unit.energyRegenerationMultiplier /= 2;
                    }
                });
            });

            return {
                value: ssDDuration / 1000
            };
        },
        aggressionPredicate: function(event) {
            return event.performingUnit.name != 'empty';
        },
        aggressionAction: function(event) {
            var f = {};
            var energyGained = null;
            marine.applyBuff({
                id: "spiritualStateMatch",
                duration: ssADuration,
                textureName: 'SpiritualStateBuff',
                applyChanges: function() {
                    f.handler = Matter.Events.on(marine, 'receiveHeal', function(event) {
                        energyGained = marine.giveEnergy(event.amountDone);
                        Matter.Events.trigger(globals.currentGame, 'SpiritualStateCollector', {
                            mode: 'attackPassive',
                            collectorPayload: {
                                value: energyGained
                            }
                        });
                    });
                },
                removeChanges: function() {
                    Matter.Events.off(marine, 'receiveHeal', f.handler);
                }
            });
        },
        collector: {
            aggressionLabel: 'Energy gained',
            aggressionFormat: function(v) {
                return v.toFixed(1);
            },
            defensiveLabel: 'Duration of health gem',
            defensiveSuffix: 'seconds'
        }
    });

    var trueGritGain = 1;
    var trueGritCap = 20;
    var passiveGritGain = 4;
    var trueGritAfflictDuration = 5000;
    var trueGrit = new Passive({
        title: 'True Grit',
        getDefenseDescription: () => {
            return ['Defensive Mode (When hit)', 'Grant self and allies ' + trueGritGain + ' grit for length of excursion.'];
        },
        getAggressionDescription: () => {
            return ['Agression Mode (Upon rifle attack)', 'Afflict target for ' + trueGritAfflictDuration/1000 + ' seconds.'];
        },
        getUnequippedDescription: () => {
            return  ['Initial Boost (Upon camp start)', 'Self and allies gain ' + passiveGritGain + ' grit for length of excursion.'];
        },
        textureName: 'TrueGrit',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 6000,
        aggressionEventName: 'preDealDamage',
        aggressionCooldown: 5000,
        upgrade: function() {
            trueGritGain += 1;
            trueGritAfflictDuration += 2000;
            passiveGritGain += 3;
        },
        passiveAction: function(event) {
            var alliesAndSelf = unitUtils.getUnitAllies(marine, true);
            alliesAndSelf.forEach((unit) => {
                if (unit.isDead) {
                    return;
                }
                unit.addGritAddition(passiveGritGain);
                gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', function() {
                    unit.removeGritAddition(passiveGritGain);
                });
            });
        },
        defenseAction: function(event) {
            var alliesAndSelf = unitUtils.getUnitAllies(marine, true);
            alliesAndSelf.forEach((unit) => {
                if (unit.isDead) {
                    return;
                }
                var gritUp = graphicsUtils.addSomethingToRenderer("GritBuff", {
                    where: 'stageTwo',
                    position: unit.position
                });
                gameUtils.attachSomethingToBody({
                    something: gritUp,
                    body: unit.body
                });
                graphicsUtils.floatSprite(gritUp, {
                    direction: 1,
                    runs: 50
                });
                unit.addGritAddition(trueGritGain);
                gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', function() {
                    unit.removeGritAddition(trueGritGain);
                });
            });

            return {
                value: trueGritGain * 2
            };
        },
        aggressionPredicate: function(event) {
            return event.attackContext.id == 'rifle';
        },
        aggressionAction: function(event) {
            var sufferingUnit = event.sufferingUnit;
            sufferingUnit.afflict({
                duration: trueGritAfflictDuration,
                afflictingUnit: marine,
                id: 'trueGrit'
            });
        },
        collector: {
            aggressionLabel: 'Health gained',
            attackCollectorFunction: function(event) {
                this.attackPassive.healthGained += event.healthGained || 0;
                this.attackPassive.blocksGained += event.blocksGained || 0;
            },
            aggressionFormat: function(v) {
                return v.healthGained.toFixed(1);
            },
            collectorManipulator: function(collector) {
                //copy the defensive values
                collector.presentation.labels.push(collector.presentation.labels[1]);
                collector.presentation.suffixes.push(collector.presentation.suffixes[1]);
                collector.presentation.formats.push(collector.presentation.formats[1]);
                collector.presentation.values.push(collector.presentation.values[1]);

                //redo the [1] entry to be the second aggression label
                collector.presentation.labels[1] = 'Blocks gained';
                collector.presentation.suffixes[1] = '';
                collector.presentation.values[1] = 'attackPassive';
                collector.presentation.formats[1] = function(v) {
                    return v.blocksGained.toFixed(1);
                };

                collector.presentation.customVariableLabels = function(attackMode, newCollector) {
                    if(attackMode) {
                        newCollector.presentation.variableLabels[0] = collector.presentation.labels[0];
                        newCollector.presentation.variableLabels[1] = collector.presentation.labels[1];
                    } else {
                        newCollector.presentation.variableLabels[2] = collector.presentation.labels[2];
                    }
                };
            },
            _init: function() {
                this.presentation.variableLabels.push('none');
                this.canPresent = function() {
                    return !(this.presentation.variableLabels[0] == "none" && this.presentation.variableLabels[1] == "none" && this.presentation.variableLabels[2] == "none");
                };

                let eventName = this.eventName;
                this.healthHandler = Matter.Events.on(marine, 'afflictHealthGain', (event) => {
                    if (event.id == 'trueGrit') {
                        let payload = {
                            collectorPayload: {
                                value: {
                                    healthGained: event.healthGained,
                                }
                            },
                            mode: 'attackPassive'
                        };
                        Matter.Events.trigger(globals.currentGame, eventName, payload);
                    }
                });

                this.blockHandler = Matter.Events.on(marine, 'afflictBlockGain', (event) => {
                    if (event.id == 'trueGrit') {
                        let payload = {
                            collectorPayload: {
                                value: {
                                    blocksGained: 1,
                                }
                            },
                            mode: 'attackPassive'
                        };
                        Matter.Events.trigger(globals.currentGame, eventName, payload);
                    }
                });

                this.attackPassive = {
                    healthGained: 0,
                    blocksGained: 0
                };
            },
            _onStop: function() {
                Matter.Events.off(marine, 'afflictHealthGain', this.healthHandler);
                Matter.Events.off(marine, 'afflictBlockGain', this.blockHandler);
            },
            defensiveLabel: 'Grit granted'
        }
    });

    var unitProperties = $.extend({
        unitType: 'Marine',
        health: 75,
        defense: 1,
        energy: 20,
        // grit: 2,
        energyRegenerationRate: 0.5,
        healthRegenerationRate: 1,
        friendlyFireApply: 'health',
        portrait: graphicsUtils.createDisplayObject('MarinePortrait'),
        wireframe: graphicsUtils.createDisplayObject('MarineGroupPortrait'),
        graveSpriteName: 'MarineGrave',
        damageScale: 60,
        team: options.team || 4,
        priority: 10,
        dodgeSound: dodgeSound,
        holdPositionSound: holdPositionSound,
        consumeSound: yeahsound,
        hitboxWidth: 34,
        hitboxHeight: 68,
        adjustHitbox: false,
        animationSpecificHitboxes: [{
                animation: walkAnimations.down,
                height: 8,
                width: 48,
                offset: {
                    x: -6,
                    y: -10
                }
            },
            {
                animation: walkAnimations.up,
                height: 8,
                width: 50,
                offset: {
                    x: 2,
                    y: -10
                }
            },
            {
                animation: walkAnimations.upRight,
                height: 8,
                width: 50,
                offset: {
                    x: 0,
                    y: -15
                }
            },
            {
                animation: walkAnimations.upLeft,
                height: 8,
                width: 50,
                offset: {
                    x: 0,
                    y: -15
                }
            },
            {
                animation: walkAnimations.downRight,
                height: 8,
                width: 50,
                offset: {
                    x: 0,
                    y: -15
                }
            },
            {
                animation: walkAnimations.downLeft,
                height: 8,
                width: 50,
                offset: {
                    x: 0,
                    y: -15
                }
            },
            {
                animation: attackAnimations.left,
                height: 8,
                width: 35,
                offset: {
                    x: -16,
                    y: -18
                }
            },
            {
                animation: attackAnimations.right,
                height: 8,
                width: 35,
                offset: {
                    x: 16,
                    y: -18
                }
            },
            {
                animation: attackAnimations.downRight,
                height: 8,
                width: 38,
                offset: {
                    x: -2,
                    y: -13
                }
            },
            {
                animation: attackAnimations.downLeft,
                height: 8,
                width: 38,
                offset: {
                    x: 2,
                    y: -13
                }
            },
            {
                animation: attackAnimations.upRight,
                height: 16,
                width: 35,
                offset: {
                    x: -2,
                    y: -22
                }
            },
            {
                animation: attackAnimations.upLeft,
                height: 16,
                width: 35,
                offset: {
                    x: 2,
                    y: -22
                }
            }
        ],
        itemsEnabled: true,
        frameTint: 0xd22121,
        name: options.name,
        heightAnimation: 'up',
        // skinTweak: {r: 0.5, g: 3.0, b: 0.5, a: 1.0},
        throwAnimations: throwAnimations,
        abilities: [gunAbility, dashAbility, knifeAbility],
        passiveAbilities: [givingSpirit, rushOfBlood, spiritualState, killerInstinct, clearPerspective, trueGrit],
        death: function() {
            var self = this;
            var anim = gameUtils.getAnimation({
                spritesheetName: 'MarineAnimations1',
                animationName: 'MarineDeath',
                speed: 0.25,
                fadeAway: true,
                fadeTime: 3200,
                transform: [self.deathPosition.x, self.deathPosition.y, 1, 1]
            });
            graphicsUtils.addSomethingToRenderer(anim);
            this.corpse = anim;

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

            anim.play();
            deathSound.play();
            deathSoundBlood.play();
            return [shadow, anim];
        },
        _init: function() {
            this.firstAidPouchAdditions = [];
            this.cleaningKitAdditions = [];
            if (!this.bypassRevival) {
                $.extend(this, rv);
                this.revivableInit();
            }

            $.extend(this, aug);
            this.unlockerInit();

            //randomize initial augments
            this.abilities.forEach((ability) => {
                ability.addRandomAugment();
                // ability.addAllPendingAugments();
            });

        }
    }, options);

    return UC({
        givenUnitObj: marine,
        renderChildren: rc,
        radius: options.radius || 25,
        mass: options.mass || 8,
        mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
        slaves: [dashSound, dodgeSound, knifeBreakSound, shockSound, holdPositionSound, deathSound, deathSoundBlood, fireSound, knifeThrowSound, knifeImpactSound,
            poisonSound, criticalHitSound, yeahsound, healsound, manaHealSound, unitProperties.wireframe, unitProperties.portrait
        ],
        unit: unitProperties,
        moveable: {
            moveSpeed: 2.35,
            walkAnimations: walkAnimations,
        },
        attacker: {
            attackAnimations: attackAnimations,
            cooldown: 650,
            honeRange: 300,
            range: 180,
            damage: 10,
            attack: function(target) {
                //get current augment
                var thisAbility = this.getAbilityByName('Rifle');
                var hoodedPeepAugment = thisAbility.isAugmentEnabled('hooded peep');
                var firstAidPouchAugment = thisAbility.isAugmentEnabled('first aid pouch');
                var cleaningKitAugment = thisAbility.isAugmentEnabled('cleaning kit');
                var leadBulletsAugment = thisAbility.isAugmentEnabled('lead bullets');

                var crit = 1;
                var critActive = false;
                if (hoodedPeepAugment) {
                    if (Math.random() < hoodedPeepAugment.chance) {
                        crit = hoodedPeepAugment.multiplier;
                        critActive = true;
                    }
                }

                var self = this;
                if (firstAidPouchAugment) {
                    unitUtils.applyToUnitsByTeam(function(team) {
                        return self.team == team;
                    }, function(unit) {
                        return mathArrayUtils.distanceBetweenUnits(self, unit) <= 500;
                    }, function(unit) {
                        unitUtils.applyHealthGainAnimationToUnit(unit);
                        healsound.play();
                        let sum = mathArrayUtils.getSumOfArrayOfValues(self.firstAidPouchAdditions);
                        var amountHealed = unit.giveHealth(firstAidPouchAugment.healAmount + sum, self);
                        Matter.Events.trigger(globals.currentGame, firstAidCollectorEventName, {
                            value: amountHealed
                        });
                    });
                }

                if (cleaningKitAugment) {
                    unitUtils.applyToUnitsByTeam(function(team) {
                        return self.team == team;
                    }, function(unit) {
                        return mathArrayUtils.distanceBetweenUnits(self, unit) <= 500;
                    }, function(unit) {
                        unitUtils.applyEnergyGainAnimationToUnit(unit);
                        healsound.play();
                        var sum = mathArrayUtils.getSumOfArrayOfValues(self.cleaningKitAdditions);
                        var amountGranted = unit.giveEnergy(cleaningKitAugment.energyGrant + sum, self);
                        Matter.Events.trigger(globals.currentGame, cleaningKitCollectorEventName, {
                            value: amountGranted
                        });
                    });
                }

                var dTotal = this.damage + this.getDamageAdditionSum();
                var returnInfo = target.sufferAttack(dTotal, this, {
                    id: 'rifle',
                    damageMultiplier: crit,
                    armorSubtractor: leadBulletsAugment ? leadBulletsAugment.armorSubtractor : 0,
                    dodgeManipulator: function(dodge) {
                        return dodge * (leadBulletsAugment ? leadBulletsAugment.dodgeManipulator : 1);
                    }
                });

                if (leadBulletsAugment) {
                    Matter.Events.trigger(globals.currentGame, leadBulletsCollectorEventName, {
                        value: returnInfo.armorIgnored
                    });
                }

                if (critActive && returnInfo.attackLanded) {
                    Matter.Events.trigger(globals.currentGame, hpCollectorEventName, {
                        value: 1
                    });
                    fireSound.play();
                    criticalHitSound.play();
                    var chText = graphicsUtils.floatText(returnInfo.rawDamage + '!', {
                        x: target.position.x,
                        y: target.position.y - 15
                    }, {
                        style: styles.critHitText
                    });
                } else {
                    fireSound.play();
                }
                var abilityTint = 0x80ba80;
                graphicsUtils.makeSpriteBlinkTint({
                    sprite: this.getAbilityByName('Rifle').icon,
                    tint: abilityTint,
                    speed: 100
                });

                //play rifle bullet animation
                var scale = leadBulletsAugment ? 0.55 : 0.55;
                var variance2 = Math.random() * 0.5 - 0.25;
                var nonOrganicRifleAnimation = gameUtils.getAnimation({
                    spritesheetName: 'MarineAnimations1',
                    animationName: 'rifle',
                    speed: 0.85,
                    transform: [target.position.x + variance2, target.position.y + variance2, scale, scale]
                });
                nonOrganicRifleAnimation.tint = leadBulletsAugment ? 0x64cdfa : 0xfbffc9;
                nonOrganicRifleAnimation.play();
                nonOrganicRifleAnimation.rotation = Math.random() * Math.PI;
                graphicsUtils.addSomethingToRenderer(nonOrganicRifleAnimation, 'foreground');

                if (target.organic) {
                    //play blood animation
                    var variance = Math.random() * 0.25;
                    var bloodAnimation1 = gameUtils.getAnimation({
                        spritesheetName: 'UtilityAnimations1',
                        animationName: 'rifleSlash',
                        speed: 0.24,
                        transform: [target.position.x, target.position.y, 0.22 + variance, 0.22 + variance]
                    });
                    bloodAnimation1.play();
                    bloodAnimation1.rotation = Math.random() * Math.PI;
                    graphicsUtils.addSomethingToRenderer(bloodAnimation1, 'foreground');

                    var bloodAnimation2 = gameUtils.getAnimation({
                        spritesheetName: 'UtilityAnimations1',
                        animationName: 'rifleSlash',
                        speed: 0.18,
                        transform: [target.position.x, target.position.y, 0.1 + variance, 0.1 + variance]
                    });
                    bloodAnimation2.play();
                    bloodAnimation2.rotation = Math.random() * Math.PI;
                    graphicsUtils.addSomethingToRenderer(bloodAnimation2, 'foreground');
                }
            },
        },
    });
}
