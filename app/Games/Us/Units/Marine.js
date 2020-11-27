import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import UC from '@core/Unit/UnitConstructor.js'
import aug from '@core/Unit/_Augmentable.js'
import Ability from '@core/Unit/UnitAbility.js'
import Passive from '@core/Unit/UnitPassive.js'
import rv from '@core/Unit/_Revivable.js'
import styles from '@utils/Styles.js'
import {globals} from '@core/Fundamental/GlobalState'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

export default function Marine(options) {
    var marine = {};

    var options = options || {};

    //animation settings
    var walkSpeed = .9;
    var walkSpeedBonus = .25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineN'].spineData);
    var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineS'].spineData);
    var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineW'].spineData);
    var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineW'].spineData);
    var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineSW'].spineData);
    var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineSW'].spineData);
    var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineNW'].spineData);
    var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineNW'].spineData);

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
    }

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
            speed: .5,
            mixedAnimation: true
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'throw',
            speed: .5,
            mixedAnimation: true
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'throw',
            speed: .5,
            mixedAnimation: true
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'throw',
            speed: .5,
            mixedAnimation: true
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'throw',
            speed: .5,
            mixedAnimation: true
        }),
    }

    var otherAnimations = {

    }

    var sc = {x: .35, y: .35};
    var adjustedUpDownsc = {x: .38, y: .38};
    var flipsc = {x: -1 * sc.x, y: sc.y};
    var yOffset = 22;
    var rc = [
    {
        id: 'selected',
        data: 'IsometricSelected',
        scale: {x: .8, y: .8},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },
    {
        id: 'selectionPending',
        data: 'IsometricSelectedPending',
        scale: {x: 1, y: 1},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },{
        id: 'left',
        data: spineWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset},
    },{
        id: 'right',
        data: spineEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'up',
        data: spineNorth,
        scale: adjustedUpDownsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'down',
        data: spineSouth,
        scale: adjustedUpDownsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'upLeft',
        data: spineNorthWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'upRight',
        data: spineNorthEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'downRight',
        data: spineSouthEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    }, {
        id: 'downLeft',
        data: spineSouthWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },{
        id: 'shadow',
        data: 'IsoShadowBlurred',
        scale: {x: .75, y: .75},
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 22}}];

    var fireSound = gameUtils.getSound('machinegun.wav', {volume: .002, rate: 3});
    var poisonSound = gameUtils.getSound('poisonhit1.wav', {volume: .01, rate: .6});

    //crit
    var criticalHitSound = gameUtils.getSound('criticalhit.wav', {volume: .2, rate: .9});
    var criticalHitSound2 = gameUtils.getSound('criticalhit2.wav', {volume: .1, rate: .7});

    //death
    var deathSound = gameUtils.getSound('marinedeathsound.wav', {volume: .2, rate: 1.0});
    var deathSoundBlood = gameUtils.getSound('marinedeathbloodsound.wav', {volume: .06, rate: 1.2});

    //other
    var healsound = gameUtils.getSound('healsound.wav', {volume: .006, rate: 1.3});

    //Dash
    var dashVelocity = .8;
    var dashSound = gameUtils.getSound('dashsound2.wav', {volume: .04, rate: 1.2});
    var dash = function(destination, commandObj) {
        //get current augment
        var thisAbility = this.getAbilityByName('Dash');
        var currentAugment = thisAbility.currentAugment || {name: 'null'};

        this.stop(); //stop any movement
        this._becomePeaceful(); //prevent us from honing/attacking
        this.moveSpeedAugment = this.moveSpeed;
        this.body.frictionAir = .2;
        var velocityVector = Matter.Vector.sub(destination, this.position);
        var velocityScaled = dashVelocity / Matter.Vector.magnitude(velocityVector);
        Matter.Body.applyForce(this.body, this.position, {x: velocityScaled * velocityVector.x, y: velocityScaled * velocityVector.y});
        dashSound.play();
        Matter.Events.trigger(globals.currentGame, 'dash', {performingUnit: this});

        //play animation
        var dashAnimation = gameUtils.getAnimation({
            spritesheetName: 'MarineAnimations1',
            animationName: 'dash',
            speed: .3,
            transform: [this.position.x, this.position.y, 3.5, 2.5]
        });

        dashAnimation.play();
        dashAnimation.alpha = .8;
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
        })

        if(currentAugment.name == 'defensive posture') {
            gameUtils.applyBuffImageToUnit({name: "defpostbuff", unit: this, textureName: 'DefensiveBuff'})
            if(!self.defensivePostureActive)
                self.addDefenseAddition(2);
            self.defensivePostureActive = true;
            self.dashAugTimer = globals.currentGame.addTimer({
                name: 'defensePostureTimerEnd' + self.unitId,
                runs: 1,
                executeOnNuke: true,
                timeLimit: 2000,
                totallyDoneCallback: function() {
                    self.buffs.defpostbuff.removeBuffImage();
                    self.removeDefenseAddition(2);
                    self.defensivePostureActive = false;
                }
            })
        } else if(currentAugment.name == 'death wish') {
            gameUtils.applyBuffImageToUnit({name: "deathwishbuff", unit: this, textureName: 'DeathWishBuff'})
            if(!self.deathWishActive)
                self.damage += 10;
            self.deathWishActive = true;
            self.dashAugTimer = globals.currentGame.addTimer({
                name: 'deathWishTimerEnd' + self.unitId,
                runs: 1,
                executeOnNuke: true,
                timeLimit: 2000,
                totallyDoneCallback: function() {
                    self.buffs.deathwishbuff.removeBuffImage();
                    self.damage -= 10;
                    self.deathWishActive = false;
                }
            })
        }

        gameUtils.deathPact(this, self.dashTimer, 'dashDoneTimer');
        if(self.dashAugTimer) {
            gameUtils.deathPact(this, self.dashAugTimer, 'dashAugTimer');
        }
    }
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
                description: 'Alter dash cost to 2 hp, 1 energy.',
                equip: function(unit) {
                    this.oldEnergyCost = this.ability.energyCost;
                    this.ability.energyCost = 1;
                    this.ability.hpEnable = this.ability.enablers.push(function() {
                        return unit.currentHealth > 2;
                    })
                    this.ability.hpCost = this.ability.costs.push(function() {
                        return unit.currentHealth -= 2;
                    })
                    this.ability.customCostText = "HP: 2 and E: 1";
                },
                unequip: function(unit) {
                    this.ability.energyCost = this.oldEnergyCost;
                    this.ability.enablers.splice(this.ability.enablers.indexOf(this.ability.hpEnable), 1);
                    this.ability.costs.splice(this.ability.costs.indexOf(this.ability.hpCost), 1);
                    this.ability.customCostText = null;
                }
            },
            {
                name: 'defensive posture',
                chance: .2,
                multiplier: 2,
                icon: graphicsUtils.createDisplayObject('DefensivePosture'),
                title: 'Defensive Posture',
                description: 'Gain 2 defense upon dashing for 2 seconds.'
            },
            {
                name: 'death wish',
                healAmount: 15,
                chance: .5,
                icon: graphicsUtils.createDisplayObject('DeathWish'),
                title: 'Death Wish',
                description: 'Increase damage by 10 upon dashing for 2 seconds.'
            },
        ],
    })

    //Knife
    var knifeThrowSound = gameUtils.getSound('knifethrow.wav', {volume: .03, rate: 1.5});
    var knifeImpactSound = gameUtils.getSound('knifeimpact.wav', {volume: .05, rate: 1});
    var knifeSpeed = 22;
    var knifeDamage = 20;
    var throwKnife = function(destination, commandObj, childKnife) {
        //get current augment
        var thisAbility = this.getAbilityByName('Throw Knife');
        var currentAugment = thisAbility.currentAugment || {name: 'null'};

        if(!childKnife && currentAugment.name == 'multi throw') {
            var perpVector = Matter.Vector.normalise(Matter.Vector.perp(Matter.Vector.sub(destination, this.position)));
            var start = (currentAugment.knives-1)/-2;
            var spacing = 25;
            for(var n = start; n < start+currentAugment.knives; n++) {
                if(n == 0) continue;
                thisAbility.method.call(this, Matter.Vector.add(destination, Matter.Vector.mult(perpVector, n*spacing)), null, true);
            }
        }

        //create knife body
        var knife = Matter.Bodies.circle(0, 0, 4, {
            restitution: .95,
            frictionAir: 0,
            mass: options.mass || 5,
            isSensor: true
        });

        if(currentAugment.name == 'pierce') {
            knife.lives = currentAugment.lives;
        }

        Matter.Body.setPosition(knife, this.position);
        var knifeTint = 0xFFFFFF;
        if(currentAugment.name == 'poison tip') {
            knifeTint = 0x009933;
        } else if(currentAugment.name == 'pierce') {
            knifeTint = 0x6666ff;
        }
        knife.renderChildren = [{
            id: 'knife',
            data: 'ThrowingDaggerBase',
            scale: {x: .7, y: .7},
            rotate: mathArrayUtils.pointInDirection(knife.position, destination),
        },
        {
            id: 'knifeblade',
            data: 'ThrowingDaggerBlade',
            scale: {x: .7, y: .7},
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
        }]
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
        })
        gameUtils.deathPact(knife, removeSelf);

        //play spine animation
        this.isoManager.playSpecifiedAnimation('throw', gameUtils.isoDirectionBetweenPositions(this.position, destination), {movePrecedence: true});

        var self = this;
        Matter.Events.on(knife, 'onCollide', function(pair) {
            var otherBody = pair.pair.bodyB == knife ? pair.pair.bodyA : pair.pair.bodyB;
            var otherUnit = otherBody.unit;
            if(otherUnit != this && otherUnit && otherUnit.isAttackable && otherUnit.team != this.team) {
                if(currentAugment.name == 'poison tip') {
                    knife.poisonTimer = globals.currentGame.addTimer({
                        name: 'poisonTimer' + knife.id,
                        runs: currentAugment.seconds*2,
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
                                transform: [otherUnit.position.x, otherUnit.position.y, .4, .4]
                            });
                            poisonAnimation.rotation = Math.random() * Math.PI*2;
                            graphicsUtils.addSomethingToRenderer(poisonAnimation, 'stageOne');
                            poisonAnimation.play();
                            otherUnit.sufferAttack(currentAugment.damage/(currentAugment.seconds*2), self);
                        }
                    })
                }

                otherUnit.sufferAttack(knifeDamage, self); //we can make the assumption that a body is part of a unit if it's attackable
                if(otherUnit.isDead) {
                    Matter.Events.trigger(this, 'knifeKill');
                    Matter.Events.trigger(globals.currentGame, 'knifeKill', {performingUnit: this});
                }
                var bloodPierceAnimation = gameUtils.getAnimation({
                    spritesheetName: 'UtilityAnimations1',
                    animationName: 'pierce',
                    speed: .95,
                    transform: [knife.position.x, knife.position.y, .25, .25]
                });
                knifeImpactSound.play();
                bloodPierceAnimation.play();
                bloodPierceAnimation.rotation = mathArrayUtils.pointInDirection(knife.position, knife.destination, 'east');
                graphicsUtils.addSomethingToRenderer(bloodPierceAnimation, 'foreground');
                if(currentAugment && currentAugment.name == 'pierce') {
                    knife.lives -= 1;
                    if(knife.lives == 0) {
                        globals.currentGame.removeBody(knife);
                    }
                } else {
                    globals.currentGame.removeBody(knife);
                }
            }

            if(otherBody.isMine) {
                otherBody.explode();
            }
        }.bind(this))

        if(commandObj) {
            globals.currentGame.addTimer({
                name: 'knifeDoneTimer' + knife.id,
                runs: 1,
                killsSelf: true,
                timeLimit: 125,
                callback: function() {
                    commandObj.command.done();
                }
            })
        }

        Matter.Events.trigger(globals.currentGame, 'performKnifeThrow', {performingUnit: this});
    };
    var knifeAbility = new Ability({
        name: 'Throw Knife',
        key: 'f',
        type: 'click',
        icon: graphicsUtils.createDisplayObject('KnifeIcon'),
        method: throwKnife,
        title: 'Throwing Knife',
        description: 'Throw a knife, dealing ' + knifeDamage + ' damage.',
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
                damage: 20,
                icon: graphicsUtils.createDisplayObject('MultiShot'),
                title: 'Multi-throw',
                description: 'Throw multiple knives in a fan.'
            },
        ],
    })

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
                delta: -190,
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
                chance: .2,
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
    var allyArmorDuration = 10000;
    var givingSpirit = new Passive({
        title: 'Giving Spirit',
        defenseDescription: ['Defensive Mode (When hit)', 'Grant ally 10 hp.'],
        aggressionDescription: ['Agression Mode (Upon kill)', 'Grant ally 1 def for 10s.'],
        textureName: 'PositiveMindset',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseDuration: gsDDuration,
        defenseCooldown: 5000,
        aggressionEventName: 'kill',
        aggressionDuration: gsADuration,
        aggressionCooldown: 2000,
        defenseAction: function(event) {
            var allies = gameUtils.getUnitAllies(marine);
            allies.forEach((ally) => {
                ally.giveHealth(10, marine);
                var lifeUpAnimation = gameUtils.getAnimation({
                    spritesheetName: 'MedicAnimations1',
                    animationName: 'heal',
                    speed: .8,
                    transform: [ally.position.x, ally.position.y, 1.2, 1.2]
                });
                lifeUpAnimation.tint = 0xff5252;
                lifeUpAnimation.play();
                lifeUpAnimation.alpha = 1;
                healsound.play();
                gameUtils.attachSomethingToBody({something: lifeUpAnimation, body: ally.body});
                graphicsUtils.addSomethingToRenderer(lifeUpAnimation, 'foreground');
            })
        },
        aggressionAction: function(event) {
            var allies = gameUtils.getUnitAllies(marine);
            allies.forEach((ally) => {
                ally.addDefenseAddition(1);
                var id = mathArrayUtils.getId();
                gameUtils.applyBuffImageToUnit({name: "givingSpiritDefBuff" + id, unit: ally, textureName: 'DefensiveBuff'})
                gameUtils.doSomethingAfterDuration(function() {
                    ally.removeDefenseAddition(1);
                    ally.buffs['givingSpiritDefBuff'+id].removeBuffImage();
                }, allyArmorDuration, {executeOnNuke: true})
            })
        },
    })

    var robDDuration = 3000;
    var robADuration = 3000;
    var rushOfBlood = new Passive({
        title: 'Rush Of Blood',
        defenseDescription: ['Defensive Mode (When hit)', 'Absorb 2x healing for 3s.'],
        aggressionDescription: ['Agression Mode (Upon firing)', 'Increase movement speed for 3s.'],
        textureName: 'RushOfBlood',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseDuration: robDDuration,
        defenseCooldown: 9000,
        aggressionEventName: 'attack',
        aggressionDuration: robADuration,
        aggressionCooldown: 8000,
        defenseAction: function(event) {
            gameUtils.applyBuffImageToUnit({name: "rushofbloodabsorb", unit: marine, textureName: 'RushOfBloodBuff'})
            var f = Matter.Events.on(marine, 'prePerformedHeal', function(event) {
                event.healingObj.amount *= 2;
            })
            gameUtils.doSomethingAfterDuration(function() {
                Matter.Events.off(marine, 'prePerformedHeal', f);
                marine.buffs.rushofbloodabsorb.removeBuffImage();
            }, robDDuration)
        },
        aggressionAction: function(event) {
            marine.moveSpeed += .4;
            gameUtils.applyBuffImageToUnit({name: "rushofbloodspeed", unit: marine, textureName: 'SpeedBuff'})
            marine.rushofbloodTimer = globals.currentGame.addTimer({
                name: 'rushofbloodTimerEnd' + marine.unitId,
                runs: 1,
                executeOnNuke: true,
                timeLimit: robADuration,
                totallyDoneCallback: function() {
                    marine.buffs.rushofbloodspeed.removeBuffImage();
                    marine.moveSpeed -= .4;
                }
            })
        },
    })

    var killerInstinct = new Passive({
        title: 'Killer Instinct',
        aggressionDescription: ['Agression Mode (Upon firing)', 'Maim enemy for 3s.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Permanently reduce enemy base defense by 1.'],
        textureName: 'KillerInstinct',
        unit: marine,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 5000,
        aggressionEventName: 'attack',
        aggressionPredicate: function(event) {
            return !event.targetUnit.isDead;
        },
        aggressionCooldown: 8000,
        defenseAction: function(event) {
            var attackingUnit = event.performingUnit;
            attackingUnit.defense -= 1;
            var defenseDown = graphicsUtils.addSomethingToRenderer("DefensiveBuff", {where: 'stageTwo', position: attackingUnit.position, tint: 0xc71414})
            graphicsUtils.floatSprite(defenseDown, {direction: -1});
        },
        aggressionAction: function(event) {
            var targetUnit = event.targetUnit;
            if(!targetUnit.isDead) {
                targetUnit.maim();
            }
        },
    })

    var cpADuration = 4000;
    var clearPerspective  = new Passive({
        title: 'Clear Perspective',
        aggressionDescription: ['Agression Mode (Upon kill)', 'Double rifle range for 4s.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Throw knife in attacker\'s direction.'],
        textureName: 'ClearPerspective',
        unit: marine,
        defenseEventName: 'sufferProjectile',
        defenseCooldown: 9000,
        aggressionEventName: 'kill',
        aggressionCooldown: 9000,
        aggressionDuration: cpADuration,
        defenseAction: function(event) {
            marine.getAbilityByName('Throw Knife').method.call(marine, event.performingUnit.position);
        },
        aggressionAction: function(event) {
            marine.honeRange = marine.honeRange*2;
            marine.range = marine.range*2;
            gameUtils.applyBuffImageToUnit({name: "keenEye", unit: marine, textureName: 'KeenEyeBuff'})
            gameUtils.doSomethingAfterDuration(function() {
                marine.honeRange = marine.honeRange/2;
                marine.range = marine.range/2;
                marine.buffs.keenEye.removeBuffImage();
            }, cpADuration);
        },
    })

    var unitProperties = $.extend({
        unitType: 'Marine',
        health: 75,
        defense: 1,
        energy: 20,
        energyRegenerationRate: 1,
        portrait: graphicsUtils.createDisplayObject('MarinePortrait'),
        wireframe: graphicsUtils.createDisplayObject('MarineGroupPortrait'),
        graveSpriteName: 'MarineGrave',
        team: options.team || 4,
        priority: 10,
        hitboxWidth: 35,
        hitboxHeight: 60,
        itemsEnabled: true,
        name: options.name,
        heightAnimation: 'up',
        // skinTweak: {r: .5, g: 3.0, b: .5, a: 1.0},
        throwAnimations: throwAnimations,
        abilities: [gunAbility, dashAbility, knifeAbility],
        passiveAbilities: [givingSpirit, rushOfBlood, killerInstinct, clearPerspective],
        death: function() {
            var self = this;
            var anim = gameUtils.getAnimation({
                spritesheetName: 'MarineAnimations1',
                animationName: 'MarineDeath',
                speed: .25,
                fadeAway: true,
                fadeTime: 3200,
                transform: [self.deathPosition.x, self.deathPosition.y, 1, 1]
            });
            graphicsUtils.addSomethingToRenderer(anim);
            this.corpse = anim;

            var shadow = graphicsUtils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stageNTwo', scale: {x: .75, y: .75}, position: mathArrayUtils.clonePosition(self.deathPosition, {y: 22})})
            graphicsUtils.fadeSpriteOverTime(shadow, 1500);

            anim.play();
            deathSound.play();
            deathSoundBlood.play();
        },
        _init: function() {
            if(!this.bypassRevival) {
                $.extend(this, rv);
                this.revivableInit();
            }

            $.extend(this, aug);
            this.augmentableInit();
        }}, options);

    return UC({
            givenUnitObj: marine,
            renderChildren: rc,
            radius: options.radius || 25,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [dashSound, deathSound, deathSoundBlood, fireSound, knifeThrowSound, knifeImpactSound,
                     poisonSound, criticalHitSound, criticalHitSound2, unitProperties.wireframe, unitProperties.portrait],
            unit: unitProperties,
            moveable: {
                moveSpeed: 2.35,
                walkAnimations: walkAnimations,
            }, attacker: {
                attackAnimations: attackAnimations,
                cooldown: 650,
                honeRange: 300,
                range: 180,
                damage: 10,
                attack: function(target) {
                    var rifleAbility = this.getAbilityByName('Rifle');
                    var currentAugment = rifleAbility.currentAugment || {name: ""};

                    var crit = 1;
                    var critActive = false
                    if(currentAugment.name == 'hooded peep') {
                        if(Math.random() < currentAugment.chance) {
                            crit = currentAugment.multiplier;
                            critActive = true;
                        }
                    }

                    var self = this;
                    if(currentAugment.name == 'first aid pouch') {
                        gameUtils.applyToUnitsByTeam(function(team) {
                            return self.team == team;
                        }, function(unit) {
                            return mathArrayUtils.distanceBetweenUnits(self, unit) <= 100;
                        }, function(unit) {
                            var lifeUpAnimation = gameUtils.getAnimation({
                                spritesheetName: 'UtilityAnimations1',
                                animationName: 'manasteal',
                                speed: .8,
                                transform: [unit.position.x, unit.position.y, 1, 1]
                            });

                            lifeUpAnimation.tint = 0xF80202;
                            lifeUpAnimation.play();
                            lifeUpAnimation.alpha = 1;
                            gameUtils.attachSomethingToBody({something: lifeUpAnimation, body: unit.body, offset: {x: Math.random()*40-20, y: 25-(Math.random()*5)}});
                            graphicsUtils.addSomethingToRenderer(lifeUpAnimation, 'foreground');
                            unit.giveHealth(currentAugment.healAmount, self);
                        })
                    }

                    target.sufferAttack(this.damage*crit, this);
                    if(critActive) {
                        criticalHitSound.play();
                        criticalHitSound2.play();
                        graphicsUtils.floatText(this.damage*crit + '!', {x: target.position.x, y: target.position.y-15}, {style: styles.critHitText});
                    }
                    fireSound.play();
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
                        		"start": .3,
                        		"end": .2,
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
                        	"frequency": .3/3,
                        	"emitterLifetime": .3,
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
                    }, texture: PIXI.Texture.from('Textures/bulletParticle.png')})
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
