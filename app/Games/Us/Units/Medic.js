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
import {
    globals
} from '@core/Fundamental/GlobalState';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';

export default function Medic(options) {
    var medic = {};

    options = options || {};

    //animation settings
    var walkSpeed = 0.9;
    var walkSpeedBonus = 0.25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.medicN.spineData);
    var spineSouth = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.medicS.spineData);
    var spineWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.medicW.spineData);
    var spineEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.medicW.spineData);
    var spineSouthWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.medicSW.spineData);
    var spineSouthEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.medicSW.spineData);
    var spineNorthWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.medicNW.spineData);
    var spineNorthEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool.medicNW.spineData);

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

    var sc = {
        x: 0.33,
        y: 0.33
    };
    var updiagsc = {
        x: 0.345,
        y: 0.345
    };
    var flipupdiagsc = {
        x: -1 * updiagsc.x,
        y: updiagsc.y
    };
    var downdiagsc = {
        x: 0.325,
        y: 0.325
    };
    var flipdowndiagsc = {
        x: -1 * downdiagsc.x,
        y: downdiagsc.y
    };
    var adjustedDownsc = {
        x: 0.35,
        y: 0.35
    };
    var adjustedUpsc = {
        x: 0.36,
        y: 0.37
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
                x: 1.0,
                y: 1.0
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
                x: 0.33,
                y: 0.33
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
            scale: adjustedUpsc,
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
            scale: adjustedDownsc,
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
            scale: updiagsc,
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
            scale: flipupdiagsc,
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
            scale: flipdowndiagsc,
            rotate: 'none',
            visible: false,
            offset: {
                x: 0,
                y: yOffset
            }
        }, {
            id: 'downLeft',
            data: spineSouthWest,
            scale: downdiagsc,
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

    var healSound = gameUtils.getSound('healsound.wav', {
        volume: 0.006,
        rate: 1.3
    });
    var manaHealSound = gameUtils.getSound('healsound.wav', {
        volume: 0.006,
        rate: 0.9
    });
    var deathSoundBlood = gameUtils.getSound('marinedeathbloodsound.wav', {
        volume: 0.06,
        rate: 1.2
    });
    var deathSound = gameUtils.getSound('medicdeathsound.wav', {
        volume: 0.2,
        rate: 1.05
    });
    var blockSound = gameUtils.getSound('blocksound.wav', {
        volume: 0.1,
        rate: 2.2
    });
    var criticalHitSound = gameUtils.getSound('criticalhit.wav', {
        volume: 0.03,
        rate: 1.0
    });
    var criticalHitSound2 = gameUtils.getSound('criticalhit.wav', {
        volume: 0.03,
        rate: 1.75
    });
    var dodgeSound = gameUtils.getSound('ursula_dodge.mp3', {
        volume: 0.4,
        rate: 1.3
    });

    var holdPositionSound = gameUtils.getSound('ursula_dodge.mp3', {
        volume: 0.4,
        rate: 1.15
    });

    var combospiritinit = gameUtils.getSound('combospiritinit.wav', {
        volume: 0.03,
        rate: 1.0
    });
    var fullheal = gameUtils.getSound('fullheal.wav', {
        volume: 0.05,
        rate: 1.0
    });
    var footstepSound = gameUtils.getSound('secretstep.wav', {
        volume: 0.02,
        rate: 1.1
    });
    var shroudSound = gameUtils.getSound('cloakshroud.wav', {
        volume: 0.1,
        rate: 1.5
    });
    var ahSound = gameUtils.getSound('ursulastim.wav', {
        volume: 0.1,
        rate: 1.5
    });

    var secretStep = function(destination, commandObj) {
        //alter destination for foot destination
        destination = mathArrayUtils.clonePosition(destination, {
            y: -this.footOffset || -20
        });

        //get current augment
        var thisAbility = this.getAbilityByName('Vanish');
        var ghostAugment = thisAbility.isAugmentEnabled('ghost');
        var fleetFeetAugment = thisAbility.isAugmentEnabled('fleet feet');
        var softLandingAugment = thisAbility.isAugmentEnabled('soft landing');

        //remove a free step if we have one
        if (medic.freeSteps) {
            medic.buffs['freeSecretStep' + medic.freeSteps].removeBuff({
                detached: true
            });
        }

        var shadow = Matter.Bodies.circle(this.position.x, this.position.y, 20, {
            restitution: 0.95,
            frictionAir: 0,
            mass: options.mass || 5,
            isSensor: true,
        });
        shadow.isShadow = true;
        shadow.isSelectionBody = true;
        shadow.isMovingAndStationaryBody = true;
        shadow.unitRedirect = medic;

        shadow.renderChildren = [{
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: {
                x: 0.75,
                y: 0.75
            },
            stage: "stageNTwo",
            offset: {
                x: 0,
                y: 22
            },
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
        shadow.renderlings.selectionPending = this.body.renderlings.selectionPending;
        shadow.renderlings.selectionPending.preferredBody = shadow;
        shadow.renderlings.selected = this.body.renderlings.selected;
        shadow.renderlings.selected.preferredBody = shadow;

        shadow.oneFrameOverrideInterpolation = true;


        //set the prevailing unit indicator to the shadow
        this.proxyBody = shadow;
        if (globals.currentGame.unitSystem.selectedUnit == this) {
            globals.currentGame.unitSystem.selectedUnit = this;
        }

        var secretStepSpeed = fleetFeetAugment ? 20 : 10;
        gameUtils.sendBodyToDestinationAtSpeed(shadow, destination, secretStepSpeed, true, true);
        Matter.Events.trigger(globals.currentGame, 'secretStep', {
            performingUnit: this
        });

        //send collector events
        if(fleetFeetAugment) {
            Matter.Events.trigger(globals.currentGame, fleetFeetCollEventName, {value: fleetFeetAugment.energyReduction});
        }

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
                var footprint = graphicsUtils.createDisplayObject('Footprint', {
                    where: 'stageNOne',
                    position: mathArrayUtils.clonePosition(shadow.position, {
                        x: 0,
                        y: 22
                    }),
                    alpha: 0.7,
                    scale: {
                        x: 0.7,
                        y: 0.7
                    }
                });
                footprint.rotation = footprintDirection;
                graphicsUtils.addSomethingToRenderer(footprint);
                graphicsUtils.fadeSprite(footprint, 0.006);
                footprint.visible = false;
                if (everyOther)
                    footstepSound.play();
                everyOther = !everyOther;
                if (lastFootprint)
                    lastFootprint.visible = true;
                lastFootprint = footprint;
            }
        });

        Matter.Events.on(shadow, 'onCollide', function(pair) {
            var otherBody = pair.pair.bodyB == shadow ? pair.pair.bodyA : pair.pair.bodyB;
            var otherUnit = otherBody.unit;
            Matter.Events.trigger(medic, 'secretStepCollision', {
                otherUnit: otherUnit
            });
            if (ghostAugment) {
                if (otherUnit && otherUnit != medic) {
                    otherUnit.petrify({
                        duration: ghostAugment.duration,
                        petrifyingUnit: medic
                    });

                    Matter.Events.trigger(globals.currentGame, petCollEventName, {value: 1});
                }
            }
        });

        var originalOrigin = {
            x: this.position.x,
            y: this.position.y
        };
        var originalDistance = Matter.Vector.magnitude(Matter.Vector.sub(destination, this.position));

        this.isTargetable = false;
        gameUtils.moveUnitOffScreen(this);
        this.stop();

        this.getAbilityByName("Vanish").manuallyDisabled = true;

        var removeSelf = globals.currentGame.addTickCallback(function() {
            if (gameUtils.bodyRanOffStage(shadow) || mathArrayUtils.distanceBetweenPoints(shadow.position, originalOrigin) >= originalDistance) {
                this.getAbilityByName("Vanish").manuallyDisabled = false;
                var x = shadow.position.x;
                var y = shadow.position.y;
                if (x < 0) x = 5;
                if (x > gameUtils.getPlayableWidth()) x = gameUtils.getPlayableWidth() - 5;
                if (y < 0) y = 5;
                if (y > gameUtils.getPlayableHeight()) y = gameUtils.getPlayableHeight() - 5;

                this.body.oneFrameOverrideInterpolation = true;
                Matter.Body.setPosition(this.body, {
                    x: x,
                    y: y
                });
                this.isTargetable = true;
                this.shadow = null;

                //save the renderlings from being destroyed
                shadow.renderlings.energybarbackground.preferredBody = null;
                delete shadow.renderlings.energybarbackground;
                shadow.renderlings.energybar.preferredBody = null;
                delete shadow.renderlings.energybar;
                shadow.renderlings.energybarfade.preferredBody = null;
                delete shadow.renderlings.energybarfade;
                shadow.renderlings.selectionPending.preferredBody = null;
                delete shadow.renderlings.selectionPending;
                shadow.renderlings.selected.preferredBody = null;
                delete shadow.renderlings.selected;

                //reinstate the prevailing unit indicator
                this.proxyBody = null;
                if (globals.currentGame.unitSystem.selectedUnit == this) {
                    globals.currentGame.unitSystem.selectedUnit = this;
                }

                globals.currentGame.removeBody(shadow);
                globals.currentGame.invalidateTimer(footprintTimer);
                Matter.Events.trigger(this, 'secretStepLand', {
                    destination: destination
                });
                commandObj.command.done();

                var self = this;
                if (softLandingAugment) {
                    var duration = softLandingAugment.duration;
                    this.becomeHidden(duration);
                    Matter.Events.trigger(globals.currentGame, slCollEventName, {value: duration/1000});
                }
            }
        }.bind(this));
        gameUtils.deathPact(shadow, removeSelf);
    };

    var fleetFeetCollEventName = "ffCollectorEventName";
    var slCollEventName = "slCollectorEventName";
    var petCollEventName = "petCollectorEventName";
    var secretStepAbility = new Ability({
        name: 'Vanish',
        key: 'd',
        type: 'click',
        icon: graphicsUtils.createDisplayObject('SecretStepIcon'),
        method: secretStep,
        handlesOwnBlink: true,
        title: 'Vanish',
        description: 'Safely relocate to anywhere on the map.',
        hotkey: 'D',
        energyCost: 10,
        predicates: [function(commandObj) {
            return mathArrayUtils.distanceBetweenPoints(commandObj.command.target, commandObj.command.unit.position) != 0;
        }],
        augments: [{
                name: 'fleet feet',
                icon: graphicsUtils.createDisplayObject('FleetFeet'),
                title: 'Fleet Feet',
                energyReduction: 3,
                description: 'Increase vanishing speed and reduce energy cost by 3.',
                equip: function(unit) {
                    unit.getAbilityByName('Vanish').energyCost -= this.energyReduction;
                },
                unequip: function(unit) {
                    unit.getAbilityByName('Vanish').energyCost += this.energyReduction;
                },
                collector: {
                    eventName: fleetFeetCollEventName,
                    presentation: {
                        labels: ["Energy saved"]
                    }
                }
            }, {
                name: 'ghost',
                duration: 3000,
                icon: graphicsUtils.createDisplayObject('Petrify'),
                title: 'Ghost',
                description: ['Petrify units for 3 seconds by vanishing through them.'],
                collector: {
                    eventName: petCollEventName,
                    presentation: {
                        labels: ["Enemies petrified"]
                    }
                }
            },
            {
                name: 'soft landing',
                icon: graphicsUtils.createDisplayObject('SoftLanding'),
                title: 'Soft Landing',
                duration: 3000,
                description: 'Become hidden for 3 seconds after vanishing.',
                collector: {
                    eventName: slCollEventName,
                    presentation: {
                        labels: ["Time spent hidden"],
                        suffixes: ["seconds"]
                    }
                }
            }
        ]
    });

    var mineSound = gameUtils.getSound('laymine.mp3', {
        volume: 0.06,
        rate: 0.8
    });
    var mineBeep = gameUtils.getSound('minebeep.wav', {
        volume: 0.03,
        rate: 7
    });
    var mineExplosion = gameUtils.getSound('mineexplosion2.wav', {
        volume: 0.35,
        rate: 1.7
    });
    var mineDamage = 25;
    var layMine = function(commandObj) {
        //get current augment
        var thisAbility = this.getAbilityByName('Mine');
        var pressurePlateAugment = thisAbility.isAugmentEnabled('pressure plate');
        var shrapnelAugment = thisAbility.isAugmentEnabled('shrapnel');
        var scorchAugment = thisAbility.isAugmentEnabled('scorch');

        var mine = Matter.Bodies.circle(this.position.x, this.position.y + 20, 15, {
            isSensor: true,
            noWire: true,
        });
        mine.isMine = true;

        globals.currentGame.addBody(mine);
        mineSound.play();
        Matter.Events.trigger(globals.currentGame, 'layMine', {
            performingUnit: this
        });
        Matter.Events.trigger(this, 'layMine');

        //remove a free mine if we have one
        if (this.freeMines) {
            this.buffs['freeMine' + this.freeMines].removeBuff({
                detached: true
            });
        }

        var mineCracks = graphicsUtils.createDisplayObject('MineCracks', {
            scale: {
                x: 0.75,
                y: 0.75
            },
            alpha: 1
        });
        var stateZero = graphicsUtils.createDisplayObject('MineZero', {
            scale: {
                x: 0.75,
                y: 0.75
            },
            alpha: 0.8
        });
        var stateOne = graphicsUtils.createDisplayObject('MineOne', {
            scale: {
                x: 0.75,
                y: 0.75
            },
            alpha: 0.8
        });
        var stateTwo = graphicsUtils.createDisplayObject('MineTwo', {
            scale: {
                x: 0.75,
                y: 0.75
            },
            alpha: 1
        });
        var stateThree = graphicsUtils.createDisplayObject('MineThree', {
            scale: {
                x: 0.75,
                y: 0.75
            },
            alpha: 0.8
        });

        var medic = this;
        var blastRadius = shrapnelAugment ? 160 : 120;
        var primaryExplosionRadius = shrapnelAugment ? 85 : 60;
        var mineState = {
            state: 0,
            id: mathArrayUtils.uuidv4(),
            position: mine.position,
            blastRadius: blastRadius,
            damage: mineDamage,
            primaryExplosionRadius: primaryExplosionRadius
        };
        graphicsUtils.addSomethingToRenderer(stateZero, 'stage', {
            position: mineState.position
        });
        graphicsUtils.addSomethingToRenderer(mineCracks, 'stage', {
            position: mineState.position
        });

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
            transform: [mineState.position.x, mineState.position.y - 30, 3, 3]
        });
        smokeExplosionAnimation.alpha = 0.6;
        if (shrapnelAugment) {
            mineExplosionAnimation.tint = 0x6bafaf;
        }
        if (scorchAugment) {
            mineExplosionAnimation.tint = 0xd2cb1b;
        }
        if (scorchAugment && shrapnelAugment) {
            mineExplosionAnimation.tint = 0xf0df00;
        }
        graphicsUtils.makeSpriteSize(smokeExplosionAnimation, {
            x: blastRadius * 2,
            y: blastRadius * 2
        });
        graphicsUtils.makeSpriteSize(mineExplosionAnimation, {
            x: blastRadius * 3.0,
            y: blastRadius * 3.0
        });

        var mineTimer;
        if (pressurePlateAugment) {
            Matter.Events.on(mine, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == mine ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit;
                if (otherUnit && otherUnit.team != this.team) {
                    mine.explode();
                }
            }.bind(this));
            graphicsUtils.addSomethingToRenderer(stateOne, 'stage', {
                position: mineState.position
            });
            graphicsUtils.addSomethingToRenderer(stateThree, 'stage', {
                position: mineState.position
            });
            mineTimer = globals.currentGame.addTimer({
                name: mineState.id,
                gogogo: true,
                timeLimit: 1000,
                killsSelf: true,
                callback: function() {
                    if (mineState.state === 0) {
                        stateThree.visible = false;
                        stateZero.visible = false;
                        mineState.state = 1;
                    } else if (mineState.state == 1) {
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
                    if (mineState.state === 0) {
                        mineBeep.play();
                        graphicsUtils.addSomethingToRenderer(stateOne, 'stage', {
                            position: mineState.position
                        });
                        graphicsUtils.removeSomethingFromRenderer(stateZero);
                        mineState.state += 1;
                    } else if (mineState.state == 1) {
                        mineBeep.play();
                        graphicsUtils.addSomethingToRenderer(stateTwo, 'stage', {
                            position: mineState.position
                        });
                        graphicsUtils.removeSomethingFromRenderer(stateOne);
                        mineState.state += 1;
                    } else if (mineState.state == 2) {
                        mineBeep.play();
                        graphicsUtils.addSomethingToRenderer(stateThree, 'stage', {
                            position: mineState.position
                        });
                        graphicsUtils.removeSomethingFromRenderer(stateTwo);
                        mineState.state += 1;
                    } else if (mineState.state == 3) {
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
        Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {
            entity: mine
        });

        mine.explode = function() {
            mineExplosion.play();
            gameUtils.applyToUnitsByTeam(function(team) {
                return medic.team != team;
            }, function(unit) {
                return (mathArrayUtils.distanceBetweenBodies(mine, unit.body) <= (mineState.blastRadius + unit.body.circleRadius) && unit.canTakeAbilityDamage);
            }.bind(this), function(unit) {
                var dmg = mineState.damage;
                if (mathArrayUtils.distanceBetweenBodies(mine, unit.body) <= mineState.primaryExplosionRadius) {
                    dmg = dmg * 2;
                }
                unit.sufferAttack(dmg, medic, {dodgeable: false});
                var variation = Math.random() * 0.3;
                var maimBlast = gameUtils.getAnimation({
                    spritesheetName: 'MedicAnimations1',
                    animationName: 'maimblast',
                    speed: 0.4 + variation,
                    transform: [unit.position.x, unit.position.y, 1 + variation, 1 + variation]
                });
                maimBlast.rotation = Math.random() * Math.PI;
                maimBlast.play();
                graphicsUtils.addSomethingToRenderer(maimBlast, 'stageOne');
            });

            if (scorchAugment) {
                var scorchedAreaBody = Matter.Bodies.circle(mine.position.x, mine.position.y, blastRadius/2.0, {
                    restitution: 0.95,
                    frictionAir: 0,
                    mass: options.mass || 5,
                    isSensor: true,
                });
                globals.currentGame.addBody(scorchedAreaBody);
                Matter.Body.scale(scorchedAreaBody, 1, 0.5);
                Matter.Events.on(scorchedAreaBody, 'onCollide', function(pair) {
                    var otherBody = pair.pair.bodyB == scorchedAreaBody ? pair.pair.bodyA : pair.pair.bodyB;
                    var otherUnit = otherBody.unit;
                    if (otherUnit != null && otherUnit.team != medic.team) {
                        otherUnit.maim({
                            duration: scorchAugment.duration,
                            maimingUnit: medic
                        });
                        Matter.Events.trigger(globals.currentGame, scorchEventName, {value: 1});
                    }
                }.bind(this));

                Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {
                    entity: scorchedAreaBody
                });

                var maimArea = graphicsUtils.createDisplayObject('ScorchedArea', {
                    alpha: 1.0,
                    tint: 0x340606
                });
                scorchedAreaBody.renderChildren = [{
                    id: 'maimArea',
                    data: maimArea,
                    stage: 'stageNOne',
                }];

                graphicsUtils.graduallyTint(maimArea, 0x000000, 0x65002d, 500, null, 250);

                graphicsUtils.makeSpriteSize(maimArea, blastRadius);
                gameUtils.doSomethingAfterDuration(() => {
                    graphicsUtils.fadeSpriteOverTime({
                        sprite: maimArea,
                        duration: 300,
                        callback: function() {
                            globals.currentGame.removeBody(scorchedAreaBody);
                        }
                    });
                }, scorchAugment.duration);
            }

            if (shrapnelAugment) {
                //extra mine explosion graphic
                var scale = 3.5;
                var tint = 0xffffff;
                var mineMaimExplosionAnimation = gameUtils.getAnimation({
                    spritesheetName: 'MedicAnimations2',
                    animationName: 'additionalexplosion',
                    speed: 2.2,
                    transform: [mineState.position.x, mineState.position.y - 30, scale, scale]
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

        if (commandObj) {
            commandObj.command.done();
        }
    };

    var scorchEventName = 'scorchCollEvent';
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
                name: 'scorch',
                duration: 10000,
                icon: graphicsUtils.createDisplayObject('Maim'),
                title: 'Scorch',
                description: 'Leave an explosion area which maims enemy units for 10 seconds.',
                collector: {
                    eventName: scorchEventName,
                    presentation: {
                        labels: ["Enemies maimed"]
                    }
                }
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
            }
        ]
    });

    var ppCollEventName = 'ppCollEvent';
    var sacCollEventName = 'sacCollEvent';
    var continuousHealthNeeded = 15;
    var enragePPTime = 2000;
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
                hpGivenTally: 0,
                icon: graphicsUtils.createDisplayObject('PurePriorities'),
                title: 'Pure Priorities',
                description: ['Reduce healing cost to 0 when ally\'s life is below 75%.', 'Enrage ally for 2 seconds upon giving 15 health.'],
                collector: {
                    eventName: ppCollEventName,
                    init: function() {
                        this.freeHealing = 0;
                        this.enragesGranted = 0;
                    },
                    presentation: {
                        labels: ["Healing done for free", "Times enrage granted"],
                        values: ["freeHealing", "enragesGranted"],
                    }
                },
                equip: function(unit) {
                    this.hpGivenTally = 0;
                    this.resetListener = Matter.Events.on(globals.currentGame, 'EnterLevel', () => {
                        this.hpGivenTally = 0;
                    });
                },
                unequip: function(unit) {
                    Matter.Events.off(globals.currentGame, 'EnterLevel', this.resetListener);
                }
            },
            {
                name: 'lightest touch',
                rangeDelta: 60,
                healDelta: 1.5,
                icon: graphicsUtils.createDisplayObject('LightestTouch'),
                title: 'Lightest Touch',
                description: ['Increase healing amount.', 'Increase healing range.'],
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
                        Matter.Events.trigger(globals.currentGame, sacCollEventName, {value: 1});
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
                                tracking: false,
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
                                        transform: [target.position.x, target.position.y + 10, 1.2, 1.2]
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
                    unit.reviveTime *= 1 / this.reviveMultiplier;
                },
                collector: {
                    eventName: sacCollEventName,
                    presentation: {
                        labels: ["Times activated"]
                    }
                }
            }
        ]
    });

    var rsADuration = 3000;
    var rsDAmount = 25;
    var raisedStakes = new Passive({
        title: 'Raised Stakes',
        aggressionDescription: ['Agression Mode (Upon hold position)', 'Triple healing cost and healing amount for 3 seconds.'],
        defenseDescription: ['Defensive Mode (When hit by melee attack)', 'Deal damage equal to half of Ursula\'s total grit back to attacker.'],
        unequippedDescription: ['Unequipped Mode (Upon level start)', 'Self and allies gain 4 grit for length of outing.'],
        textureName: 'RaisedStakes',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 4000,
        aggressionEventName: 'holdPosition',
        aggressionCooldown: 4000,
        aggressionDuration: rsADuration,
        passiveAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(medic, true);
            alliesAndSelf.forEach((unit) => {
                var addedGrit = 4; //Math.floor(unit.getTotalGrit() / 3.0);
                if (addedGrit > 0) {
                    unit.addGritAddition(addedGrit);
                    gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', function() {
                        unit.removeGritAddition(addedGrit);
                    });
                }
            });
        },
        defenseAction: function(event) {
            //damage attacker
            let grit = medic.getTotalGrit() / 2.0;
            if (grit > 0) {
                var attacker = event.performingUnit;
                if (!attacker || attacker.isDead || !attacker.isMelee) return;

                attacker.sufferAttack(grit, medic, {dodgeable: false});
                var maimBlast = gameUtils.getAnimation({
                    spritesheetName: 'MedicAnimations1',
                    animationName: 'maimblast',
                    speed: 1.0,
                    transform: [attacker.position.x, attacker.position.y, 0.85, 0.85]
                });
                maimBlast.tint = 0xf1ca00;
                maimBlast.rotation = Math.random() * Math.PI;
                maimBlast.play();
                graphicsUtils.addSomethingToRenderer(maimBlast, 'stageOne');
                criticalHitSound2.play();

                return {value: grit};
            }
        },
        aggressionAction: function(event) {
            medic.applyBuff({
                id: "stakesHealBuff" + mathArrayUtils.getId(),
                duration: rsADuration,
                textureName: 'RaisedStakesBuff',
                applyChanges: function() {
                    var healAbility = medic.getAbilityByName('Heal');
                    healAbility.energyCost *= 3;
                    healAbility.healAmount *= 3;
                },
                removeChanges: function() {
                    var healAbility = medic.getAbilityByName('Heal');
                    healAbility.energyCost /= 3;
                    healAbility.healAmount /= 3;
                }
            });

            return {value: rsADuration/1000};
        },
        collector: {
            aggressionLabel: 'Duration of 3x healing',
            aggressionSuffix: 'seconds',
            defensiveLabel: 'Damage dealt',
        }
    });

    var wwDDuration = 3000;
    var wwADuration = 5000;
    var wickedWays = new Passive({
        title: 'Wicked Ways',
        aggressionDescription: ['Agression Mode (Upon dealing damage)', 'Self and allies gain 10 hp and regenerate hp at 2x rate for 5 seconds.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Condemn attacker for 3 seconds.'],
        unequippedDescription: ['Unequipped Mode (Upon level start)', 'Self and allies regenerate hp at 2x rate for 3 seconds.'],
        passiveSystemMessage: ['Condemned units suffer -1 armor and heal condemner for 15hp upon death.'],
        textureName: 'WickedWays',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 5000,
        aggressionEventName: 'dealDamage',
        aggressionCooldown: 3000,
        aggressionDuration: wwADuration,
        passiveAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(medic, true);
            alliesAndSelf.forEach((unit) => {
                unit.applyBuff({
                    id: "wwHealthGain",
                    textureName: 'WickedWaysHealingBuff',
                    duration: 3000,
                    applyChanges: function() {
                        unit.healthRegenerationMultiplier *= 2;
                    },
                    removeChanges: function() {
                        unit.healthRegenerationMultiplier /= 2;
                    }
                });
            });
        },
        defenseAction: function(event) {
            var attackingUnit = event.performingUnit;
            if (attackingUnit.condemn) {
                attackingUnit.condemn({
                    duration: wwDDuration,
                    condemningUnit: medic,
                    onHealingRecieved: function(options) {
                        Matter.Events.trigger(globals.currentGame, 'WickedWaysCollector', {mode: 'defensePassive', collectorPayload: {value: options.healingReceived}});
                    }
                });
            }
        },
        aggressionAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(medic, true);
            alliesAndSelf.forEach((unit) => {
                unit.applyBuff({
                    id: "wwHealthGain",
                    textureName: 'WickedWaysHealingBuff',
                    duration: wwADuration,
                    applyChanges: function() {
                        unit.healthRegenerationMultiplier *= 2;
                        unitUtils.applyHealthGainAnimationToUnit(unit);
                        unit.giveHealth(10, medic);
                        healSound.play();
                    },
                    removeChanges: function() {
                        unit.healthRegenerationMultiplier /= 2;
                    }
                });
            });

            return {value: wwADuration/1000};
        },
        collector: {
            aggressionLabel: 'Duration of 2x regeneration',
            aggressionSuffix: 'seconds',
            defensiveLabel: 'Healing from condemned',
            defensiveFormat: function(v) {
                return v.toFixed(1);
            }
        }
    });

    var dodgeGain = 2;
    var dodgeMax = 10;
    var allyDodgeGain = 20;
    var totalDodgeGained = 0;
    var slADuration = 3000;
    var addedDodgeRolls = 3;
    var slyLogic = new Passive({
        title: 'Sly Logic',
        aggressionDescription: ['Agression Mode (Upon heal)', 'Grant allies ' + allyDodgeGain + ' dodge for 3 seconds.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Roll dodge % twice for incoming attack and gain ' + dodgeGain + ' dodge (up to 10) for length of outing.'],
        unequippedDescription: ['Unequipped Mode (Upon level start)', 'Gain 3 dodge for length of outing.'],
        textureName: 'SlyLogic',
        unit: medic,
        defenseEventName: 'preDodgeSufferAttack',
        defenseCooldown: 5000,
        aggressionEventName: 'performHeal',
        aggressionCooldown: 3000,
        aggressionDuration: slADuration,
        passiveAction: function(event) {
            var addedDodge = 3; //Math.floor(medic.getTotalDodge() / 4.0);
            if (addedDodge > 0) {
                medic.addDodgeAddition(addedDodge);
                gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', function() {
                    medic.removeDodgeAddition(addedDodge);
                });
            }
        },
        defenseAction: function(event) {
            event.attackContext.dodgeRolls = 2;
            if(totalDodgeGained >= dodgeMax) {
                return;
            }
            totalDodgeGained += dodgeGain;
            medic.addDodgeAddition(dodgeGain);
            var dodgeUp = graphicsUtils.addSomethingToRenderer("DodgeBuff", {
                where: 'stageTwo',
                position: medic.position
            });
            gameUtils.attachSomethingToBody({
                something: dodgeUp,
                body: medic.body
            });
            graphicsUtils.floatSprite(dodgeUp, {
                runs: 50
            });
            gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', function() {
                medic.removeDodgeAddition(dodgeGain);
                totalDodgeGained = 0;
            });

            return {value: 1};
        },
        aggressionAction: function(event) {
            var allies = gameUtils.getUnitAllies(medic);
            allies.forEach((ally) => {
                ally.applyDodgeBuff({duration: slADuration, amount: allyDodgeGain});
            });

            return {value: slADuration/1000};
        },
        collector: {
            aggressionLabel: 'Ally\'s duration of increased dodge',
            aggressionSuffix: 'seconds',
            defensiveLabel: 'Dodges performed',
        }
    });

    var ffDDuration = 3000;
    var familiarFace = new Passive({
        title: 'Familiar Face',
        aggressionDescription: ['Agression Mode (Upon dealing damage)', 'Gain a free vanish (up to two).'],
        defenseDescription: ['Defensive Mode (When hit)', 'Increase movement speed for 3 seconds.'],
        unequippedDescription: ['Unequipped Mode (Upon level start)', 'Gain a free vanish.'],
        textureName: 'FamiliarFace',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 1000,
        defenseDuration: ffDDuration,
        aggressionEventName: 'dealDamage',
        aggressionCooldown: 6000,
        aggressionPredicate: function() {
            if (!medic.freeSteps) {
                medic.freeSteps = 0;
            }
            return medic.freeSteps < 2;
        },
        passiveAction: function(event) {
            if (!medic.freeSteps) {
                medic.freeSteps = 0;
            }

            medic.applyBuff({
                id: 'freeSecretStep' + (medic.freeSteps + 1),
                textureName: 'SecretStepBuff',
                duration: null,
                applyChanges: function() {
                    medic.freeSteps += 1;

                    if (!medic.freeSecretStepBuffs) {
                        medic.freeSecretStepBuffs = [];
                    }
                    medic.freeSecretStepBuffs.push('freeSecretStep' + medic.freeSteps);

                    var ss = medic.getAbilityByName('Vanish');
                    ss.manuallyEnabled = true;
                    ss.byPassEnergyCost = true;
                },
                removeChanges: function() {
                    mathArrayUtils.removeObjectFromArray('freeSecretStep' + medic.freeSteps, medic.freeSecretStepBuffs);
                    medic.freeSteps -= 1;
                    if (medic.freeSteps == 0) {
                        var ss = medic.getAbilityByName('Vanish');
                        ss.manuallyEnabled = false;
                        ss.byPassEnergyCost = false;
                    }
                }
            });
        },
        defenseAction: function(event) {
            medic.applyBuff({
                id: 'familiarFaceSpeed',
                textureName: 'SpeedBuff',
                duration: ffDDuration,
                applyChanges: function() {
                    medic.moveSpeed += 0.5;
                },
                removeChanges: function() {
                    medic.moveSpeed -= 0.5;
                }
            });

            return {value: ffDDuration/1000};
        },
        aggressionAction: function(event) {
            medic.applyBuff({
                id: 'freeSecretStep' + (medic.freeSteps + 1),
                textureName: 'SecretStepBuff',
                duration: null,
                applyChanges: function() {
                    medic.freeSteps += 1;

                    if (!medic.freeSecretStepBuffs) {
                        medic.freeSecretStepBuffs = [];
                    }
                    medic.freeSecretStepBuffs.push('freeSecretStep' + medic.freeSteps);

                    var ss = medic.getAbilityByName('Vanish');
                    ss.manuallyEnabled = true;
                    ss.byPassEnergyCost = true;
                },
                removeChanges: function() {
                    mathArrayUtils.removeObjectFromArray('freeSecretStep' + medic.freeSteps, medic.freeSecretStepBuffs);
                    medic.freeSteps -= 1;
                    if (medic.freeSteps == 0) {
                        var ss = medic.getAbilityByName('Vanish');
                        ss.manuallyEnabled = false;
                        ss.byPassEnergyCost = false;
                    }
                }
            });

            return {value: 1};
        },
        collector: {
            aggressionLabel: 'Vanishes gained',
            defensiveLabel: 'Duration of increased speed',
            defensiveSuffix: 'seconds',
        }
    });

    var dtDDuration = 3000;
    var dtADuration = 3000;
    var dtHandler = {};
    var deepThought = new Passive({
        title: 'Deep Thought',
        originalAggressionDescription: ['Agression Mode (Upon kill)', 'Activate defense passive\'s aggression mode.'],
        aggressionDescription: ['Agression Mode (Upon kill)', 'Activate defense passive\'s aggression mode.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Lay mine and petrify attacker for 3 seconds.'],
        unequippedDescription: ['Unequipped Mode (Upon level start)', 'Gain a free mine.'],
        textureName: 'DeepThought',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 6000,
        aggressionEventName: 'kill',
        aggressionCooldown: 8000,
        passiveAction: function(event) {
            if (!medic.freeMines) {
                medic.freeMines = 0;
            }

            medic.applyBuff({
                id: 'freeMine' + (medic.freeMines + 1),
                textureName: 'MineBuff',
                duration: null,
                applyChanges: function() {
                    medic.freeMines += 1;

                    if (!medic.freeMineBuffs) {
                        medic.freeMineBuffs = [];
                    }
                    medic.freeMineBuffs.push('freeMine' + medic.freeMines);

                    var ss = medic.getAbilityByName('Mine');
                    ss.manuallyEnabled = true;
                    ss.byPassEnergyCost = true;
                },
                removeChanges: function() {
                    mathArrayUtils.removeObjectFromArray('freeMine' + medic.freeMines, medic.freeMineBuffs);
                    medic.freeMines -= 1;
                    if (medic.freeMines == 0) {
                        var ss = medic.getAbilityByName('Mine');
                        ss.manuallyEnabled = false;
                        ss.byPassEnergyCost = false;
                    }
                }
            });
        },
        defensePredicate: function(event) {
            return event.attackContext.isProjectile;
        },
        defenseAction: function(event) {
            var attackingUnit = event.performingUnit;
            medic.getAbilityByName('Mine').method.call(medic, null);
            attackingUnit.petrify({
                duration: dtDDuration,
                petrifyingUnit: medic
            });

            return {value: 1};
        },
        preStart: function(type) {
            var passive = this;
            if (medic.defensePassive) {
                deepThought.aggressionAction = function() {
                    medic.defensePassive.aggressionAction();
                    return {value: 1};
                };
                if(!medic.defensePassive.deepThoughtBypassAggPredicate) {
                    deepThought.aggressionPredicate = medic.defensePassive.aggressionPredicate;
                }
                deepThought.aggressionDescription = medic.defensePassive.aggressionDescription;
                deepThought.aggressionDescription[0] = deepThought.originalAggressionDescription[0];
            }
            if (type == 'attackPassive') {
                var fe = Matter.Events.on(medic, 'defensePassiveEquipped', function(event) {
                    Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fe);
                    Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fu);
                    // Matter.Events.trigger(globals.currentGame.unitSystem, 'unitPassiveRefresh', {});
                    deepThought.aggressionAction = function() {
                        event.passive.aggressionAction();
                        deepThought.aggressionPredicate = medic.defensePassive.aggressionPredicate;
                        return {value: 1};
                    };
                    deepThought.aggressionDescription = medic.defensePassive.aggressionDescription;
                    deepThought.aggressionDescription[0] = deepThought.originalAggressionDescription[0];
                    passive.start('attackPassive');
                });
                var fu = Matter.Events.on(medic, 'defensePassiveUnequipped', function(event) {
                    Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fe);
                    Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fu);
                    deepThought.aggressionAction = null;
                    deepThought.aggressionPredicate = null;
                    deepThought.aggressionDescription = deepThought.originalAggressionDescription;
                    passive.start('attackPassive');
                });
                dtHandler.fe = fe;
                dtHandler.fu = fu;
            }
        },
        preStop: function(type) {
            Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fe);
            Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fu);
        },
        collector: {
            aggressionLabel: 'Aggression-mode activations',
            defensiveLabel: 'Mines laid/enemies petrified',
        }
    });

    var efADuration = 4000;
    var efDDuration = 4000;
    var energyGain = 15;
    var ppDamage = 12;
    var elegantForm = new Passive({
        title: 'Proper Posture',
        aggressionDescription: ['Agression Mode (When hit by projectile)', 'Gain ' + energyGain + ' energy.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Reduce damage of projectile to 1 and deal ' + ppDamage + ' damage to attacker.'],
        unequippedDescription: ['Unequipped Mode (Upon level start)', 'Gain 15 energy.'],
        textureName: 'ElegantForm',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: efDDuration,
        aggressionEventName: 'preSufferAttack',
        aggressionCooldown: efADuration,
        passiveAction: function(event) {
            medic.giveEnergy(15);
            unitUtils.applyEnergyGainAnimationToUnit(medic);
        },
        defensePredicate: function(event) {
            return event.attackContext.isProjectile;
        },
        defenseAction: function(event) {
            //delay the attack for a second
            gameUtils.doSomethingAfterDuration(() => {
                var attacker = event.performingUnit;
                if (attacker.isDead) return;

                attacker.sufferAttack(ppDamage, medic, {dodgeable: false});
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
            var damageReduced = damageObj.damage - 1;
            if(damageReduced == 0) {
                damageReduced = 0;
            }
            damageObj.damage = 1;

            //add block graphic
            let offset = 40;
            let offsetLocation = mathArrayUtils.addScalarToVectorTowardDestination(medic.position, event.attackContext.projectileData.startLocation, offset);
            let attachmentOffset = Matter.Vector.sub(offsetLocation, medic.position);
            let block = graphicsUtils.addSomethingToRenderer('Block', {
                where: 'stageOne',
                position: medic.position,
                scale: {
                    x: 1.0,
                    y: 1.0
                }
            });
            gameUtils.attachSomethingToBody({
                something: block,
                body: medic.body,
                offset: attachmentOffset,
                deathPactSomething: true
            });
            block.rotation = mathArrayUtils.pointInDirection(medic.position, offsetLocation);
            graphicsUtils.flashSprite({
                sprite: block,
                toColor: 0x8d01be,
                duration: 100,
                times: 4
            });
            graphicsUtils.fadeSpriteOverTimeLegacy(block, 500);

            blockSound.play();

            return {value: damageReduced};
        },
        deepThoughtBypassAggPredicate: true,
        aggressionPredicate: function(event) {
            return event.attackContext.isProjectile;
        },
        aggressionAction: function(event) {
            medic.giveEnergy(energyGain);
            unitUtils.applyEnergyGainAnimationToUnit(medic);
            manaHealSound.play();

            return {value: energyGain};
        },
        collector: {
            aggressionLabel: 'Energy gained',
            defensiveLabel: 'Projectile damage prevented',
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
        dodgeSound: dodgeSound,
        holdPositionSound: holdPositionSound,
        damageLabel: "Heal: ",
        damageMember: function() {
            return this.getAbilityByName('Heal').healAmount;
        },
        animationSpecificHitboxes: [{
                animation: walkAnimations.up,
                height: 8,
                width: 25,
                offset: {
                    x: 10,
                    y: -8
                }
            },
            {
                animation: walkAnimations.down,
                height: 8,
                width: 25,
                offset: {
                    x: -10,
                    y: -8
                }
            },
            {
                animation: walkAnimations.left,
                height: 8,
                width: 25,
                offset: {
                    x: -8,
                    y: -18
                }
            },
            {
                animation: walkAnimations.right,
                height: 8,
                width: 25,
                offset: {
                    x: 8,
                    y: -18
                }
            },
            {
                animation: walkAnimations.upLeft,
                height: 8,
                width: 25,
                offset: {
                    x: 8,
                    y: -18
                }
            },
            {
                animation: walkAnimations.upRight,
                height: 8,
                width: 25,
                offset: {
                    x: -8,
                    y: -18
                }
            },
            {
                animation: walkAnimations.downLeft,
                height: 8,
                width: 25,
                offset: {
                    x: -8,
                    y: -18
                }
            },
            {
                animation: walkAnimations.downRight,
                height: 8,
                width: 25,
                offset: {
                    x: 8,
                    y: -18
                }
            }
        ],
        damageAdditionType: 'heal',
        energyRegenerationRate: 1.5,
        healthRegenerationRate: 0.5,
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
        }
    }, options);

    return UC({
        givenUnitObj: medic,
        renderChildren: rc,
        radius: rad,
        mass: options.mass || 8,
        mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
        slaves: [healSound, dodgeSound, holdPositionSound, manaHealSound, blockSound, criticalHitSound, mineSound, deathSoundBlood, deathSound, mineBeep, mineExplosion, footstepSound, shroudSound, combospiritinit, fullheal, unitProperties.portrait, unitProperties.wireframe],
        unit: unitProperties,
        moveable: {
            moveSpeed: 2.35,
            walkAnimations: walkAnimations,
        },
        attacker: {
            attackAnimations: healAnimations,
            cooldown: 333,
            honeRange: 300,
            range: rad * 2 + 25,
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
                graphicsUtils.makeSpriteBlinkTint({
                    sprite: this.getAbilityByName('Heal').icon,
                    tint: abilityTint,
                    speed: 100
                });
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

                var healAmount = thisAbility.healAmount + this.getAdditionSum('heal');
                var actualHealingAmount = target.giveHealth(healAmount, this);

                if(ppAugment) {
                    ppAugment.hpGivenTally += actualHealingAmount;
                    if(ppAugment.hpGivenTally > continuousHealthNeeded) {
                        ppAugment.hpGivenTally -= continuousHealthNeeded;
                        target.enrage({duration: enragePPTime, amount: 3});
                        Matter.Events.trigger(globals.currentGame, ppCollEventName, {enragesGranted: 1});
                    }
                }

                if (!ppBypass) {
                    this.spendEnergy(thisAbility.energyCost);
                } else {
                    //we've healed at no cost, send the collector event
                    Matter.Events.trigger(globals.currentGame, ppCollEventName, {freeHealing: actualHealingAmount});
                }
            },
            attackHoneTeamPredicate: function(team) {
                return this.team == team;
            },
            canTargetUnit: function(unit) {
                if (unit.isTargetable && unit != this && unit.team == this.team) {
                    return (unit.currentHealth < unit.maxHealth);
                }
                return false;
            },
        },
    });
}
