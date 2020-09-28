import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import UC from '@core/Unit/UnitConstructor.js'
import aug from '@core/Unit/_Augmentable.js'
import Ability from '@core/Unit/UnitAbility.js'
import rv from '@core/Unit/_Revivable.js'
import Projectile from '@core/Unit/UnitProjectile.js'
import {globals} from '@core/GlobalState'
import utils from '@utils/GameUtils.js'

export default function Medic(options) {
    var medic = {};

    var options = options || {};

    //animation settings
    var walkSpeed = .9;
    var walkSpeedBonus = .25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicN'].spineData);
    var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicS'].spineData);
    var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicW'].spineData);
    var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicW'].spineData);
    var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicSW'].spineData);
    var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicSW'].spineData);
    var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicNW'].spineData);
    var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['medicNW'].spineData);

    var walkAnimations = {
        up: utils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upRight: utils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        right: utils.getSpineAnimation({
            spine: spineEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downRight: utils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        down: utils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downLeft: utils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        left: utils.getSpineAnimation({
            spine: spineWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upLeft: utils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
    };

    var attackAnimSpeed = 3;
    var healAnimations = {
        up: utils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        upRight: utils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        right: utils.getSpineAnimation({
            spine: spineEast,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        downRight: utils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        down: utils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        downLeft: utils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        left: utils.getSpineAnimation({
            spine: spineWest,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        upLeft: utils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
    }

    var otherAnimations = {

    }

    var sc = {x: .33, y: .33};
    var updiagsc = {x: .345, y: .345};
    var flipupdiagsc = {x: -1 * updiagsc.x, y: updiagsc.y};
    var downdiagsc = {x: .325, y: .325};
    var flipdowndiagsc = {x: -1 * downdiagsc.x, y: downdiagsc.y};
    var adjustedDownsc = {x: .35, y: .35};
    var adjustedUpsc = {x: .36, y: .37};
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
        scale: adjustedUpsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'down',
        data: spineSouth,
        scale: adjustedDownsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'upLeft',
        data: spineNorthWest,
        scale: updiagsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'upRight',
        data: spineNorthEast,
        scale: flipupdiagsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'downRight',
        data: spineSouthEast,
        scale: flipdowndiagsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    }, {
        id: 'downLeft',
        data: spineSouthWest,
        scale: downdiagsc,
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

    var healsound = utils.getSound('healsound.wav', {volume: .006, rate: 1.3});
    var deathSoundBlood = utils.getSound('marinedeathbloodsound.wav', {volume: .06, rate: 1.2});
    var deathSound = utils.getSound('medicdeathsound.wav', {volume: .2, rate: 1.05});

    var combospiritinit = utils.getSound('combospiritinit.wav', {volume: .03, rate: 1.0});
    var fullheal = utils.getSound('fullheal.wav', {volume: .05, rate: 1.0});
    var footstepSound = utils.getSound('secretstep.wav', {volume: .02, rate: 1.1});
    var shroudSound = utils.getSound('cloakshroud.wav', {volume: .1, rate: 1.5});
    var secretStep = function(destination, commandObj) {
        //get current augment
        var thisAbility = this.getAbilityByName('Secret Step');
        var currentAugment = thisAbility.currentAugment || {name: 'null'};

        var shadow = Matter.Bodies.circle(this.position.x, this.position.y, 4, {
          restitution: .95,
          frictionAir: 0,
          mass: options.mass || 5,
          isSensor: true
        });
        shadow.isShadow = true;

        shadow.renderChildren = [{
          id: 'shadow',
          data: 'IsoShadowBlurred',
          scale: {x: .75, y: .75},
          stage: "stageNTwo",
          offset: {x: 0, y: 22},
          alpha: 0.5
        }];

        //medic reference to shadow
        this.shadow = shadow;

        globals.currentGame.addBody(shadow);
        shadow.oneFrameOverrideInterpolation = true;

        var secretStepSpeed = currentAugment.name == 'fleet feet' ? 22 : 10;
        utils.sendBodyToDestinationAtSpeed(shadow, destination, secretStepSpeed, true, true);

        //create footprints
        var footprintFrequency = currentAugment.name == 'fleet feet' ? 30 : 60;
        var footprintDirection = utils.pointInDirection(this.position, destination);
        var lastFootprint = null;
        var everyOther = true;
        shroudSound.play();
        var footprintTimer = globals.currentGame.addTimer({
            name: 'footprints' + this.unitId,
            gogogo: true,
            timeLimit: footprintFrequency,
            callback: function() {
                var footprint = utils.createDisplayObject('Footprint', {where: 'stageNOne', position: utils.clonePosition(shadow.position, {x: 0, y: 22}), alpha: .7, scale: {x:.7, y:.7}});
                footprint.rotation = footprintDirection;
                utils.addSomethingToRenderer(footprint);
                utils.fadeSprite(footprint, .006);
                footprint.visible = false;
                if(everyOther)
                    footstepSound.play();
                everyOther = !everyOther;
                if(lastFootprint)
                    lastFootprint.visible = true;
                lastFootprint = footprint;
            }
        })

        if(currentAugment.name == 'petrify') {
            Matter.Events.on(shadow, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == shadow ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit;
                if(otherUnit && otherUnit != medic) {
                    otherUnit.petrify(currentAugment.duration);
                }
            })
        }

        var originalOrigin = {x: this.position.x, y: this.position.y};
        var originalDistance = Matter.Vector.magnitude(Matter.Vector.sub(destination, this.position));

        this.isTargetable = false;
        utils.moveUnitOffScreen(this);
        this.stop();

        this.getAbilityByName("Secret Step").disable(1);

        var removeSelf = globals.currentGame.addTickCallback(function() {
          if(utils.bodyRanOffStage(shadow) || utils.distanceBetweenPoints(shadow.position, originalOrigin) >= originalDistance) {
              this.getAbilityByName("Secret Step").enable(1);
              var x = shadow.position.x;
              var y = shadow.position.y;
              if(x < 0) x = 5;
              if(x > utils.getPlayableWidth()) x = utils.getPlayableWidth()-5;
              if(y < 0) y = 5;
              if(y > utils.getPlayableHeight()) y = utils.getPlayableHeight()-5;

              this.body.oneFrameOverrideInterpolation = true;
              Matter.Body.setPosition(this.body, {x: x, y: y});
              this.isTargetable = true;
              this.shadow = null;
              globals.currentGame.removeBody(shadow);
              globals.currentGame.invalidateTimer(footprintTimer);
              commandObj.command.done();

              var self = this;
              if(currentAugment.name == 'soft landing') {
                  this.isTargetable = false;
                  this.isoManager.currentAnimation.alpha = .4;
                  this.isoManagedAlpha = .4;
                  globals.currentGame.addTimer({
                      name: 'softLanding' + self.unitId,
                      runs: 1,
                      timeLimit: currentAugment.duration,
                      killsSelf: true,
                      callback: function() {
                          self.isoManagedAlpha = null;
                          self.isTargetable = true;
                      }
                  })
              }
          }
        }.bind(this))
        utils.deathPact(shadow, removeSelf);
    }

    var secretStepAbility = new Ability({
        name: 'Secret Step',
        key: 'd',
        type: 'click',
        icon: utils.createDisplayObject('SecretStepIcon'),
        method: secretStep,
        handlesOwnBlink: true,
        title: 'Secret Step',
        description: 'Safely relocate to anywhere on the map.',
        hotkey: 'D',
        energyCost: 10,
        predicates: [function(commandObj) {
            return utils.distanceBetweenPoints(commandObj.command.target, commandObj.command.unit.position) != 0;
        }],
        augments: [
        {
            name: 'fleet feet',
            icon: utils.createDisplayObject('FleetFeet'),
            title: 'Fleet Feet',
            description: 'Secret step very quickly and reduce energy cost by 2.',
            equip: function(unit) {
                unit.getAbilityByName('Secret Step').energyCost -= 2;
            },
            unequip: function(unit) {
                unit.getAbilityByName('Secret Step').energyCost += 2;
            }
        },{
            name: 'petrify',
            duration: 3000,
            icon: utils.createDisplayObject('Petrify'),
            title: 'Petrify',
            description: ['Render unit hidden and incapable of movement for 3 seconds', 'by secret stepping through them.']
        },
        {
            name: 'soft landing',
            icon: utils.createDisplayObject('SoftLanding'),
            title: 'Soft Landing',
            duration: 3000,
            description: 'Become hidden for 3 seconds after stepping.'
        }]
    })

    var mineSound = utils.getSound('laymine.mp3', {volume: .06, rate: .8});
    var mineBeep = utils.getSound('minebeep.wav', {volume: .03, rate: 7});
    var mineExplosion = utils.getSound('mineexplosion2.wav', {volume: .35, rate: 1.7});
    var layMine = function(commandObj) {
        //get current augment
        var thisAbility = this.getAbilityByName('Mine');
        var currentAugment = thisAbility.currentAugment || {name: 'null'};

        var mine = Matter.Bodies.circle(this.position.x, this.position.y+20, 15, {
            isSensor: true,
            noWire: true,
        });
        mine.isMine = true;

        globals.currentGame.addBody(mine);
        mineSound.play();

        //play spine animation
        // this.isoManager.playSpecifiedAnimation('throw', this.isoManager.currentDirection);

        var mineCracks = utils.createDisplayObject('MineCracks', {scale: {x: .75, y: .75}, alpha: 1});
        var stateZero = utils.createDisplayObject('MineZero', {scale: {x: .75, y: .75}, alpha: .8});
        var stateOne = utils.createDisplayObject('MineOne', {scale: {x: .75, y: .75}, alpha: .8});
        var stateTwo = utils.createDisplayObject('MineTwo', {scale: {x: .75, y: .75}, alpha: 1});
        var stateThree = utils.createDisplayObject('MineThree', {scale: {x: .75, y: .75}, alpha: .8});

        var medic = this;
        var blastRadius = currentAugment.name == 'shrapnel' ? 180 : 120;
        var primaryExplosionRadius = currentAugment.name == 'shrapnel' ? 90 : 60;
        var mineState = {state: 0, id: utils.uuidv4(), position: mine.position, blastRadius: blastRadius, damage: 25, primaryExplosionRadius: primaryExplosionRadius};
        utils.addSomethingToRenderer(stateZero, 'stage', {position: mineState.position});
        utils.addSomethingToRenderer(mineCracks, 'stage', {position: mineState.position})

        //explode animation
        var mineExplosionAnimation = utils.getAnimationB({
			spritesheetName: 'MedicAnimations1',
			animationName: 'mineexplosion',
			speed: 2.8,
			transform: [mineState.position.x, mineState.position.y, 5.0, 5.0]
		});

        //smoke animation
        var smokeExplosionAnimation = utils.getAnimationB({
            spritesheetName: 'MedicAnimations1',
            animationName: 'explosion-c',
            speed: .4,
            transform: [mineState.position.x, mineState.position.y-30, 3, 3]
        });
        smokeExplosionAnimation.alpha = .6;
        if(currentAugment.name == 'shrapnel') {
            mineExplosionAnimation.tint = 0xD7FFFA;
        } else if(currentAugment.name == 'maim') {
            mineExplosionAnimation.tint = 0x94FFF2;
        }
        utils.makeSpriteSize(smokeExplosionAnimation, {x: blastRadius*2, y: blastRadius*2})
        utils.makeSpriteSize(mineExplosionAnimation, {x: blastRadius*3.0, y: blastRadius*3.0})
		// mineExplosionAnimation.rotation = Math.random() * Math.PI*2;
        // var mine2 = Matter.Bodies.circle(position.x, position.y+20, 100, {
        //     isSensor: true,
        // });
        // globals.currentGame.addBody(mine2);

        if(currentAugment.name == 'pressure plate') {
            Matter.Events.on(mine, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == mine ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit;
                if(otherUnit && otherUnit.team != this.team) {
                    mine.explode();
                }
            }.bind(this))
            utils.addSomethingToRenderer(stateOne, 'stage', {position: mineState.position})
            utils.addSomethingToRenderer(stateThree, 'stage', {position: mineState.position})
            var mineTimer = globals.currentGame.addTimer({
                name: mineState.id,
                gogogo: true,
                timeLimit: 1000,
                killsSelf: true,
                callback: function() {
                    if(mineState.state === 0) {
                        stateThree.visible = false;
                        stateZero.visible = false;
                        mineState.state = 1;
                    } else if(mineState.state == 1) {
                        stateThree.visible = true;
                        stateZero.visible = false;
                        mineState.state = 0;
                    }
                }
            })
            utils.deathPact(mine, mineTimer);
        } else {
            var mineTimer = globals.currentGame.addTimer({
                name: mineState.id,
                runs: 4,
                timeLimit: 650,
                killsSelf: true,
                callback: function() {
                    if(mineState.state === 0) {
                        mineBeep.play();
                        utils.addSomethingToRenderer(stateOne, 'stage', {position: mineState.position})
                        utils.removeSomethingFromRenderer(stateZero);
                        mineState.state += 1;
                    } else if(mineState.state == 1) {
                        mineBeep.play();
                        utils.addSomethingToRenderer(stateTwo, 'stage', {position: mineState.position})
                        utils.removeSomethingFromRenderer(stateOne);
                        mineState.state += 1;
                    } else if(mineState.state == 2) {
                        mineBeep.play();
                        utils.addSomethingToRenderer(stateThree, 'stage', {position: mineState.position})
                        utils.removeSomethingFromRenderer(stateTwo);
                        mineState.state += 1;
                    } else if(mineState.state == 3) {
                        mine.explode();
                    }
                }
            })
            utils.deathPact(mine, mineTimer);
        }

        mine.explode = function() {
            mineExplosion.play();
            utils.applyToUnitsByTeam(function(team) {return medic.team != team}, function(unit) {
                return (utils.distanceBetweenBodies(mine, unit.body) <= (mineState.blastRadius + unit.body.circleRadius) && unit.isAttackable);
            }.bind(this), function(unit) {
                var dmg = mineState.damage;
                if(utils.distanceBetweenBodies(mine, unit.body) <= mineState.primaryExplosionRadius) {
                    dmg = dmg*2;
                }
                unit.sufferAttack(dmg, medic);
                if(currentAugment.name == 'maim') {
                    var moveDelta = Math.min(unit.moveSpeed, currentAugment.slowAmount);
                    if(moveDelta == unit.moveSpeed) moveDelta = moveDelta/2;
                    unit.moveSpeed -= moveDelta;
                    globals.currentGame.addTimer({
                        name: 'mineSlow' + unit.unitId + mineState.id,
                        runs: 1,
                        timeLimit: currentAugment.duration,
                        killsSelf: true,
                        callback: function() {
                            unit.moveSpeed += moveDelta;
                        }
                    })
                }

                if(currentAugment.name == 'maim') {
                    var variation = Math.random()*.3;
                    var maimBlast = utils.getAnimationB({
                        spritesheetName: 'MedicAnimations1',
                        animationName: 'maimblast',
                        speed: .4+variation,
                        transform: [unit.position.x, unit.position.y, 1+variation, 1+variation]
                    });
                    maimBlast.rotation = Math.random() * Math.PI;
                    maimBlast.play();
                    utils.addSomethingToRenderer(maimBlast, 'stageOne');
                } else {
                    var scratchAnim = utils.getAnimationB({
                        spritesheetName: 'UtilityAnimations1',
                        animationName: 'scratch',
                        speed: .35,
                        transform: [unit.position.x, unit.position.y, .3, .3]
                    });
                    scratchAnim.rotation = Math.random() * Math.PI;
                    scratchAnim.play();
                    utils.addSomethingToRenderer(scratchAnim, 'stageOne');
                }

            });

            mineExplosionAnimation.play();
            utils.addSomethingToRenderer(mineExplosionAnimation, 'stageOne');
            smokeExplosionAnimation.play();
            utils.addSomethingToRenderer(smokeExplosionAnimation, 'stageOne');
            utils.removeSomethingFromRenderer(stateZero);
            utils.removeSomethingFromRenderer(stateOne);
            utils.removeSomethingFromRenderer(stateTwo);
            utils.removeSomethingFromRenderer(stateThree);
            utils.removeSomethingFromRenderer(mineCracks);
            globals.currentGame.removeBody(mine);
        }
        commandObj.command.done();
    }

    var mineAbility = new Ability({
        name: 'Mine',
        key: 'f',
        type: 'key',
        icon: utils.createDisplayObject('MineIcon'),
        method: layMine,
        title: 'Mine',
        description: 'Lay an explosive mine.',
        hotkey: 'F',
        energyCost: 15,
        augments: [{
            name: 'maim',
            slowAmount: .5,
            duration: 3000,
            icon: utils.createDisplayObject('Maim'),
            title: 'Maim',
            description: 'Slow enemies hit by blast for 2 seconds.'
        },
        {
            name: 'pressure plate',
            icon: utils.createDisplayObject('PressuredPlate'),
            title: 'Pressure Plate',
            description: 'Cause enemy contact to detonate mine.'
        },
        {
            name: 'shrapnel',
            icon: utils.createDisplayObject('Shrapnel'),
            title: 'Shrapnel',
            description: 'Increase blast radius.'
        }]
    })

    var healAbility = new Ability({
        name: 'Heal',
        icon: utils.createDisplayObject('HealIcon'),
        title: 'Heal',
        description: ['Heal a friendly unit.'],
        hotkey: 'A',
        energyCost: 2,
        healAmount: 2,
        manualDispatch: true,
        autoCastEnabled: true,
        getAutoCastVariable: function() {
            return this.attackAutocast;
        }.bind(medic),
        autoCast: function() {
            this.attackAutocast = !this.attackAutocast;
        }.bind(medic),
        augments: [{
            name: 'pure priorities',
            hpThreshold: .75,
            icon: utils.createDisplayObject('PurePriorities'),
            title: 'Pure Priorities',
            description: 'Reduce healing cost to 0 when target\'s life is below 75%.',
        },
        {
            name: 'lightest touch',
            rangeDelta: 40,
            healDelta: 1.0,
            icon: utils.createDisplayObject('LightestTouch'),
            title: 'Lightest Touch',
            description: 'Increase healing range and healing amount.',
            equip: function(unit) {
                unit.range += this.rangeDelta;
                unit.getAbilityByName('Heal').healAmount += this.healDelta;
            },
            unequip: function(unit) {
                unit.range -= this.rangeDelta;
                unit.getAbilityByName('Heal').healAmount -= this.healDelta;
            }
        },
        {
            name: 'Sacrifice',
            icon: utils.createDisplayObject('Sacrifice'),
            title: 'Sacrifice',
            reviveMultiplier: .5,
            description: ['Fire replenishment missile upon death.', 'Halve time to revive.'],
            equip: function(unit) {
                unit.sacrificeFunction = function(event) {
                    utils.applyToUnitsByTeam(function(team) {
                        return unit.team == team;
                    }, function(teamUnit) {
                        return !teamUnit.isDead;
                    }, function(livingAlliedUnit) {
                        combospiritinit.play();
                        var combospiritAnimation = utils.getAnimationB({
                            spritesheetName: 'MedicAnimations2',
                            animationName: 'combospirit',
                            speed: 1.5,
                            loop: true,
                            transform: [livingAlliedUnit.position.x, livingAlliedUnit.position.y, 2.0, 2.0]
                        });
                        combospiritAnimation.play();
                        var projectileOptions = {
                            damage: 0,
                            speed: 1.0,
                            displayObject: combospiritAnimation,
                            target: livingAlliedUnit,
                            owningUnit: unit,
                            impactType: 'collision',
                            collisionFunction: function(otherUnit) {
                                return otherUnit.team == this.owningUnit.team && otherUnit != this.owningUnit;
                            },
                            originOffset: 0,

                            autoSend: true,
                            impactExtension: function(target) {
                                fullheal.play();
                                var replenAnimation = utils.getAnimationB({
                                    spritesheetName: 'UtilityAnimations1',
                                    animationName: 'manasteal',
                                    speed: .8,
                                    transform: [target.position.x, target.position.y+10, 1.2, 1.2]
                                });
                                replenAnimation.play();
                                replenAnimation.tint = 0xfb32b1;
                                utils.addSomethingToRenderer(replenAnimation, 'stageOne');

                                livingAlliedUnit.currentHealth = livingAlliedUnit.maxHealth;
                                livingAlliedUnit.currentEnergy = livingAlliedUnit.maxEnergy;
                            }
                        }
                        var projectile = new Projectile(projectileOptions);
                    })
                }
                Matter.Events.on(unit, 'death', unit.sacrificeFunction);
                unit.reviveTime *= this.reviveMultiplier;
            },
            unequip: function(unit) {
                Matter.Events.off(unit, 'death', unit.sacrificeFunction)
                unit.reviveTime *= 1/this.reviveMultiplier;
            }
        }]
    })

    var rad = options.radius || 25;
    var unitProperties = $.extend({
        unitType: 'Medic',
        health: 40,
        energy: 60,
        hitboxWidth: 35,
        hitboxHeight: 60,
        itemsEnabled: true,
        damageLabel: "Heal: ",
        damageMember: function() {
            return this.getAbilityByName('Heal').healAmount;
        },
        energyRegenerationRate: 1.5,
        portrait: utils.createDisplayObject('MedicPortrait'),
        wireframe: utils.createDisplayObject('MedicGroupPortrait'),
        graveSpriteName: 'MedicGrave',
        team: options.team || 4,
        priority: 5,
        name: options.name,
        heightAnimation: 'up',
        abilities: [healAbility, secretStepAbility, mineAbility],
        death: function() {
            var self = this;
            var anim = utils.getAnimationB({
                spritesheetName: 'MedicAnimations2',
                animationName: 'MedicDeath',
                speed: .2,
                fadeAway: true,
                fadeTime: 3200,
                transform: [self.deathPosition.x, self.deathPosition.y, 1, 1]
            });
            utils.addSomethingToRenderer(anim);
            this.corpse = anim;

            var shadow = utils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stageNTwo', scale: {x: .75, y: .75}, position: utils.clonePosition(self.deathPosition, {y: 22})})
            utils.fadeSpriteOverTime(shadow, 1500);

            anim.play();
            deathSoundBlood.play();
            deathSound.play();
        },
        _init: function() {
            Object.defineProperty(this, 'position', {
                get: function() {
                    var me = this.shadow || this.body;
                    return me.position;
                },
                set: function(value) {
                    Matter.Body.setPosition(this.body, value);
                }
            });

            $.extend(this, rv);
            this.revivableInit();

            $.extend(this, aug);
            this.augmentableInit();
        }}, options);

    return UC({
            givenUnitObj: medic,
            renderChildren: rc,
            radius: rad,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [healsound, mineSound, deathSoundBlood, deathSound, mineBeep, mineExplosion, footstepSound, shroudSound, combospiritinit, fullheal, unitProperties.portrait, unitProperties.wireframe],
            unit: unitProperties,
            moveable: {
                moveSpeed: 2.15,
                walkAnimations: walkAnimations,
            }, attacker: {
                attackAnimations: healAnimations,
                cooldown: 333,
                honeRange: 300,
                range: rad*2 + 10,
                canAttackAndMove: false,
                canAttackPredicate: function(target) {
                    var thisAbility = this.getAbilityByName('Heal');
                    var currentAugment = thisAbility.currentAugment || {name: 'null'};
                    var ppBypass = (currentAugment.name == 'pure priorities' && (target.currentHealth < (target.maxHealth * currentAugment.hpThreshold)));
                    return (this.currentEnergy >= thisAbility.energyCost || ppBypass);
                }.bind(medic),
                attack: function(target) {
                    //get current augment
                    var thisAbility = this.getAbilityByName('Heal');
                    var currentAugment = thisAbility.currentAugment || {name: 'null'};
                    var ppBypass = (currentAugment.name == 'pure priorities' && (target.currentHealth < (target.maxHealth * currentAugment.hpThreshold)));

                    var abilityTint = 0x80ba80;
                    utils.makeSpriteBlinkTint({sprite: this.getAbilityByName('Heal').icon, tint: abilityTint, speed: 100});
                    healsound.play();

                    var healAnimation = utils.getAnimationB({
                        spritesheetName: 'MedicAnimations1',
                        animationName: 'heal',
                        speed: 1.2,
                        transform: [target.position.x + ((Math.random() * 20) - 10), target.position.y + ((Math.random() * 30) - 20), 1, 1]
                    });

                    healAnimation.alpha = Math.max(.7, Math.random());
                    healAnimation.play();
                    utils.addSomethingToRenderer(healAnimation, 'stageOne');

                    if(!ppBypass)
                        this.currentEnergy -= thisAbility.energyCost;

                    target.currentHealth += thisAbility.healAmount;
                    if(target.currentHealth >= target.maxHealth)
                        target.currentHealth = target.maxHealth;
                },
                attackHoneTeamPredicate: function(team) {
                    return this.team == team;
                },
                canTargetUnit: function(unit) {
                    if(unit.isTargetable && unit != this && unit.team == this.team) {
                        return (unit.currentHealth < unit.maxHealth);
                    }
                    return false;
                },
            },
    });
}
