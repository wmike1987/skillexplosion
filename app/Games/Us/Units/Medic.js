import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import styles from '@utils/Styles.js';
import Passive from '@core/Unit/UnitPassive.js';
import rv from '@core/Unit/_Revivable.js';
import Projectile from '@core/Unit/UnitProjectile.js';
import {globals} from '@core/Fundamental/GlobalState';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/GameUtils.js';

export default function Medic(options) {
    var medic = {};

    options = options || {};

    //animation settings
    var walkSpeed = 0.9;
    var walkSpeedBonus = 0.25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources.medicN.spineData);
    var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources.medicS.spineData);
    var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources.medicW.spineData);
    var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources.medicW.spineData);
    var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources.medicSW.spineData);
    var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources.medicSW.spineData);
    var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources.medicNW.spineData);
    var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources.medicNW.spineData);

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

    var attackAnimSpeed = 3;
    var healAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'shoot',
            speed: attackAnimSpeed,
            times: 1,
        }),
    };

    var otherAnimations = {

    };

    var sc = {x: 0.33, y: 0.33};
    var updiagsc = {x: 0.345, y: 0.345};
    var flipupdiagsc = {x: -1 * updiagsc.x, y: updiagsc.y};
    var downdiagsc = {x: 0.325, y: 0.325};
    var flipdowndiagsc = {x: -1 * downdiagsc.x, y: downdiagsc.y};
    var adjustedDownsc = {x: 0.35, y: 0.35};
    var adjustedUpsc = {x: 0.36, y: 0.37};
    var flipsc = {x: -1 * sc.x, y: sc.y};
    var yOffset = 22;
    var rc = [
    {
        id: 'selected',
        data: 'IsometricSelected',
        scale: {x: 0.54, y: 0.54},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },
    {
        id: 'selectionPending',
        data: unitUtils.getPendingAnimation(),
        scale: {x: 0.33, y: 0.33},
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
        scale: {x: 0.55, y: 0.55},
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 22}}];

    var healSound = gameUtils.getSound('healsound.wav', {volume: 0.006, rate: 1.3});
    var manaHealSound = gameUtils.getSound('healsound.wav', {volume: 0.006, rate: 0.9});
    var deathSoundBlood = gameUtils.getSound('marinedeathbloodsound.wav', {volume: 0.06, rate: 1.2});
    var deathSound = gameUtils.getSound('medicdeathsound.wav', {volume: 0.2, rate: 1.05});
    var blockSound = gameUtils.getSound('blocksound.wav', {volume: 0.1, rate: 2.2});
    var criticalHitSound = gameUtils.getSound('criticalhit.wav', {volume: 0.03, rate: 1.0});

    var combospiritinit = gameUtils.getSound('combospiritinit.wav', {volume: 0.03, rate: 1.0});
    var fullheal = gameUtils.getSound('fullheal.wav', {volume: 0.05, rate: 1.0});
    var footstepSound = gameUtils.getSound('secretstep.wav', {volume: 0.02, rate: 1.1});
    var shroudSound = gameUtils.getSound('cloakshroud.wav', {volume: 0.1, rate: 1.5});
    var ahSound = gameUtils.getSound('ursulastim.wav', {volume: 0.1, rate: 1.5});

    var secretStep = function(destination, commandObj) {
        //alter destination for foot destination
        destination = mathArrayUtils.clonePosition(destination, {y: -this.footOffset || -20});

        //get current augment
        var thisAbility = this.getAbilityByName('Secret Step');
        var ghostAugment = thisAbility.isAugmentEnabled('ghost');
        var fleetFeetAugment = thisAbility.isAugmentEnabled('fleet feet');
        var softLandingAugment = thisAbility.isAugmentEnabled('soft landing');

        //remove a free step if we have one
        if(medic.freeSteps) {
            medic.buffs['freeSecretStep' + medic.freeSteps].removeBuff({detached: true});
        }

        var shadow = Matter.Bodies.circle(this.position.x, this.position.y, 20, {
          restitution: 0.95,
          frictionAir: 0,
          mass: options.mass || 5,
          isSensor: true,
        });
        shadow.isShadow = true;

        shadow.renderChildren = [{
          id: 'shadow',
          data: 'IsoShadowBlurred',
          scale: {x: 0.75, y: 0.75},
          stage: "stageNTwo",
          offset: {x: 0, y: 22},
          alpha: 0.5
        }];

        //medic reference to shadow
        this.shadow = shadow;

        globals.currentGame.addBody(shadow);

        //attach the energy bar to the shadow
        shadow.renderlings.energybarbackground = this.body.renderlings.energybarbackground;
        shadow.renderlings.energybarbackground.preferredBody = shadow;
        shadow.renderlings.energybar = this.body.renderlings.energybar;
        shadow.renderlings.energybar.preferredBody = shadow;
        shadow.renderlings.energybarfade = this.body.renderlings.energybarfade;
        shadow.renderlings.energybarfade.preferredBody = shadow;

        shadow.oneFrameOverrideInterpolation = true;

        var secretStepSpeed = fleetFeetAugment ? 22 : 10;
        gameUtils.sendBodyToDestinationAtSpeed(shadow, destination, secretStepSpeed, true, true);
        Matter.Events.trigger(globals.currentGame, 'secretStep', {performingUnit: this});

        //play smoke animation
        //play animation
        var dashAnimation = gameUtils.getAnimation({
            spritesheetName: 'MedicAnimations2',
            animationName: 'medicdash',
            speed: 0.5,
            transform: [this.position.x, this.position.y, 2, 5]
        });

        dashAnimation.play();
        dashAnimation.alpha = 0.35;
        var dashTint = fleetFeetAugment ? 0xff0067 : 0x636362;
        dashTint = ghostAugment ? 0xf9f9f5 : dashTint;
        dashTint = softLandingAugment ? 0x9954f6 : dashTint;
        dashTint = softLandingAugment && ghostAugment ? 0x1fc3b4 : dashTint;
        dashTint = softLandingAugment && fleetFeetAugment ? 0xffe600 : dashTint;
        dashTint = ghostAugment && fleetFeetAugment ? 0x29904c : dashTint;
        dashTint = ghostAugment && fleetFeetAugment && softLandingAugment ? 0xf6372b : dashTint;
        dashAnimation.tint = dashTint;
        dashAnimation.rotation = mathArrayUtils.pointInDirection(this.position, destination, 'north');
        graphicsUtils.addSomethingToRenderer(dashAnimation, 'stageNOne');

        //create footprints
        var footprintFrequency = fleetFeetAugment ? 30 : 60;
        var footprintDirection = mathArrayUtils.pointInDirection(this.position, destination);
        var lastFootprint = null;
        var everyOther = true;
        shroudSound.play();
        var footprintTimer = globals.currentGame.addTimer({
            name: 'footprints' + this.unitId,
            gogogo: true,
            timeLimit: footprintFrequency,
            callback: function() {
                var footprint = graphicsUtils.createDisplayObject('Footprint', {where: 'stageNOne', position: mathArrayUtils.clonePosition(shadow.position, {x: 0, y: 22}), alpha: 0.7, scale: {x:0.7, y:0.7}});
                footprint.rotation = footprintDirection;
                graphicsUtils.addSomethingToRenderer(footprint);
                graphicsUtils.fadeSprite(footprint, 0.006);
                footprint.visible = false;
                if(everyOther)
                    footstepSound.play();
                everyOther = !everyOther;
                if(lastFootprint)
                    lastFootprint.visible = true;
                lastFootprint = footprint;
            }
        });

        Matter.Events.on(shadow, 'onCollide', function(pair) {
            var otherBody = pair.pair.bodyB == shadow ? pair.pair.bodyA : pair.pair.bodyB;
            var otherUnit = otherBody.unit;
            Matter.Events.trigger(medic, 'secretStepCollision', {otherUnit: otherUnit});
            if(ghostAugment) {
                if(otherUnit && otherUnit != medic) {
                    otherUnit.petrify(ghostAugment.duration);
                }
            }
        });

        var originalOrigin = {x: this.position.x, y: this.position.y};
        var originalDistance = Matter.Vector.magnitude(Matter.Vector.sub(destination, this.position));

        this.isTargetable = false;
        gameUtils.moveUnitOffScreen(this);
        this.stop();

        this.getAbilityByName("Secret Step").manuallyDisabled = true;

        var removeSelf = globals.currentGame.addTickCallback(function() {
          if(gameUtils.bodyRanOffStage(shadow) || mathArrayUtils.distanceBetweenPoints(shadow.position, originalOrigin) >= originalDistance) {
              this.getAbilityByName("Secret Step").manuallyDisabled = false;
              var x = shadow.position.x;
              var y = shadow.position.y;
              if(x < 0) x = 5;
              if(x > gameUtils.getPlayableWidth()) x = gameUtils.getPlayableWidth()-5;
              if(y < 0) y = 5;
              if(y > gameUtils.getPlayableHeight()) y = gameUtils.getPlayableHeight()-5;

              this.body.oneFrameOverrideInterpolation = true;
              Matter.Body.setPosition(this.body, {x: x, y: y});
              this.isTargetable = true;
              this.shadow = null;

              //save the renderlings from being destroyed
              shadow.renderlings.energybarbackground.preferredBody = null;
              delete shadow.renderlings.energybarbackground;
              shadow.renderlings.energybar.preferredBody = null;
              delete shadow.renderlings.energybar;
              shadow.renderlings.energybarfade.preferredBody = null;
              delete shadow.renderlings.energybarfade;

              globals.currentGame.removeBody(shadow);
              globals.currentGame.invalidateTimer(footprintTimer);
              Matter.Events.trigger(this, 'secretStepLand', {destination: destination});
              commandObj.command.done();

              var self = this;
              if(softLandingAugment) {
                  var duration = softLandingAugment.duration;
                  this.becomeHidden(duration);
              }
          }
      }.bind(this));
        gameUtils.deathPact(shadow, removeSelf);
    };

    var secretStepAbility = new Ability({
        name: 'Secret Step',
        key: 'd',
        type: 'click',
        icon: graphicsUtils.createDisplayObject('SecretStepIcon'),
        method: secretStep,
        handlesOwnBlink: true,
        title: 'Secret Step',
        description: 'Safely relocate to anywhere on the map.',
        hotkey: 'D',
        energyCost: 10,
        predicates: [function(commandObj) {
            return mathArrayUtils.distanceBetweenPoints(commandObj.command.target, commandObj.command.unit.position) != 0;
        }],
        augments: [
        {
            name: 'fleet feet',
            icon: graphicsUtils.createDisplayObject('FleetFeet'),
            title: 'Fleet Feet',
            description: 'Increase stepping speed and reduce energy cost by 2.',
            equip: function(unit) {
                unit.getAbilityByName('Secret Step').energyCost -= 2;
            },
            unequip: function(unit) {
                unit.getAbilityByName('Secret Step').energyCost += 2;
            }
        },{
            name: 'ghost',
            duration: 3000,
            icon: graphicsUtils.createDisplayObject('Petrify'),
            title: 'Ghost',
            description: ['Petrify units for 3 seconds by stepping through them.'],
            // systemMessage: 'Petrified units cannot move, attack, nor be targeted by normal attacks.'
        },
        {
            name: 'soft landing',
            icon: graphicsUtils.createDisplayObject('SoftLanding'),
            title: 'Soft Landing',
            duration: 3000,
            description: 'Become hidden for 3 seconds after stepping.'
        }]
    });

    var mineSound = gameUtils.getSound('laymine.mp3', {volume: 0.06, rate: 0.8});
    var mineBeep = gameUtils.getSound('minebeep.wav', {volume: 0.03, rate: 7});
    var mineExplosion = gameUtils.getSound('mineexplosion2.wav', {volume: 0.35, rate: 1.7});
    var mineDamage = 25;
    var layMine = function(commandObj) {
        //get current augment
        var thisAbility = this.getAbilityByName('Mine');
        var pressurePlateAugment = thisAbility.isAugmentEnabled('pressure plate');
        var shrapnelAugment = thisAbility.isAugmentEnabled('shrapnel');
        var maimAugment = thisAbility.isAugmentEnabled('maim');

        var mine = Matter.Bodies.circle(this.position.x, this.position.y+20, 15, {
            isSensor: true,
            noWire: true,
        });
        mine.isMine = true;

        globals.currentGame.addBody(mine);
        mineSound.play();
        Matter.Events.trigger(globals.currentGame, 'layMine', {performingUnit: this});
        Matter.Events.trigger(this, 'layMine');

        //play spine animation
        // this.isoManager.playSpecifiedAnimation('throw', this.isoManager.currentDirection);

        var mineCracks = graphicsUtils.createDisplayObject('MineCracks', {scale: {x: 0.75, y: 0.75}, alpha: 1});
        var stateZero = graphicsUtils.createDisplayObject('MineZero', {scale: {x: 0.75, y: 0.75}, alpha: 0.8});
        var stateOne = graphicsUtils.createDisplayObject('MineOne', {scale: {x: 0.75, y: 0.75}, alpha: 0.8});
        var stateTwo = graphicsUtils.createDisplayObject('MineTwo', {scale: {x: 0.75, y: 0.75}, alpha: 1});
        var stateThree = graphicsUtils.createDisplayObject('MineThree', {scale: {x: 0.75, y: 0.75}, alpha: 0.8});

        var medic = this;
        var blastRadius = shrapnelAugment ? 160 : 120;
        var primaryExplosionRadius = shrapnelAugment ? 85 : 60;
        var mineState = {state: 0, id: mathArrayUtils.uuidv4(), position: mine.position, blastRadius: blastRadius, damage: mineDamage, primaryExplosionRadius: primaryExplosionRadius};
        graphicsUtils.addSomethingToRenderer(stateZero, 'stage', {position: mineState.position});
        graphicsUtils.addSomethingToRenderer(mineCracks, 'stage', {position: mineState.position});

        //explode animation
        var mineExplosionAnimation = gameUtils.getAnimation({
			spritesheetName: 'MedicAnimations1',
			animationName: 'mineexplosion',
			speed: 2.8,
			transform: [mineState.position.x, mineState.position.y, 5.0, 5.0]
		});

        //smoke animation
        var smokeExplosionAnimation = gameUtils.getAnimation({
            spritesheetName: 'MedicAnimations1',
            animationName: 'explosion-c',
            speed: 0.4,
            transform: [mineState.position.x, mineState.position.y-30, 3, 3]
        });
        smokeExplosionAnimation.alpha = 0.6;
        if(shrapnelAugment) {
            mineExplosionAnimation.tint = 0x6bafaf;
        }
        if(maimAugment) {
            mineExplosionAnimation.tint = 0xd2cb1b;
        }
        if(maimAugment && shrapnelAugment) {
            mineExplosionAnimation.tint = 0xf0df00;
        }
        graphicsUtils.makeSpriteSize(smokeExplosionAnimation, {x: blastRadius*2, y: blastRadius*2});
        graphicsUtils.makeSpriteSize(mineExplosionAnimation, {x: blastRadius*3.0, y: blastRadius*3.0});

        var mineTimer;
        if(pressurePlateAugment) {
            Matter.Events.on(mine, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == mine ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit;
                if(otherUnit && otherUnit.team != this.team) {
                    mine.explode();
                }
            }.bind(this));
            graphicsUtils.addSomethingToRenderer(stateOne, 'stage', {position: mineState.position});
            graphicsUtils.addSomethingToRenderer(stateThree, 'stage', {position: mineState.position});
            mineTimer = globals.currentGame.addTimer({
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
            });
        } else {
            mineTimer = globals.currentGame.addTimer({
                name: mineState.id,
                runs: 4,
                timeLimit: 650,
                killsSelf: true,
                callback: function() {
                    if(mineState.state === 0) {
                        mineBeep.play();
                        graphicsUtils.addSomethingToRenderer(stateOne, 'stage', {position: mineState.position});
                        graphicsUtils.removeSomethingFromRenderer(stateZero);
                        mineState.state += 1;
                    } else if(mineState.state == 1) {
                        mineBeep.play();
                        graphicsUtils.addSomethingToRenderer(stateTwo, 'stage', {position: mineState.position});
                        graphicsUtils.removeSomethingFromRenderer(stateOne);
                        mineState.state += 1;
                    } else if(mineState.state == 2) {
                        mineBeep.play();
                        graphicsUtils.addSomethingToRenderer(stateThree, 'stage', {position: mineState.position});
                        graphicsUtils.removeSomethingFromRenderer(stateTwo);
                        mineState.state += 1;
                    } else if(mineState.state == 3) {
                        mine.explode();
                        Matter.Events.trigger(medic, 'mineExplode');
                    }
                }
            });
        }
        gameUtils.deathPact(mine, mineTimer);
        gameUtils.deathPact(mine, mineCracks);
        gameUtils.deathPact(mine, stateZero);
        gameUtils.deathPact(mine, stateOne);
        gameUtils.deathPact(mine, stateTwo);
        gameUtils.deathPact(mine, stateThree);
        Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {entity: mine});

        mine.explode = function() {
            mineExplosion.play();
            gameUtils.applyToUnitsByTeam(function(team) {return medic.team != team;}, function(unit) {
                return (mathArrayUtils.distanceBetweenBodies(mine, unit.body) <= (mineState.blastRadius + unit.body.circleRadius) && unit.canTakeAbilityDamage);
            }.bind(this), function(unit) {
                var dmg = mineState.damage;
                if(mathArrayUtils.distanceBetweenBodies(mine, unit.body) <= mineState.primaryExplosionRadius) {
                    dmg = dmg*2;
                }
                unit.sufferAttack(dmg, medic);
                if(maimAugment) {
                    if(!unit.isDead) {
                        unit.maim();
                    }
                }
                var variation = Math.random() * 0.3;
                var maimBlast = gameUtils.getAnimation({
                    spritesheetName: 'MedicAnimations1',
                    animationName: 'maimblast',
                    speed: 0.4+variation,
                    transform: [unit.position.x, unit.position.y, 1+variation, 1+variation]
                });
                maimBlast.rotation = Math.random() * Math.PI;
                maimBlast.play();
                graphicsUtils.addSomethingToRenderer(maimBlast, 'stageOne');
            });

            if(maimAugment || shrapnelAugment) {
                //extra mine explosion graphic
                var scale = maimAugment ? 2.5 : 3.5;
                var tint = maimAugment ? 0xf00000 : 0xffffff;
                var mineMaimExplosionAnimation = gameUtils.getAnimation({
                    spritesheetName: 'MedicAnimations2',
                    animationName: 'additionalexplosion',
                    speed: 2.2,
                    transform: [mineState.position.x, mineState.position.y-30, scale, scale]
                });
                mineMaimExplosionAnimation.tint = tint;
                graphicsUtils.addSomethingToRenderer(mineMaimExplosionAnimation, 'stageTwo');
                mineMaimExplosionAnimation.play();
            }

            mineExplosionAnimation.play();
            graphicsUtils.addSomethingToRenderer(mineExplosionAnimation, 'stageOne');
            smokeExplosionAnimation.play();
            graphicsUtils.addSomethingToRenderer(smokeExplosionAnimation, 'stageOne');
            graphicsUtils.removeSomethingFromRenderer(stateZero);
            graphicsUtils.removeSomethingFromRenderer(stateOne);
            graphicsUtils.removeSomethingFromRenderer(stateTwo);
            graphicsUtils.removeSomethingFromRenderer(stateThree);
            graphicsUtils.removeSomethingFromRenderer(mineCracks);
            globals.currentGame.removeBody(mine);
        };

        if(commandObj) {
            commandObj.command.done();
        }
    };

    var mineAbility = new Ability({
        name: 'Mine',
        key: 'f',
        type: 'key',
        icon: graphicsUtils.createDisplayObject('MineIcon'),
        method: layMine,
        title: 'Mine',
        description: 'Lay an explosive mine.',
        hotkey: 'F',
        energyCost: 15,
        augments: [{
            name: 'maim',
            duration: 5000,
            icon: graphicsUtils.createDisplayObject('Maim'),
            title: 'Maim',
            description: 'Maim enemies hit by blast for 5 seconds.',
            // systemMessage: 'Maimed enemies are slowed and suffer -1 armor.'
        },
        {
            name: 'pressure plate',
            icon: graphicsUtils.createDisplayObject('PressuredPlate'),
            title: 'Pressure Plate',
            description: 'Cause enemy contact to detonate mine.'
        },
        {
            name: 'shrapnel',
            icon: graphicsUtils.createDisplayObject('Shrapnel'),
            title: 'Shrapnel',
            description: 'Increase blast radius.'
        }]
    });

    var healAbility = new Ability({
        name: 'Heal',
        icon: graphicsUtils.createDisplayObject('HealIcon'),
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
            hpThreshold: 0.75,
            icon: graphicsUtils.createDisplayObject('PurePriorities'),
            title: 'Pure Priorities',
            description: 'Reduce healing cost to 0 when target\'s life is below 75%.',
        },
        {
            name: 'lightest touch',
            rangeDelta: 60,
            healDelta: 1.5,
            icon: graphicsUtils.createDisplayObject('LightestTouch'),
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
            icon: graphicsUtils.createDisplayObject('Sacrifice'),
            title: 'Sacrifice',
            reviveMultiplier: 0.5,
            description: ['Fire replenishment missile upon death.', 'Halve time to revive.'],
            equip: function(unit) {
                unit.sacrificeFunction = function(event) {
                    gameUtils.applyToUnitsByTeam(function(team) {
                        return unit.team == team;
                    }, function(teamUnit) {
                        return !teamUnit.isDead;
                    }, function(livingAlliedUnit) {
                        combospiritinit.play();
                        var combospiritAnimation = gameUtils.getAnimation({
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
                                var replenAnimation = gameUtils.getAnimation({
                                    spritesheetName: 'UtilityAnimations1',
                                    animationName: 'lifegain1',
                                    speed: 0.8,
                                    transform: [target.position.x, target.position.y+10, 1.2, 1.2]
                                });
                                replenAnimation.play();
                                replenAnimation.tint = 0xfb32b1;
                                graphicsUtils.addSomethingToRenderer(replenAnimation, 'stageOne');

                                livingAlliedUnit.giveHealth(livingAlliedUnit.maxHealth, medic);
                                livingAlliedUnit.giveEnergy(livingAlliedUnit.maxEnergy);
                            }
                        };
                        var projectile = new Projectile(projectileOptions);
                    });
                };
                Matter.Events.on(unit, 'death', unit.sacrificeFunction);
                unit.reviveTime *= this.reviveMultiplier;
            },
            unequip: function(unit) {
                Matter.Events.off(unit, 'death', unit.sacrificeFunction);
                unit.reviveTime *= 1/this.reviveMultiplier;
            }
        }]
    });

    var rsDDuration = 10000;
    var rsADuration = 3000;
    var rsDAmount = 25;
    var raisedStakes  = new Passive({
        title: 'Raised Stakes',
        aggressionDescription: ['Agression Mode (Upon hold position)', 'Double healing cost and healing amount for 3 seconds.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Gain ' + rsDAmount + ' grit for 10 seconds.'],
        textureName: 'RaisedStakes',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 2000,
        aggressionEventName: 'holdPosition',
        aggressionCooldown: 5000,
        defenseAction: function(event) {
            medic.applyBuff({name: "stakesGritBuff" + mathArrayUtils.getId(), duration: rsDDuration, textureName: 'GritBuff', applyChanges: function() {
                medic.addGritAddition(rsDAmount);
            }, removeChanges: function() {
                medic.removeGritAddition(rsDAmount);
            }});
        },
        aggressionAction: function(event) {
            medic.applyBuff({name: "stakesHealBuff" + mathArrayUtils.getId(), duration: rsADuration, textureName: 'RaisedStakesBuff', applyChanges: function() {
                var healAbility = medic.getAbilityByName('Heal');
                healAbility.energyCost *= 2;
                healAbility.healAmount *= 2;
            }, removeChanges: function() {
                var healAbility = medic.getAbilityByName('Heal');
                healAbility.energyCost /= 2;
                healAbility.healAmount /= 2;
            }});
        },
    });

    var wwDDuration = 3000;
    var wwADuration = 3000;
    var wickedWays  = new Passive({
        title: 'Wicked Ways',
        aggressionDescription: ['Agression Mode (Upon dealing damage)', 'Self and allies gain 10 hp and regenerate hp at 2x rate for 3 seconds.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Condemn attacker for 3 seconds.'],
        passiveSystemMessage: ['Condemned units suffer -1 armor and heal condemner for 15hp upon death.'],
        textureName: 'WickedWays',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 3000,
        aggressionEventName: 'dealDamage',
        aggressionCooldown: 8000,
        defenseAction: function(event) {
            var attackingUnit = event.performingUnit;
            attackingUnit.condemn(wwDDuration, medic);
        },
        aggressionAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(medic, true);
            alliesAndSelf.forEach((unit) => {
                unit.applyBuff({name: "wwHealthGain", textureName: 'WickedWaysHealingBuff', duration: wwADuration, applyChanges: function() {
                    unit.healthRegenerationMultiplier *= 2;
                    graphicsUtils.applyGainAnimationToUnit(unit, 0xc60006);
                    unit.giveHealth(10, medic);
                    healSound.play();
                }, removeChanges: function() {
                    unit.healthRegenerationMultiplier /= 2;
                }});
            });
        },
    });

    var slADuration = 3000;
    var slyLogic  = new Passive({
        title: 'Sly Logic',
        aggressionDescription: ['Agression Mode (Upon heal)', 'Grant allies 30 dodge for 3 seconds.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Dodge attack and gain 5 dodge for length of round.'],
        textureName: 'SlyLogic',
        unit: medic,
        defenseEventName: 'preDodgeSufferAttack',
        defenseCooldown: 8000,
        aggressionEventName: 'performHeal',
        aggressionCooldown: 7000,
        defenseAction: function(event) {
            event.damageObj.manualDodge = true;
            medic.addDodgeAddition(5);
            var dodgeUp = graphicsUtils.addSomethingToRenderer("DodgeBuff", {where: 'stageTwo', position: medic.position});
            gameUtils.attachSomethingToBody({something: dodgeUp, body: medic.body});
            graphicsUtils.floatSprite(dodgeUp, {runs: 50});
            gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', function() {
                medic.removeDodgeAddition(5);
            });
        },
        aggressionAction: function(event) {
            var allies = gameUtils.getUnitAllies(medic);
            allies.forEach((ally) => {
                ally.applyBuff({name: "slyLogicDodgeBuff", textureName: 'DodgeBuff', duration: slADuration, applyChanges: function() {
                    ally.addDodgeAddition(30);
                }, removeChanges: function() {
                    ally.removeDodgeAddition(30);
                }});
            });
        },
    });

    var ffDDuration = 3000;
    var ffADuration = 3000;
    var familiarFace  = new Passive({
        title: 'Familiar Face',
        aggressionDescription: ['Agression Mode (Upon dealing damage)', 'Gain a free secret step (up to two).'],
        defenseDescription: ['Defensive Mode (When hit)', 'Increase movement speed for 3 seconds.'],
        textureName: 'FamiliarFace',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 2000,
        aggressionEventName: 'dealDamage',
        aggressionCooldown: 6000,
        aggressionPredicate: function() {
            if(!medic.freeSteps) {
                medic.freeSteps = 0;
            }
            return medic.freeSteps < 2;
        },
        defenseAction: function(event) {
            medic.applyBuff({name: 'familiarFaceSpeed', textureName: 'SpeedBuff', duration: ffDDuration, applyChanges: function() {
                medic.moveSpeed += 0.5;
            }, removeChanges: function() {
                medic.moveSpeed -= 0.5;
            }});
        },
        aggressionAction: function(event) {
            medic.applyBuff({name: 'freeSecretStep' + (medic.freeSteps+1), textureName: 'SecretStepBuff', duration: null, applyChanges: function() {
                medic.freeSteps += 1;

                if(!medic.freeSecretStepBuffs) {
                    medic.freeSecretStepBuffs = [];
                }
                medic.freeSecretStepBuffs.push('freeSecretStep' + medic.freeSteps);

                var ss = medic.getAbilityByName('Secret Step');
                ss.manuallyEnabled = true;
                ss.byPassEnergyCost = true;
            }, removeChanges: function() {
                mathArrayUtils.removeObjectFromArray('freeSecretStep' + medic.freeSteps, medic.freeSecretStepBuffs);
                medic.freeSteps -= 1;
                if(medic.freeSteps == 0) {
                    var ss = medic.getAbilityByName('Secret Step');
                    ss.manuallyEnabled = false;
                    ss.byPassEnergyCost = false;
                }
            }});
        },
    });

    var dtDDuration = 3000;
    var dtADuration = 3000;
    var dtHandler = {};
    var deepThought  = new Passive({
        title: 'Deep Thought',
        originalAggressionDescription: ['Agression Mode (Upon kill)', 'Activate defense passive\'s aggression mode.'],
        aggressionDescription: ['Agression Mode (Upon kill)', 'Activate defense passive\'s aggression mode.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Lay mine and petrify attacker for 3 seconds.'],
        textureName: 'DeepThought',
        unit: medic,
        defenseEventName: 'sufferProjectile',
        defenseCooldown: 8000,
        aggressionEventName: 'kill',
        aggressionCooldown: 8000,
        defenseAction: function(event) {
            var attackingUnit = event.performingUnit;
            medic.getAbilityByName('Mine').method.call(medic, null);
            attackingUnit.petrify(3000);
        },
        preStart: function(type) {
            var passive = this;
            if(medic.defensePassive) {
                deepThought.aggressionAction = medic.defensePassive.aggressionAction;
                deepThought.aggressionDescription = medic.defensePassive.aggressionDescription;
                deepThought.aggressionDescription[0] = deepThought.originalAggressionDescription[0];
            }
            if(type == 'attackPassive') {
                var fe = Matter.Events.on(medic, 'defensePassiveEquipped', function(event) {
                    Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fe);
                    Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fu);
                    // Matter.Events.trigger(globals.currentGame.unitSystem, 'unitPassiveRefresh', {});
                    deepThought.aggressionAction = event.passive.aggressionAction;
                    deepThought.aggressionDescription = medic.defensePassive.aggressionDescription;
                    deepThought.aggressionDescription[0] = deepThought.originalAggressionDescription[0];
                    passive.start('attackPassive');
                });
                var fu = Matter.Events.on(medic, 'defensePassiveUnequipped', function(event) {
                    Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fe);
                    Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fu);
                    deepThought.aggressionAction = null;
                    deepThought.aggressionDescription = deepThought.originalAggressionDescription;
                    passive.start('attackPassive');
                });
                dtHandler.fe = fe;
                dtHandler.fu = fu;
            }
        },
        preStop: function(type) {
            if(type == 'attackPassive') {
                Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fe);
                Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fu);
            }
        }
    });

    var efADuration = 5000;
    var efDDuration = 5000;
    var energyGain = 15;
    var elegantForm  = new Passive({
        title: 'Elegant Form',
        aggressionDescription: ['Agression Mode (When hit by projectile)', 'Gain ' + energyGain + ' energy.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Reduce damage of projectile to 1 and deal 5 damage to attacker.'],
        textureName: 'ElegantForm',
        unit: medic,
        defenseEventName: 'sufferProjectile',
        defenseCooldown: efDDuration,
        aggressionEventName: 'sufferProjectile',
        aggressionCooldown: efADuration,
        defenseAction: function(event) {
            //delay the attack for a second
            gameUtils.doSomethingAfterDuration(() => {
                var attacker = event.performingUnit;
                if(attacker.isDead) return;

                attacker.sufferAttack(5, medic);
                var maimBlast = gameUtils.getAnimation({
                    spritesheetName: 'MedicAnimations1',
                    animationName: 'maimblast',
                    speed: 1.0,
                    transform: [attacker.position.x, attacker.position.y, 0.75, 0.75]
                });
                maimBlast.tint = 0xc317df;
                maimBlast.rotation = Math.random() * Math.PI;
                maimBlast.play();
                graphicsUtils.addSomethingToRenderer(maimBlast, 'stageOne');
                criticalHitSound.play();
            }, 200);

            var damageObj = event.damageObj;
            damageObj.damage = 1;

            //add block graphic
            let offset = 40;
            let offsetLocation = mathArrayUtils.addScalarToVectorTowardDestination(medic.position, event.projectileData.startLocation, offset);
            let attachmentOffset = Matter.Vector.sub(offsetLocation, medic.position);
            let block = graphicsUtils.addSomethingToRenderer('Block', {where: 'stageOne', position: medic.position, scale: {x: 1.0, y: 1.0}});
            gameUtils.attachSomethingToBody({something: block, body: medic.body, offset: attachmentOffset, deathPactSomething: true});
            block.rotation = mathArrayUtils.pointInDirection(medic.position, offsetLocation);
            graphicsUtils.flashSprite({sprite: block, toColor: 0x8d01be, duration: 100, times: 4});
            graphicsUtils.fadeSpriteOverTime(block, 500);

            blockSound.play();
        },
        aggressionAction: function(event) {
            medic.giveEnergy(energyGain);
            graphicsUtils.applyGainAnimationToUnit(medic, 0xad12a3);
            manaHealSound.play();
        }
    });

    var rad = options.radius || 25;
    var unitProperties = $.extend({
        unitType: 'Medic',
        health: 40,
        energy: 60,
        hitboxWidth: 28,
        hitboxHeight: 56,
        adjustHitbox: false,
        itemsEnabled: true,
        damageLabel: "Heal: ",
        damageMember: function() {
            return this.getAbilityByName('Heal').healAmount;
        },
        animationSpecificHitboxes: [{animation: walkAnimations.up, height: 8, width: 25, offset: {x: 10, y: -8}},
                                    {animation: walkAnimations.down, height: 8, width: 25, offset: {x: -10, y: -8}},
                                    {animation: walkAnimations.left, height: 8, width: 25, offset: {x: -8, y: -18}},
                                    {animation: walkAnimations.right, height: 8, width: 25, offset: {x: 8, y: -18}},
                                    {animation: walkAnimations.upLeft, height: 8, width: 25, offset: {x: 8, y: -18}},
                                    {animation: walkAnimations.upRight, height: 8, width: 25, offset: {x: -8, y: -18}},
                                    {animation: walkAnimations.downLeft, height: 8, width: 25, offset: {x: -8, y: -18}},
                                    {animation: walkAnimations.downRight, height: 8, width: 25, offset: {x: 8, y: -18}}],
        damageAdditionType: 'heal',
        energyRegenerationRate: 1.5,
        healthRegenerationRate: 0.25,
        portrait: graphicsUtils.createDisplayObject('MedicPortrait'),
        wireframe: graphicsUtils.createDisplayObject('MedicGroupPortrait'),
        graveSpriteName: 'MedicGrave',
        team: options.team || 4,
        priority: 5,
        consumeSound: ahSound,
        name: options.name,
        heightAnimation: 'up',
        abilities: [healAbility, secretStepAbility, mineAbility],
        passiveAbilities: [elegantForm, raisedStakes, wickedWays, deepThought, slyLogic, familiarFace],
        death: function() {
            var self = this;
            var anim = gameUtils.getAnimation({
                spritesheetName: 'MedicAnimations2',
                animationName: 'MedicDeath',
                speed: 0.2,
                fadeAway: true,
                fadeTime: 3200,
                transform: [self.deathPosition.x, self.deathPosition.y, 1, 1]
            });
            graphicsUtils.addSomethingToRenderer(anim);
            this.corpse = anim;

            var shadow = graphicsUtils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stageNTwo', scale: {x: 0.75, y: 0.75}, position: mathArrayUtils.clonePosition(self.deathPosition, {y: 22})});
            graphicsUtils.fadeSpriteOverTime(shadow, 1500);

            anim.play();
            deathSoundBlood.play();
            deathSound.play();
            return [shadow, anim];
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
            this.unlockerInit();
        }}, options);

    return UC({
            givenUnitObj: medic,
            renderChildren: rc,
            radius: rad,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [healSound, manaHealSound, blockSound, criticalHitSound, mineSound, deathSoundBlood, deathSound, mineBeep, mineExplosion, footstepSound, shroudSound, combospiritinit, fullheal, unitProperties.portrait, unitProperties.wireframe],
            unit: unitProperties,
            moveable: {
                moveSpeed: 2.35,
                walkAnimations: walkAnimations,
            }, attacker: {
                attackAnimations: healAnimations,
                cooldown: 333,
                honeRange: 300,
                range: rad*2 + 25,
                canAttackAndMove: false,
                canAttackExtension: function(target) {
                    var thisAbility = this.getAbilityByName('Heal');
                    var ppAugment = thisAbility.isAugmentEnabled('pure priorities');
                    var ppBypass = (ppAugment && (target.currentHealth < (target.maxHealth * ppAugment.hpThreshold)));
                    return (this.currentEnergy >= thisAbility.energyCost || ppBypass);
                }.bind(medic),
                attack: function(target) {
                    //get current augment
                    var thisAbility = this.getAbilityByName('Heal');
                    var ppAugment = thisAbility.isAugmentEnabled('pure priorities');
                    var ppBypass = (ppAugment && (target.currentHealth < (target.maxHealth * ppAugment.hpThreshold)));

                    var abilityTint = 0x80ba80;
                    graphicsUtils.makeSpriteBlinkTint({sprite: this.getAbilityByName('Heal').icon, tint: abilityTint, speed: 100});
                    healSound.play();

                    var healAnimation = gameUtils.getAnimation({
                        spritesheetName: 'MedicAnimations1',
                        animationName: 'heal',
                        speed: 1.2,
                        transform: [target.position.x + ((Math.random() * 20) - 10), target.position.y + ((Math.random() * 30) - 20), 1, 1]
                    });

                    healAnimation.alpha = Math.max(0.7, Math.random());
                    healAnimation.play();
                    graphicsUtils.addSomethingToRenderer(healAnimation, 'stageOne');

                    if(!ppBypass) {
                        this.spendEnergy(thisAbility.energyCost);
                    }

                    var healAmount = thisAbility.healAmount + this.getAdditionSum('heal');
                    target.giveHealth(healAmount, this);
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
