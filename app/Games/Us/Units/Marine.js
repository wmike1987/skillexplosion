import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import Passive from '@core/Unit/UnitPassive.js';
import rv from '@core/Unit/_Revivable.js';
import styles from '@utils/Styles.js';
import {globals} from '@core/Fundamental/GlobalState';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/GameUtils.js';

export default function Marine(options) {
    var marine = {};

    options = options || {};

    //animation settings
    var walkSpeed = 0.9;
    var walkSpeedBonus = 0.25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources.marineN.spineData);
    var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources.marineS.spineData);
    var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources.marineW.spineData);
    var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources.marineW.spineData);
    var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources.marineSW.spineData);
    var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources.marineSW.spineData);
    var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources.marineNW.spineData);
    var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources.marineNW.spineData);

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
            speed: 2,
            times: 3,
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'shoot',
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

    var sc = {x: 0.35, y: 0.35};
    var adjustedUpsc = {x: 0.37, y: 0.37};
    var adjustedDownsc = {x: 0.37, y: 0.37};
    var flipsc = {x: -1 * sc.x, y: sc.y};
    var yOffset = 22;
    var sortYOffset = 0;
    var rc = [
    {
        id: 'selected',
        data: 'IsometricSelected',
        scale: {x: 0.55, y: 0.55},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 20},
    },
    {
        id: 'selectionPending',
        data: unitUtils.getPendingAnimation(),
        scale: {x: 0.35, y: 0.35},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 20},
    },{
        id: 'left',
        data: spineWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset},
        sortYOffset: sortYOffset,
    },{
        id: 'right',
        data: spineEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset},
        sortYOffset: sortYOffset,
    },
    {
        id: 'up',
        data: spineNorth,
        scale: adjustedUpsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset-2},
        sortYOffset: sortYOffset,
    },
    {
        id: 'down',
        data: spineSouth,
        scale: adjustedDownsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset-2},
        sortYOffset: sortYOffset,
    },
    {
        id: 'upLeft',
        data: spineNorthWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset},
        sortYOffset: sortYOffset,
    },
    {
        id: 'upRight',
        data: spineNorthEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset},
        sortYOffset: sortYOffset,
    },
    {
        id: 'downRight',
        data: spineSouthEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset},
        sortYOffset: sortYOffset,
    }, {
        id: 'downLeft',
        data: spineSouthWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset},
        sortYOffset: sortYOffset,
    },{
        id: 'shadow',
        data: 'IsoShadowBlurred',
        scale: {x: 0.55, y: 0.55},
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 20}}];

    var fireSound = gameUtils.getSound('machinegun.wav', {volume: 0.002, rate: 3});
    var poisonSound = gameUtils.getSound('poisonhit1.wav', {volume: 0.01, rate: 0.6});

    //crit
    var criticalHitSound = gameUtils.getSound('criticalhit.wav', {volume: 0.03, rate: 1.0});

    //death
    var deathSound = gameUtils.getSound('marinedeathsound.wav', {volume: 0.2, rate: 1.0});
    var deathSoundBlood = gameUtils.getSound('marinedeathbloodsound.wav', {volume: 0.06, rate: 1.2});

    //other
    var healsound = gameUtils.getSound('healsound.wav', {volume: 0.006, rate: 1.3});
    var yeahsound = gameUtils.getSound('shaneyeah.wav', {volume: 0.1, rate: 1.0});

    //Dash
    var dashVelocity = 0.8;
    var dashSound = gameUtils.getSound('dashsound2.wav', {volume: 0.04, rate: 1.2});
    var dash = function(destination, commandObj) {
        //get current augment
        var thisAbility = this.getAbilityByName('Dash');
        var defensivePostureAugment = thisAbility.isAugmentEnabled('defensive posture');
        var deathWishAugment = thisAbility.isAugmentEnabled('death wish');

        this.stop(null, {peaceful: true}); //stop any movement
        this.moveSpeedAugment = this.moveSpeed;
        this.body.frictionAir = 0.2;
        var velocityVector = Matter.Vector.sub(destination, this.position);
        var velocityScaled = dashVelocity / Matter.Vector.magnitude(velocityVector);
        Matter.Body.applyForce(this.body, this.position, {x: velocityScaled * velocityVector.x, y: velocityScaled * velocityVector.y});
        dashSound.play();
        Matter.Events.trigger(globals.currentGame, 'dash', {performingUnit: this});
        Matter.Events.trigger(this, 'dash');

        //play animation
        var dashAnimation = gameUtils.getAnimation({
            spritesheetName: 'MarineAnimations1',
            animationName: 'dash',
            speed: 0.3,
            transform: [this.position.x, this.position.y, 3.5, 2.5]
        });

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
                if(self.commandQueue.getCurrentCommand().id == commandObj.command.id) {
                    //only stop if we're still on the current dash command
                    self.stop();
                }
                if(self.commandQueue.getCurrentCommand().id == 'empty' || self.commandQueue.getCurrentCommand().method.name == 'throwKnife') {
                    //if we're a knife or empty, become on alert
                    self._becomeOnAlert();
                }

                commandObj.command.done();
            }
        });

        var defensivePostureGain = 2;
        if(defensivePostureAugment) {
            marine.applyBuff({name: "defpostbuff", textureName: 'DefensiveBuff', duration: 3000, applyChanges: function() {
                self.addDefenseAddition(defensivePostureGain);
            }, removeChanges: function() {
                self.removeDefenseAddition(defensivePostureGain);
            }});
        }

        if(deathWishAugment) {
            marine.applyBuff({name: "deathwishbuff", textureName: 'DeathWishBuff', duration: 2000, applyChanges: function() {
                self.damage += 3;
            }, removeChanges: function() {
                self.damage -= 3;
            }});
        }
        gameUtils.deathPact(this, self.dashTimer, 'dashDoneTimer');
    };

    var vrHpCost = 2.5;
    var vrECost = 1;
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
        augments: [
            {
                name: 'vital reserves',
                icon: graphicsUtils.createDisplayObject('VitalReserves'),
                title: 'Vital Reserves',
                description: ['Decrease energy cost by ' + vrECost,  'Add ' + vrHpCost + ' hp to cost.'],
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
                },
                unequip: function(unit) {
                    this.ability.energyCost += vrECost;
                    this.ability.enablers.splice(this.ability.enablers.indexOf(this.ability.hpEnable), 1);
                    this.ability.costs.splice(this.ability.costs.indexOf(this.ability.hpCost), 1);
                    this.ability.customCostTextUpdater = null;
                }
            },
            {
                name: 'defensive posture',
                icon: graphicsUtils.createDisplayObject('DefensivePosture'),
                title: 'Defensive Posture',
                description: 'Gain 2 defense upon dashing for 3 seconds.'
            },
            {
                name: 'death wish',
                icon: graphicsUtils.createDisplayObject('DeathWish'),
                title: 'Death Wish',
                description: 'Increase damage by 3 upon dashing for 2 seconds.'
            },
        ],
    });

    //Knife
    var knifeThrowSound = gameUtils.getSound('knifethrow.wav', {volume: 0.03, rate: 1.5});
    var knifeImpactSound = gameUtils.getSound('knifeimpact.wav', {volume: 0.05, rate: 1});
    var knifeSpeed = 22;
    marine.knifeDamage = 15;
    var throwKnife = function(destination, commandObj, childKnife) {
        //get augments
        var thisAbility = this.getAbilityByName('Throw Knife');
        var multiThrowAugment = thisAbility.isAugmentEnabled('multi throw');
        var pierceAugment = thisAbility.isAugmentEnabled('pierce');
        var poisonTipAugment = thisAbility.isAugmentEnabled('poison tip');

        if(!childKnife && multiThrowAugment) {
            var perpVector = Matter.Vector.normalise(Matter.Vector.perp(Matter.Vector.sub(destination, this.position)));
            var start = (multiThrowAugment.knives-1)/-2;
            var spacing = 25;
            for(var n = start; n < start + multiThrowAugment.knives; n++) {
                if(n == 0) continue;
                thisAbility.method.call(this, Matter.Vector.add(destination, Matter.Vector.mult(perpVector, n*spacing)), null, true);
            }
        }

        //create knife body
        var knife = Matter.Bodies.circle(0, 0, 6, {
            restitution: 0.95,
            frictionAir: 0,
            mass: options.mass || 5,
            isSensor: true
        });

        if(pierceAugment) {
            knife.lives = pierceAugment.lives;
        }

        Matter.Body.setPosition(knife, this.position);
        var knifeTint = 0xFFFFFF;
        if(poisonTipAugment) {
            knifeTint = 0x009933;
        }
        if(pierceAugment) {
            knifeTint = 0x6666ff;
        }
        if(pierceAugment && poisonTipAugment) {
            knifeTint = 0xe88a1b;
        }
        knife.renderChildren = [{
            id: 'knife',
            data: 'ThrowingDaggerBase',
            scale: {x: 0.7, y: 0.7},
            rotate: mathArrayUtils.pointInDirection(knife.position, destination),
        },
        {
            id: 'knifeblade',
            data: 'ThrowingDaggerBlade',
            scale: {x: 0.7, y: 0.7},
            rotate: mathArrayUtils.pointInDirection(knife.position, destination),
            tint: knifeTint,
        },
        {
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: {x: 1/8, y: 2},
            offset: {x: 15, y: 20},
            rotate: mathArrayUtils.pointInDirection(knife.position, destination),
            stage: "stageNTwo",
        }];
        globals.currentGame.addBody(knife);

        //send knife
        knifeThrowSound.play();
        knife.deltaTime = this.body.deltaTime;
        knife.destination = destination;
        gameUtils.sendBodyToDestinationAtSpeed(knife, destination, knifeSpeed, true, true);
        var removeSelf = globals.currentGame.addTickCallback(function() {
            if(gameUtils.bodyRanOffStage(knife)) {
                globals.currentGame.removeBody(knife);
            }
        });
        gameUtils.deathPact(knife, removeSelf);

        //play spine animation
        this.isoManager.playSpecifiedAnimation('throw', gameUtils.isoDirectionBetweenPositions(this.position, destination), {movePrecedence: true});

        var self = this;
        Matter.Events.on(knife, 'onCollide', function(pair) {
            var otherBody = pair.pair.bodyB == knife ? pair.pair.bodyA : pair.pair.bodyB;
            var otherUnit = otherBody.unit;
            if(otherUnit != this && otherUnit && otherUnit.canTakeAbilityDamage && otherUnit.team != this.team) {
                if(poisonTipAugment) {
                    knife.poisonTimer = globals.currentGame.addTimer({
                        name: 'poisonTimer' + knife.id,
                        runs: poisonTipAugment.seconds*2,
                        killsSelf: true,
                        timeLimit: 500,
                        callback: function() {
                            if(otherUnit.isDead) {
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
                            poisonAnimation.rotation = Math.random() * Math.PI*2;
                            graphicsUtils.addSomethingToRenderer(poisonAnimation, 'stageOne');
                            poisonAnimation.play();
                            otherUnit.sufferAttack(poisonTipAugment.damage/(poisonTipAugment.seconds*2), self);
                        }
                    });
                }

                otherUnit.sufferAttack(marine.knifeDamage, self); //we can make the assumption that a body is part of a unit if it's attackable
                if(otherUnit.isDead) {
                    Matter.Events.trigger(this, 'knifeKill');
                    Matter.Events.trigger(globals.currentGame, 'knifeKill', {performingUnit: this});
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
                if(pierceAugment) {
                    knife.lives -= 1;
                    if(knife.lives == 0) {
                        globals.currentGame.removeBody(knife);
                    }
                } else {
                    globals.currentGame.removeBody(knife);
                }
            }

            if(otherBody.isMine) {
                Matter.Events.trigger(this, 'knifeMine');
                otherBody.explode();
            }
        }.bind(this));

        if(commandObj) {
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

        Matter.Events.trigger(globals.currentGame, 'knifeThrow', {performingUnit: this});
        Matter.Events.trigger(this, 'knifeThrow');
    };
    var knifeAbility = new Ability({
        name: 'Throw Knife',
        key: 'f',
        type: 'click',
        icon: graphicsUtils.createDisplayObject('KnifeIcon'),
        method: throwKnife,
        title: 'Throwing Knife',
        description: 'Throw a knife, dealing ' + marine.knifeDamage + ' damage.',
        updaters: {descriptions: function() {
            return {index: 0, value: 'Throw a knife, dealing ' + marine.knifeDamage + ' damage.'};
        }},
        hotkey: 'F',
        energyCost: 6,
        activeAugment: null,
        enablers: [function(commandObj) {
            return marine.canAttack;
        }.bind(this)],
        augments: [
            {
                name: 'pierce',
                lives: 4,
                icon: graphicsUtils.createDisplayObject('PiercingKnife'),
                title: 'Piercing Blow',
                description: 'Pierce 4 enemies with a single knife.'
            },
            {
                name: 'poison tip',
                seconds: 5,
                damage: 30,
                icon: graphicsUtils.createDisplayObject('PoisonTip'),
                title: 'Poison Tip',
                description: 'Deal an additional 30 damage over 5 seconds.'
            },
            {
                name: 'multi throw',
                knives: 3,
                icon: graphicsUtils.createDisplayObject('MultiShot'),
                title: 'Multi-throw',
                description: 'Throw multiple knives in a fan.'
            },
        ],
    });

    //Main Attack
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
        augments: [
            {
                name: 'fully auto',
                delta: -100,
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
                chance: 0.2,
                multiplier: 2,
                icon: graphicsUtils.createDisplayObject('HoodedPeepIcon'),
                title: 'Hooded Peep',
                description: 'Gain a 20% chance to deal 2x damage.'
            },
            {
                name: 'first aid pouch',
                healAmount: 3,
                icon: graphicsUtils.createDisplayObject('FirstAidPouchIcon'),
                title: 'First Aid Pouch',
                description: 'Heal self and nearby allies for 3 hp after firing rifle.'
            },
        ],
    });

    var gsDDuration = 300;
    var gsADuration = 300;
    var allyArmorDuration = 15000;
    var givingSpirit = new Passive({
        title: 'Giving Spirit',
        defenseDescription: ['Defensive Mode (When hit)', 'Heal ally for 4 hp.'],
        aggressionDescription: ['Agression Mode (Upon kill)', 'Grant ally 2 def for 15s.'],
        textureName: 'PositiveMindset',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseDuration: gsDDuration,
        defenseCooldown: 1000,
        aggressionEventName: 'kill',
        aggressionDuration: gsADuration,
        aggressionCooldown: 2000,
        defenseAction: function(event) {
            var allies = gameUtils.getUnitAllies(marine);
            allies.forEach((ally) => {
                if(ally.isDead) return;
                ally.giveHealth(6, marine);
                graphicsUtils.applyGainAnimationToUnit(ally, 0xc60006);
                healsound.play();
            });
        },
        aggressionAction: function(event) {
            var allies = gameUtils.getUnitAllies(marine);
            allies.forEach((ally) => {
                if(ally.isDead) return;
                var id = mathArrayUtils.getId();
                ally.applyBuff({name: "givingSpiritDefBuff" + id, textureName: 'DefensiveBuff', duration: allyArmorDuration, applyChanges: function() {
                    ally.addDefenseAddition(2);
                }, removeChanges: function() {
                    ally.removeDefenseAddition(2);
                }});
            });
        },
    });

    var robDDuration = 2000;
    var robADuration = 4000;
    var rushOfBlood = new Passive({
        title: 'Rush Of Blood',
        defenseDescription: ['Defensive Mode (Upon hold position)', 'Absorb 2x healing for 2s.'],
        aggressionDescription: ['Agression Mode (Upon dealing damage)', 'Increase movement speed for 4s.'],
        textureName: 'RushOfBlood',
        unit: marine,
        defenseEventName: 'holdPosition',
        defenseDuration: robDDuration,
        defenseCooldown: 6000,
        aggressionEventName: 'dealDamage',
        aggressionDuration: robADuration,
        aggressionCooldown: 6000,
        defenseAction: function(event) {
            var f = {};
            marine.applyBuff({name: "rushofbloodabsorb", textureName: 'RushOfBloodBuff', duration: robDDuration,  applyChanges: function() {
                f.handler = Matter.Events.on(marine, 'preReceiveHeal', function(event) {
                    event.healingObj.amount *= 2;
                });
            }, removeChanges: function() {
                Matter.Events.off(marine, 'preReceiveHeal', f.handler);
            }});
        },
        aggressionAction: function(event) {
            marine.applyBuff({name: "rushofbloodspeed", textureName: 'SpeedBuff', duration: robADuration,  applyChanges: function() {
                marine.moveSpeed += 0.5;
            }, removeChanges: function() {
                marine.moveSpeed -= 0.5;
            }});
        },
    });

    var killerInstinct = new Passive({
        title: 'Killer Instinct',
        aggressionDescription: ['Agression Mode (Upon dealing damage)', 'Maim enemy for 6s.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Maim enemy for 3s.'],
        textureName: 'KillerInstinct',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 3000,
        aggressionEventName: 'dealNonLethalDamage',
        aggressionCooldown: 6000,
        defenseAction: function(event) {
            var attackingUnit = event.performingUnit;
            attackingUnit.maim(3000);
        },
        aggressionAction: function(event) {
            var targetUnit = event.targetUnit;
            targetUnit.maim(6000);
        },
    });

    var cpADuration = 4000;
    var clearPerspective  = new Passive({
        title: 'Clear Perspective',
        aggressionDescription: ['Agression Mode (Upon hold position)', 'Double rifle range for 4s.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Throw knife in attacker\'s direction.'],
        textureName: 'ClearPerspective',
        unit: marine,
        defenseEventName: 'sufferProjectile',
        defenseCooldown: 9000,
        aggressionEventName: 'holdPosition',
        aggressionCooldown: 4000,
        aggressionDuration: cpADuration,
        defenseAction: function(event) {
            marine.getAbilityByName('Throw Knife').method.call(marine, event.performingUnit.position);
        },
        aggressionAction: function(event) {
            marine.applyBuff({name: "keenEye", textureName: 'KeenEyeBuff', duration: cpADuration, applyChanges: function() {
                marine.honeRange = marine.honeRange*2;
                marine.range = marine.range*2;
            }, removeChanges: function() {
                marine.honeRange = marine.honeRange/2;
                marine.range = marine.range/2;
            }});
        },
    });

    var ssDDuration = 4000;
    var ssADuration = 4000;
    var spiritualState  = new Passive({
        title: 'Spiritual State',
        aggressionDescription: ['Agression Mode (Upon hold position)', 'Gain 1 energy for every 1 hp recieved from healing for 4s.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Self and allies rengerate energy at x2 rate for 4s.'],
        textureName: 'SpiritualState',
        unit: marine,
        defenseEventName: 'sufferProjectile',
        defenseCooldown: 3000,
        defenseDuration: ssDDuration,
        aggressionEventName: 'holdPosition',
        aggressionCooldown: 6000,
        aggressionDuration: ssADuration,
        defenseAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(marine, true);
            alliesAndSelf.forEach((unit) => {
                unit.applyBuff({name: "spiritualStateGain", textureName: 'SpiritualStateEnergyGainBuff', duration: ssDDuration, applyChanges: function() {
                    unit.energyRegenerationMultiplier *= 2;
                }, removeChanges: function() {
                    unit.energyRegenerationMultiplier /= 2;
                }});
            });
        },
        aggressionAction: function(event) {
            var f = {};
            marine.applyBuff({name: "spiritualStateMatch", duration: ssADuration, textureName: 'SpiritualStateBuff', applyChanges: function() {
                f.handler = Matter.Events.on(marine, 'receiveHeal', function(event) {
                    marine.currentEnergy += event.amountDone;
                });
            }, removeChanges: function() {
                Matter.Events.off(marine, 'receiveHeal', f.handler);
            }});
        },
    });

    var trueGrit  = new Passive({
        title: 'True Grit',
        aggressionDescription: ['Agression Mode (Upon kill)', 'Gain 8 grit for length of round.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Self and allies gain 5 grit for length of round.'],
        textureName: 'TrueGrit',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 5000,
        aggressionEventName: 'kill',
        aggressionCooldown: 4000,
        defenseAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(marine, true);
            alliesAndSelf.forEach((unit) => {
                var gritUp = graphicsUtils.addSomethingToRenderer("GritBuff", {where: 'stageTwo', position: unit.position});
                gameUtils.attachSomethingToBody({something: gritUp, body: unit.body});
                graphicsUtils.floatSprite(gritUp, {direction: 1, runs: 50});
                unit.addGritAddition(5);
                gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', function() {
                    unit.removeGritAddition(5);
                });
            });
        },
        aggressionAction: function(event) {
            var gritUp = graphicsUtils.addSomethingToRenderer("GritBuff", {where: 'stageTwo', position: marine.position});
            gameUtils.attachSomethingToBody({something: gritUp, body: marine.body});
            graphicsUtils.floatSprite(gritUp, {direction: 1, runs: 50});
            marine.addGritAddition(5);
            gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', function() {
                marine.removeGritAddition(5);
            });
        },
    });

    var unitProperties = $.extend({
        unitType: 'Marine',
        health: 75,
        defense: 1,
        energy: 20,
        energyRegenerationRate: 0.25,
        healthRegenerationRate: 1,
        portrait: graphicsUtils.createDisplayObject('MarinePortrait'),
        wireframe: graphicsUtils.createDisplayObject('MarineGroupPortrait'),
        graveSpriteName: 'MarineGrave',
        team: options.team || 4,
        priority: 10,
        consumeSound: yeahsound,
        hitboxWidth: 30,
        hitboxHeight: 58,
        // adjustHitbox: true,
        animationSpecificHitboxes: [{animation: walkAnimations.down, height: 8, width: 48, offset: {x: -6, y: -5}},
                                    {animation: walkAnimations.up, height: 8, width: 50, offset: {x: 0, y: -8}},
                                    {animation: walkAnimations.upRight, height: 8, width: 50, offset: {x: 0, y: -15}},
                                    {animation: walkAnimations.upLeft, height: 8, width: 50, offset: {x: 0, y: -15}},
                                    {animation: walkAnimations.downRight, height: 8, width: 50, offset: {x: 0, y: -13}},
                                    {animation: walkAnimations.downLeft, height: 8, width: 50, offset: {x: 0, y: -13}},
                                    {animation: attackAnimations.left, height: 8, width: 35, offset: {x: -16, y: -18}},
                                    {animation: attackAnimations.right, height: 8, width: 35, offset: {x: 16, y: -18}}],
        itemsEnabled: true,
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

            var shadow = graphicsUtils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stageNTwo', scale: {x: 0.75, y: 0.75}, position: mathArrayUtils.clonePosition(self.deathPosition, {y: 22})});
            graphicsUtils.fadeSpriteOverTime(shadow, 1500);

            anim.play();
            deathSound.play();
            deathSoundBlood.play();
            return [shadow, anim];
        },
        _init: function() {
            this.firstAidPouchAdditions = [];
            if(!this.bypassRevival) {
                $.extend(this, rv);
                this.revivableInit();
            }

            $.extend(this, aug);
            this.unlockerInit();
        }}, options);

    return UC({
            givenUnitObj: marine,
            renderChildren: rc,
            radius: options.radius || 25,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [dashSound, deathSound, deathSoundBlood, fireSound, knifeThrowSound, knifeImpactSound,
                     poisonSound, criticalHitSound, yeahsound, unitProperties.wireframe, unitProperties.portrait],
            unit: unitProperties,
            moveable: {
                moveSpeed: 2.50,
                walkAnimations: walkAnimations,
            }, attacker: {
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

                    var crit = 1;
                    var critActive = false;
                    if(hoodedPeepAugment) {
                        if(Math.random() < hoodedPeepAugment.chance) {
                            crit = hoodedPeepAugment.multiplier;
                            critActive = true;
                        }
                    }

                    var self = this;
                    if(firstAidPouchAugment) {
                        gameUtils.applyToUnitsByTeam(function(team) {
                            return self.team == team;
                        }, function(unit) {
                            return mathArrayUtils.distanceBetweenUnits(self, unit) <= 500;
                        }, function(unit) {
                            graphicsUtils.applyGainAnimationToUnit(unit, 0xc60006);
                            healsound.play();
                            var sum = 0;
                            self.firstAidPouchAdditions.forEach((addition) => {
                                sum += addition;
                            });
                            unit.giveHealth(firstAidPouchAugment.healAmount + sum, self);
                        });
                    }

                    var dTotal = this.damage + this.getDamageAdditionSum();
                    target.sufferAttack(dTotal*crit, this);
                    if(critActive) {
                        fireSound.play();
                        criticalHitSound.play();
                        var chText = graphicsUtils.floatText(dTotal*crit + '!', {x: target.position.x, y: target.position.y-15}, {style: styles.critHitText, speed: 1.5});
                    } else {
                        fireSound.play();
                    }
                    var abilityTint = 0x80ba80;
                    graphicsUtils.makeSpriteBlinkTint({sprite: this.getAbilityByName('Rifle').icon, tint: abilityTint, speed: 100});

                    //bullet emitter
                    var emitter = gameUtils.createParticleEmitter({where: globals.currentGame.renderer.stages.stage,
                        config: {
                        	"alpha": {
                        		"start": 1,
                        		"end": 1
                        	},
                        	"scale": {
                        		"start": 0.3,
                        		"end": 0.2,
                        		"minimumScaleMultiplier": 1
                        	},
                        	"color": {
                        		"start": "#ffd21f",
                        		"end": "#fff23d"
                        	},
                        	"speed": {
                        		"start": 200,
                        		"end": 200,
                        		"minimumSpeedMultiplier": 1
                        	},
                        	"acceleration": {
                        		"x": 0,
                        		"y": 0
                        	},
                        	"maxSpeed": 0,
                        	"startRotation": {
                        		"min": 0,
                        		"max": 360
                        	},
                        	"noRotation": false,
                        	"rotationSpeed": {
                        		"min": 0,
                        		"max": 0
                        	},
                        	"lifetime": {
                        		"min": 0.02,
                        		"max": 0.02
                        	},
                        	"blendMode": "normal",
                        	"frequency": 0.3/3,
                        	"emitterLifetime": 0.3,
                        	"maxParticles": 3,
                        	"pos": {
                        		"x": 0,
                        		"y": 0
                        	},
                        	"addAtBack": false,
                        	"spawnType": "circle",
                        	"spawnCircle": {
                        		"x": 0,
                        		"y": 0,
                        		"r": 8
                        	}
                    }, texture: PIXI.Texture.from('Textures/bulletParticle.png')});
                    emitter.updateSpawnPos(target.position.x, target.position.y);
                    emitter.playOnceAndDestroy();

                    //blood emitter
                    var bloodEmitter = gameUtils.createParticleEmitter({where: globals.currentGame.renderer.stages.stage,
                        config: {
                    	"alpha": {
                    		"start": 1,
                    		"end": 1
                    	},
                    	"scale": {
                    		"start": 0.1 * crit,
                    		"end": 0.01,
                    		"minimumScaleMultiplier": 1
                    	},
                    	"color": {
                    		"start": "#ff0000",
                    		"end": "#ff0000"
                    	},
                    	"speed": {
                    		"start": 0,
                    		"end": 0,
                    		"minimumSpeedMultiplier": 1
                    	},
                    	"acceleration": {
                    		"x": 0,
                    		"y": 1800
                    	},
                    	"maxSpeed": 0,
                    	"startRotation": {
                    		"min": 0,
                    		"max": 0
                    	},
                    	"noRotation": false,
                    	"rotationSpeed": {
                    		"min": 0,
                    		"max": 0
                    	},
                    	"lifetime": {
                    		"min": 0.25,
                    		"max": 0.3
                    	},
                    	"blendMode": "normal",
                    	"frequency": 0.01,
                    	"emitterLifetime": 0.2,
                    	"maxParticles": 2*(Math.pow(crit, 3)),
                    	"pos": {
                    		"x": 0,
                    		"y": 0
                    	},
                    	"addAtBack": false,
                    	"spawnType": "circle",
                    	"spawnCircle": {
                    		"x": 0,
                    		"y": 0,
                    		"r": 20
                    	}
                    }, texture: PIXI.Texture.from('Textures/particle.png')});
                    bloodEmitter.updateSpawnPos(target.position.x, target.position.y);
                    bloodEmitter.playOnceAndDestroy();
                },
            },
   });
}
