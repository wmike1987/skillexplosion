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
        volume: 0.007,
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
        volume: 0.06,
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
    var knifeImpactSound = gameUtils.getSound('knifeimpact.wav', {
        volume: 0.08,
        rate: 1.6
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
        var luckyLandingAugment = thisAbility.isAugmentEnabled('lucky landing');
        var softLandingAugment = thisAbility.isAugmentEnabled('soft landing');
        var caltropAugment = thisAbility.isAugmentEnabled('caltrop');
        var isFreeStep = false;

        //remove a free step if we have one
        if (medic.freeSteps) {
            medic.buffs['freeSecretStep' + medic.freeSteps].removeBuff({
                detached: true
            });
            isFreeStep = true;
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
            performingUnit: this,
            isFreeStep: isFreeStep
        });

        //send collector events
        if (fleetFeetAugment) {
            Matter.Events.trigger(globals.currentGame, fleetFeetCollEventName, {
                value: fleetFeetAugment.energyReduction
            });
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
        dashTint = luckyLandingAugment ? 0x9954f6 : dashTint;
        dashTint = luckyLandingAugment && ghostAugment ? 0x1fc3b4 : dashTint;
        dashTint = luckyLandingAugment && fleetFeetAugment ? 0xffe600 : dashTint;
        dashTint = ghostAugment && fleetFeetAugment ? 0x29904c : dashTint;
        dashTint = ghostAugment && fleetFeetAugment && luckyLandingAugment ? 0xf6372b : dashTint;
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
                graphicsUtils.fadeSpriteOverTime({
                    sprite: footprint,
                    duration: 500
                });
                footprint.visible = false;
                if (everyOther)
                    footstepSound.play();
                everyOther = !everyOther;
                if (lastFootprint)
                    lastFootprint.visible = true;
                lastFootprint = footprint;
            }
        });

        //Caltrop
        if (caltropAugment) {
            var caltrop = Matter.Bodies.circle(this.position.x, this.position.y + 20, 8, {
                isSensor: true,
                noWire: true,
            });

            globals.currentGame.addBody(caltrop);
            caltrop.isCaltrop = true;
            var caltropImage = graphicsUtils.addSomethingToRenderer('Caltrop', 'stage', {
                position: {
                    x: this.position.x,
                    y: this.position.y + 20
                }
            });
            graphicsUtils.flashSprite({
                sprite: caltropImage
            });

            gameUtils.deathPact(caltrop, caltropImage);

            Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {
                entity: caltrop
            });

            Matter.Events.on(caltrop, 'onCollide', function(pair) {
                if (caltrop.alreadyActivated) {
                    return;
                }

                var otherBody = pair.pair.bodyB == caltrop ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit;
                if (otherUnit && otherUnit.team != this.team) {
                    caltrop.alreadyActivated = true;
                    Matter.Events.trigger(globals.currentGame, ctCollEventName, {
                        value: 1
                    });
                    otherUnit.stun({
                        duration: 3000,
                        stunningUnit: medic
                    });
                    otherUnit.sufferAttack(12, medic);
                    var bloodPierceAnimation = gameUtils.getAnimation({
                        spritesheetName: 'UtilityAnimations1',
                        animationName: 'pierce',
                        speed: 0.95,
                        transform: [caltrop.position.x, caltrop.position.y, 0.45, 0.45]
                    });
                    knifeImpactSound.play();
                    bloodPierceAnimation.play();
                    graphicsUtils.addSomethingToRenderer(bloodPierceAnimation, 'foreground');
                    graphicsUtils.fadeSpriteOverTime({
                        sprite: caltropImage,
                        duration: 300,
                        callback: function() {
                            globals.currentGame.removeBody(caltrop);
                        }
                    });
                }
            }.bind(this));
        }

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

                    Matter.Events.trigger(globals.currentGame, petCollEventName, {
                        value: 1
                    });
                }
            }
        });

        var originalOrigin = {
            x: this.position.x,
            y: this.position.y
        };
        var originalDistance = Matter.Vector.magnitude(Matter.Vector.sub(destination, this.position));

        this.isTargetable = false;
        this.isVanishing = true;
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
                this.isVanishing = false;
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
                    destination: destination,
                    isFreeStep: isFreeStep
                });
                commandObj.command.done();

                var self = this;
                if (luckyLandingAugment) {
                    var duration = luckyLandingAugment.duration;
                    this.applySureDodgeBuff();
                    Matter.Events.trigger(globals.currentGame, luckyCollEventName, {
                        value: 1
                    });
                }

                if (softLandingAugment) {
                    gameUtils.applyToUnitsByTeam(function(team) {
                        return self.team != team;
                    }, function(unit) {
                        return mathArrayUtils.distanceBetweenUnits(self, unit) <= softLandingAugment.radius;
                    }, function(unit) {
                        unit.applySoftenBuff({
                            duration: softLandingAugment.duration
                        });
                        Matter.Events.trigger(globals.currentGame, slCollEventName, {
                            value: 1
                        });
                    });
                }
            }
        }.bind(this));
        gameUtils.deathPact(shadow, removeSelf);
    };

    var fleetFeetCollEventName = "ffCollectorEventName";
    var slCollEventName = "slCollectorEventName";
    var luckyCollEventName = "luckyCollectorEventName";
    var ctCollEventName = "ctCollectorEventName";
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
                name: 'lucky landing',
                icon: graphicsUtils.createDisplayObject('LuckyLanding'),
                title: 'Lucky Landing',
                description: 'Gain a sure-dodge upon landing.',
                collector: {
                    eventName: luckyCollEventName,
                    presentation: {
                        labels: ["Sure-dodges gained"],
                    }
                }
            },
            {
                name: 'soft landing',
                icon: graphicsUtils.createDisplayObject('SoftLanding'),
                title: 'Soft Landing',
                duration: 5000,
                radius: 125,
                description: 'Soften nearby enemies upon landing.',
                collector: {
                    eventName: slCollEventName,
                    presentation: {
                        labels: ["Enemies softened"],
                    }
                }
            },
            {
                name: 'caltrop',
                icon: graphicsUtils.createDisplayObject('CaltropIcon'),
                title: 'Caltrop',
                duration: 3000,
                description: 'Drop a caltrop upon vanishing.',
                systemMessage: 'A caltrop stuns and deals 12 damage to enemies.',
                collector: {
                    eventName: ctCollEventName,
                    presentation: {
                        labels: ["Caltrop hits"]
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
    var layMine = function(commandObj) {
        //get current augment
        var thisAbility = this.getAbilityByName('Mine');
        var pressurePlateAugment = thisAbility.isAugmentEnabled('pressure plate');
        var shrapnelAugment = thisAbility.isAugmentEnabled('shrapnel');
        var scorchAugment = thisAbility.isAugmentEnabled('scorch');
        var sideEffectsAugment = thisAbility.isAugmentEnabled('side effects');
        var sparePartsAugment = thisAbility.isAugmentEnabled('spare parts');

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
        var primaryExplosionRadius = shrapnelAugment ? 60 : 60;
        var mineState = {
            state: 0,
            id: mathArrayUtils.uuidv4(),
            position: mine.position,
            blastRadius: blastRadius,
            damage: this.mineDamage,
            primaryExplosionRadius: primaryExplosionRadius
        };
        graphicsUtils.addSomethingToRenderer(stateZero, 'stageNOne', {
            position: mineState.position
        });
        graphicsUtils.addSomethingToRenderer(mineCracks, 'stageNOne', {
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
            graphicsUtils.addSomethingToRenderer(stateOne, 'stageNOne', {
                position: mineState.position
            });
            graphicsUtils.addSomethingToRenderer(stateThree, 'stageNOne', {
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
                        graphicsUtils.addSomethingToRenderer(stateOne, 'stageNOne', {
                            position: mineState.position
                        });
                        graphicsUtils.removeSomethingFromRenderer(stateZero);
                        mineState.state += 1;
                    } else if (mineState.state == 1) {
                        mineBeep.play();
                        graphicsUtils.addSomethingToRenderer(stateTwo, 'stageNOne', {
                            position: mineState.position
                        });
                        graphicsUtils.removeSomethingFromRenderer(stateOne);
                        mineState.state += 1;
                    } else if (mineState.state == 2) {
                        mineBeep.play();
                        graphicsUtils.addSomethingToRenderer(stateThree, 'stageNOne', {
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

        if(sparePartsAugment) {
            Matter.Events.trigger(globals.currentGame, sparePartsEventName, {
                value: sparePartsAugment.energyReduction
            });
        }

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
                unit.sufferAttack(dmg, medic, {
                    dodgeable: false,
                    abilityType: true
                });
                if (!unit.isDead && sideEffectsAugment) {
                    unit.afflict({
                        duration: sideEffectsAugment.duration,
                        afflictingUnit: medic
                    });
                    Matter.Events.trigger(globals.currentGame, sideEffectsEventName, {
                        value: 1
                    });
                }
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
                var scorchedAreaBody = Matter.Bodies.circle(mine.position.x, mine.position.y, blastRadius / 2.0, {
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
                        Matter.Events.trigger(globals.currentGame, scorchEventName, {
                            value: 1
                        });
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
    var sideEffectsEventName = 'sideEffectsCollEvent';
    var sparePartsEventName = 'sparePartsEventsCollEvent';
    var mineAbility = new Ability({
        name: 'Mine',
        key: 'f',
        type: 'key',
        icon: graphicsUtils.createDisplayObject('MineIcon'),
        method: layMine,
        title: 'Mine',
        description: '',
        updaters: {
            descriptions: function() {
                return {
                    index: 0,
                    value: 'Lay an explosive mine, dealing ' + medic.mineDamage + ' damage.'
                };
            }
        },
        hotkey: 'F',
        energyCost: 15,
        augments: [{
                name: 'scorch',
                duration: 12000,
                icon: graphicsUtils.createDisplayObject('Maim'),
                title: 'Scorch',
                description: 'Leave an explosion area which maims enemy units for 12 seconds.',
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
            },
            {
                name: 'side effects',
                icon: graphicsUtils.createDisplayObject('SideEffectsIcon'),
                duration: 5000,
                title: 'Side Effects',
                description: 'Afflict surviving enemies for 5 seconds.',
                collector: {
                    eventName: sideEffectsEventName,
                    presentation: {
                        labels: ["Enemies accused"]
                    }
                }
            },
            {
                name: 'spare parts',
                icon: graphicsUtils.createDisplayObject('SparePartsIcon'),
                title: 'Spare Parts',
                energyReduction: 3,
                description: 'Reduce energy cost by 3.',
                equip: function(unit) {
                    unit.getAbilityByName('Mine').energyCost -= this.energyReduction;
                },
                unequip: function(unit) {
                    unit.getAbilityByName('Mine').energyCost += this.energyReduction;
                },
                collector: {
                    eventName: sparePartsEventName,
                    presentation: {
                        labels: ["Energy saved"]
                    }
                }
            }
        ]
    });

    var ppCollEventName = 'ppCollEvent';
    var sacCollEventName = 'sacCollEvent';
    var efCollEventName = 'efCollEvent';
    var continuousHealthNeeded = 20;
    var rsThresholdChangeAmount = continuousHealthNeeded * 2.0 / 3.0;
    var enrichedThresholdColor = {
        r: 1.0,
        g: 1.0,
        b: 1.0
    };
    var enrageEFTime = 4000;
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
                hpThreshold: 0.60,
                icon: graphicsUtils.createDisplayObject('PurePriorities'),
                title: 'Pure Priorities',
                description: ['Reduce healing cost to 0 when ally\'s life is below 60%.'], // 'Enrage ally for 3 seconds upon giving ' + continuousHealthNeeded + ' health.'],
                collector: {
                    eventName: ppCollEventName,
                    init: function() {
                        this.freeHealing = 0;
                    },
                    presentation: {
                        labels: ["Healing done for free"], //, "Times enrage granted"],
                        values: ["freeHealing"], //, "enragesGranted"],
                    }
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
                name: 'formula e',
                icon: graphicsUtils.createDisplayObject('FormulaE'),
                title: 'Formula E',
                amount: 4,
                description: ['Grant ally enrage (+3) for 4 seconds upon giving 20 health.'],
                equip: function(unit) {
                    this.resetListener = Matter.Events.on(globals.currentGame, 'EnterLevel', () => {
                        medic.hpGivenTally = 0;
                    });
                },
                unequip: function(unit) {
                    Matter.Events.off(globals.currentGame, 'EnterLevel', this.resetListener);
                },
                collector: {
                    eventName: efCollEventName,
                    presentation: {
                        labels: ["Times enrage granted"]
                    }
                }
            },
            {
                name: 'formula b',
                icon: graphicsUtils.createDisplayObject('EnrichedFormula'),
                title: 'Formula B',
                description: ['Grant ally berserk (1.5x multiplier) for 4 seconds upon giving 20 health.'],
                equip: function(unit) {
                    this.resetListener = Matter.Events.on(globals.currentGame, 'EnterLevel', () => {
                        medic.hpGivenTally = 0;
                    });
                },
                unequip: function(unit) {
                    Matter.Events.off(globals.currentGame, 'EnterLevel', this.resetListener);
                },
                collector: {
                    eventName: efCollEventName,
                    presentation: {
                        labels: ["Times berserk granted"]
                    }
                }
            },
            {
                name: 'formula r',
                icon: graphicsUtils.createDisplayObject('FormulaR'),
                title: 'Formula R',
                range: 180,
                description: ['Grant ally 180 range for 4 seconds upon giving 20 health.'],
                equip: function(unit) {
                    this.resetListener = Matter.Events.on(globals.currentGame, 'EnterLevel', () => {
                        medic.hpGivenTally = 0;
                    });
                },
                unequip: function(unit) {
                    Matter.Events.off(globals.currentGame, 'EnterLevel', this.resetListener);
                },
                collector: {
                    eventName: efCollEventName,
                    presentation: {
                        labels: ["Times range granted"]
                    }
                }
            },

            // {
            //     name: 'Sacrifice',
            //     icon: graphicsUtils.createDisplayObject('Sacrifice'),
            //     title: 'Sacrifice',
            //     reviveMultiplier: 0.5,
            //     description: ['Fire replenishment missile upon death.', 'Halve time to revive.'],
            //     equip: function(unit) {
            //         unit.sacrificeFunction = function(event) {
            //             Matter.Events.trigger(globals.currentGame, sacCollEventName, {value: 1});
            //             gameUtils.applyToUnitsByTeam(function(team) {
            //                 return unit.team == team;
            //             }, function(teamUnit) {
            //                 return !teamUnit.isDead;
            //             }, function(livingAlliedUnit) {
            //                 combospiritinit.play();
            //                 var combospiritAnimation = gameUtils.getAnimation({
            //                     spritesheetName: 'MedicAnimations2',
            //                     animationName: 'combospirit',
            //                     speed: 1.5,
            //                     loop: true,
            //                     transform: [livingAlliedUnit.position.x, livingAlliedUnit.position.y, 2.0, 2.0]
            //                 });
            //                 combospiritAnimation.play();
            //                 var projectileOptions = {
            //                     damage: 0,
            //                     speed: 1.0,
            //                     tracking: false,
            //                     displayObject: combospiritAnimation,
            //                     target: livingAlliedUnit,
            //                     owningUnit: unit,
            //                     impactType: 'collision',
            //                     collisionFunction: function(otherUnit) {
            //                         return otherUnit.team == this.owningUnit.team && otherUnit != this.owningUnit;
            //                     },
            //                     originOffset: 0,
            //
            //                     autoSend: true,
            //                     impactExtension: function(target) {
            //                         fullheal.play();
            //                         var replenAnimation = gameUtils.getAnimation({
            //                             spritesheetName: 'UtilityAnimations1',
            //                             animationName: 'lifegain1',
            //                             speed: 0.8,
            //                             transform: [target.position.x, target.position.y + 10, 1.2, 1.2]
            //                         });
            //                         replenAnimation.play();
            //                         replenAnimation.tint = 0xfb32b1;
            //                         graphicsUtils.addSomethingToRenderer(replenAnimation, 'stageOne');
            //
            //                         livingAlliedUnit.giveHealth(livingAlliedUnit.maxHealth, medic);
            //                         livingAlliedUnit.giveEnergy(livingAlliedUnit.maxEnergy);
            //                     }
            //                 };
            //                 var projectile = new Projectile(projectileOptions);
            //             });
            //         };
            //         Matter.Events.on(unit, 'death', unit.sacrificeFunction);
            //         unit.reviveTime *= this.reviveMultiplier;
            //     },
            //     unequip: function(unit) {
            //         Matter.Events.off(unit, 'death', unit.sacrificeFunction);
            //         unit.reviveTime *= 1 / this.reviveMultiplier;
            //     },
            //     collector: {
            //         eventName: sacCollEventName,
            //         presentation: {
            //             labels: ["Times activated"]
            //         }
            //     }
            // }
        ]
    });

    var rsADuration = 3000;
    var rsDAmount = 25;
    var rsPassiveGritAddAmount = 5;
    var raisedStakes = new Passive({
        title: 'Raised Stakes',
        aggressionDescription: ['Agression Mode (Upon targeted heal)', 'Go berserk (2x multiplier) for 3 seconds.'],
        defenseDescription: ['Defensive Mode (When hit by melee attack)', 'Deal damage equal to half of Ursula\'s total grit back to attacker.'],
        unequippedDescription: ['Unequipped Mode (Upon level/wave start)', 'Self and allies gain ' + rsPassiveGritAddAmount + ' grit for length of excursion.'],
        textureName: 'RaisedStakes',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 5000,
        aggressionEventName: 'specifiedTargetAcquired',
        aggressionCooldown: 4000,
        aggressionDuration: rsADuration,
        passiveAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(medic, true);
            alliesAndSelf.forEach((unit) => {
                var addedGrit = rsPassiveGritAddAmount; //Math.floor(unit.getTotalGrit() / 3.0);
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

                attacker.sufferAttack(grit, medic, {
                    dodgeable: false,
                    abilityType: true
                });
                var maimBlast = gameUtils.getAnimation({
                    spritesheetName: 'MedicAnimations1',
                    animationName: 'maimblast',
                    speed: 0.7,
                    transform: [attacker.position.x, attacker.position.y, 0.85, 0.85]
                });
                if (grit >= 20) {
                    maimBlast.scale = {
                        x: 1.1,
                        y: 1.1
                    };
                }
                if (grit >= 35) {
                    maimBlast.scale = {
                        x: 1.6,
                        y: 1.6
                    };
                }
                maimBlast.tint = 0xf1ca00;
                maimBlast.rotation = Math.random() * Math.PI;
                maimBlast.play();
                graphicsUtils.addSomethingToRenderer(maimBlast, 'stageOne');
                criticalHitSound2.play();

                return {
                    value: grit
                };
            }
        },
        aggressionAction: function(event) {
            medic.berserk({
                duration: rsADuration,
                id: 'raisedStakesBerserk',
                amount: 2
            });
            return {
                value: rsADuration / 1000
            };
        },
        collector: {
            aggressionLabel: 'Duration of berserk',
            aggressionSuffix: 'seconds',
            defensiveLabel: 'Damage dealt',
        }
    });

    var hhDDuration = 3000;
    var hhADuration = 5000;
    var healthyHabits = new Passive({
        title: 'Healthy Habits',
        aggressionDescription: ['Agression Mode (Upon dealing damage)', 'Self and allies gain 10 hp and regenerate hp at 2x rate for 5 seconds.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Condemn attacker for 3 seconds.'],
        unequippedDescription: ['Unequipped Mode (Upon level/wave start)', 'Self and allies regenerate hp at 2x rate for 3 seconds.'],
        passiveSystemMessage: ['Condemned units suffer -1 armor and heal condemner for 15hp upon death.'],
        textureName: 'HealthyHabits',
        unit: medic,
        defenseEventName: 'preSufferAttack',
        defenseCooldown: 5000,
        aggressionEventName: 'dealDamage',
        aggressionCooldown: 3000,
        aggressionDuration: hhADuration,
        passiveAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(medic, true);
            alliesAndSelf.forEach((unit) => {
                unit.applyHealthGem({
                    id: "hhHealthGain",
                    duration: 3000,
                });
            });
        },
        defenseAction: function(event) {
            var attackingUnit = event.performingUnit;
            if (attackingUnit.condemn) {
                attackingUnit.condemn({
                    duration: hhDDuration,
                    condemningUnit: medic,
                    onHealingRecieved: function(options) {
                        Matter.Events.trigger(globals.currentGame, 'HealthyHabitsCollector', {
                            mode: 'defensePassive',
                            collectorPayload: {
                                value: options.healingReceived
                            }
                        });
                    }
                });
            }
        },
        aggressionAction: function(event) {
            var alliesAndSelf = gameUtils.getUnitAllies(medic, true);
            alliesAndSelf.forEach((unit) => {
                unit.applyBuff({
                    id: "hhHealthGain",
                    textureName: 'HealthyHabitsHealingBuff',
                    duration: hhADuration,
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

            return {
                value: hhADuration / 1000
            };
        },
        collector: {
            aggressionLabel: 'Duration of 2x hp regeneration',
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
    var addedDodgeRolls = 2;
    var slyLogic = new Passive({
        title: 'Sly Logic',
        aggressionDescription: ['Agression Mode (Upon heal)', 'Grant allies ' + allyDodgeGain + ' dodge for 3 seconds.'],
        defenseDescription: ['Defensive Mode (When hit)', 'Add ' + addedDodgeRolls + ' dodge rolls for incoming attack and gain ' + dodgeGain + ' dodge (up to 10) for length of excursion.'],
        unequippedDescription: ['Unequipped Mode (Upon level/wave start)', 'Gain 3 dodge for length of excursion.'],
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
            event.attackContext.dodgeRolls += addedDodgeRolls;
            if (totalDodgeGained >= dodgeMax) {
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

            return {
                value: addedDodgeRolls
            };
        },
        aggressionAction: function(event) {
            var allies = gameUtils.getUnitAllies(medic);
            allies.forEach((ally) => {
                ally.applyDodgeBuff({
                    duration: slADuration,
                    amount: allyDodgeGain
                });
            });

            return {
                value: slADuration / 1000
            };
        },
        collector: {
            aggressionLabel: 'Ally\'s duration of increased dodge',
            aggressionSuffix: 'seconds',
            defensiveLabel: 'Extra dodge rolls',
        }
    });

    var ffDDuration = 3000;
    var familiarFace = new Passive({
        title: 'Familiar Face',
        aggressionDescription: ['Agression Mode (Upon dealing damage)', 'Gain a free vanish (up to two).'],
        defenseDescription: ['Defensive Mode (When hit)', 'Stun attacker and gain movement speed for 3 seconds.'],
        unequippedDescription: ['Unequipped Mode (Upon level/wave start)', 'Gain a free vanish.'],
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
            var attacker = event.performingUnit;

            if (!attacker.isPlaceholder) {
                attacker.stun({
                    duration: ffDDuration
                });

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

                return {
                    value: ffDDuration / 1000
                };
            }
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

            return {
                value: 1
            };
        },
        collector: {
            aggressionLabel: 'Vanishes gained',
            defensiveLabel: 'Duration of increased speed',
            defensiveSuffix: 'seconds',
        }
    });

    var wwADuration = 2000;
    var wwHandler = {};
    var wickedWays = new Passive({
        title: 'Wicked Ways',
        // originalAggressionDescription: ['Agression Mode (Upon kill)', 'Activate defensive state of mind\'s aggression mode.'],
        aggressionDescription: ['Agression Mode (When hit)', 'Plague attacker for 2 seconds.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Lay mine and petrify attacker for 3 seconds.'],
        unequippedDescription: ['Unequipped Mode (Upon level/wave start)', 'Gain a free mine.'],
        textureName: 'WickedWays',
        unit: medic,
        defenseEventName: 'sufferAttack',
        defenseCooldown: 6000,
        aggressionEventName: 'sufferAttack',
        aggressionCooldown: wwADuration,
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
                duration: wwDDuration,
                petrifyingUnit: medic
            });

            return {
                value: 1
            };
        },
        aggressionAction: function(event) {
            var attackingUnit = event.performingUnit;
            attackingUnit.applyPlagueGem({duration: wwADuration});

            return {
                value: 1
            };
        },
        collector: {
            aggressionLabel: 'Enemies plagued',
            defensiveLabel: 'Mines laid/enemies petrified',
        }
        // preStart: function(type) {
        //     var passive = this;
        //     if (medic.defensePassive) {
        //         deepThought.aggressionAction = function() {
        //             medic.defensePassive.aggressionAction();
        //             return {
        //                 value: 1
        //             };
        //         };
        //         if (!medic.defensePassive.deepThoughtBypassAggPredicate) {
        //             deepThought.aggressionPredicate = medic.defensePassive.aggressionPredicate;
        //         }
        //         deepThought.aggressionDescription = [].concat(medic.defensePassive.aggressionDescription);
        //         deepThought.aggressionDescription[0] = deepThought.originalAggressionDescription[0];
        //     }
        //     if (type == 'attackPassive') {
        //         var fe = Matter.Events.on(medic, 'defensePassiveEquipped', function(event) {
        //             Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fe);
        //             Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fu);
        //             // Matter.Events.trigger(globals.currentGame.unitSystem, 'unitPassiveRefresh', {});
        //             deepThought.aggressionAction = function() {
        //                 event.passive.aggressionAction();
        //                 deepThought.aggressionPredicate = medic.defensePassive.aggressionPredicate;
        //                 return {
        //                     value: 1
        //                 };
        //             };
        //             deepThought.aggressionDescription = [].concat(medic.defensePassive.aggressionDescription);
        //             deepThought.aggressionDescription[0] = deepThought.originalAggressionDescription[0];
        //             passive.start('attackPassive');
        //         });
        //         var fu = Matter.Events.on(medic, 'defensePassiveUnequipped', function(event) {
        //             Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fe);
        //             Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fu);
        //             deepThought.aggressionAction = null;
        //             deepThought.aggressionPredicate = null;
        //             deepThought.aggressionDescription = deepThought.originalAggressionDescription;
        //             passive.start('attackPassive');
        //         });
        //         dtHandler.fe = fe;
        //         dtHandler.fu = fu;
        //     }
        // },
        // preStop: function(type) {
        //     Matter.Events.off(medic, 'defensePassiveEquipped', dtHandler.fe);
        //     Matter.Events.off(medic, 'defensePassiveUnequipped', dtHandler.fu);
        // },
    });

    var efADuration = 4000;
    var efDDuration = 4000;
    var energyGain = 3;
    var ppDamage = 12;
    var elegantForm = new Passive({
        title: 'Proper Posture',
        aggressionDescription: ['Agression Mode (When hit by projectile)', 'Reduce damage of projectile to 1 and deal ' + ppDamage + ' damage to attacker.'],
        defenseDescription: ['Defensive Mode (When hit by projectile)', 'Reduce damage of projectile to 1 and gain ' + energyGain + ' energy.'],
        unequippedDescription: ['Unequipped Mode (Upon level/wave start)', 'Gain 15 energy.'],
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
            var damageObj = event.damageObj;
            var damageReduced = damageObj.damage - 1;
            if (damageReduced == 0) {
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
                    x: 0.75,
                    y: 0.75
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

            var energyGiven = medic.giveEnergy(energyGain);
            unitUtils.applyEnergyGainAnimationToUnit(medic);
            manaHealSound.play();

            return {
                value: energyGiven
            };
        },
        deepThoughtBypassAggPredicate: true,
        aggressionPredicate: function(event) {
            return event.attackContext.isProjectile;
        },
        aggressionAction: function(event) {
            //delay the attack for a second
            gameUtils.doSomethingAfterDuration(() => {
                var attacker = event.performingUnit;
                if (attacker.isDead) return;

                attacker.sufferAttack(ppDamage, medic, {
                    dodgeable: false,
                    abilityType: true
                });
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
            if (damageReduced == 0) {
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

            return {
                value: ppDamage
            };
        },
        collector: {
            aggressionLabel: 'Damage dealt',
            defensiveLabel: 'Energy gained',
        }
    });

    var rad = options.radius || 25;
    var unitProperties = $.extend({
        unitType: 'Medic',
        idleCancel: false,
        health: 40,
        energy: 60,
        grit: 5,
        hitboxWidth: 28,
        hitboxHeight: 56,
        adjustHitbox: false,
        itemsEnabled: true,
        frameTint: 0x0c7d10,
        dodgeSound: dodgeSound,
        holdPositionSound: holdPositionSound,
        mineDamage: 20,
        damageLabel: "Heal",
        hpGivenTally: 0,
        attackSpeedLabel: "Heal Speed",
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
        damageScale: 12,
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
        passiveAbilities: [elegantForm, raisedStakes, healthyHabits, wickedWays, slyLogic, familiarFace],
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

            //randomize initial augments
            this.abilities.forEach((ability) => {
                ability.addAvailableAugment();
                // ability.addAllAvailableAugments();
            });

            this.fullhpTallyMeterWidth = 30;
            this.hpTallyMeter = graphicsUtils.createDisplayObject('TintableSquare', {
                where: 'foreground',
                anchor: {
                    x: 0.5,
                    y: 0.5
                },
                alpha: 0.5
            });
            this.hpTallyMeter.tint = 0xa9e449;
            gameUtils.attachSomethingToBody({
                something: this.hpTallyMeter,
                body: this.body,
                offset: {
                    x: 0,
                    y: 34
                }
            });

            this.hpTallyMeterBorder = graphicsUtils.createDisplayObject('TintableSquare', {
                sortYOffset: -1,
                where: 'foreground',
                anchor: {
                    x: 0.5,
                    y: 0.5
                },
                alpha: 0.75
            });
            this.hpTallyMeterBorder.tint = 0x000000;
            gameUtils.attachSomethingToBody({
                something: this.hpTallyMeterBorder,
                body: this.body,
                offset: {
                    x: 0,
                    y: 34
                }
            });
            this.hpTallyMeterBorder.scale = {
                x: this.fullhpTallyMeterWidth + 2,
                y: 6
            };

            var self = this;
            this.hpTallyHideTimer = globals.currentGame.addTimer({
                name: 'tallyHideTimer',
                runs: 1,
                timeLimit: 1000,
                callback: function() {
                    graphicsUtils.fadeSpriteOutQuickly(self.hpTallyMeter);
                    graphicsUtils.fadeSpriteOutQuickly(self.hpTallyMeterBorder);
                }
            });
        },
        _afterAddInit: function() {
            // this.normalHealingColor = {
            //     r: 1.0,
            //     g: 0.0,
            //     b: 0.85,
            // };
            // this.alterHealingColor(this.normalHealingColor);
        },
        alterHealingColor: function(color) {
            var shootAnimationName = 'shoot';
            $.each(this.body.renderlings, function(key, renderling) {
                if (renderling.spineData) {
                    var glowIndex = null;
                    $.each(renderling.skeleton.slots, function(i, slot) {
                        if (slot.data && slot.data.name.includes('Glow')) {
                            glowIndex = i;
                        }
                    });

                    $.each(renderling.spineData.animations, function(i, anim) {
                        if (anim.name == shootAnimationName) {
                            $.each(anim.timelines, function(i, tl) {
                                if (tl.slotIndex && tl.slotIndex == glowIndex) {
                                    var frames = tl.frames;
                                    frames[0] = 0;
                                    for (var x = 0; x < frames.length; x++) {
                                        if (x % 5 == 1) {
                                            frames[x] = color.r;
                                        }
                                        if (x % 5 == 2) {
                                            frames[x] = color.g;
                                        }
                                        if (x % 5 == 3) {
                                            frames[x] = color.b;
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    }, options);

    return UC({
        givenUnitObj: medic,
        renderChildren: rc,
        radius: rad,
        mass: options.mass || 8,
        mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
        slaves: [healSound, dodgeSound, holdPositionSound, manaHealSound, blockSound, criticalHitSound, knifeImpactSound, mineSound, deathSoundBlood, deathSound, mineBeep, mineExplosion, footstepSound, shroudSound, combospiritinit, fullheal, unitProperties.portrait, unitProperties.wireframe],
        unit: unitProperties,
        moveable: {
            moveSpeed: 2.35,
            walkAnimations: walkAnimations,
        },
        attacker: {
            attackAnimations: healAnimations,
            cooldown: 333,
            cooldownPauseAddition: 180,
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
                var enrageAugment = thisAbility.isAugmentEnabled('formula e');
                var berserkAugment = thisAbility.isAugmentEnabled('formula b');
                var rangeAugment = thisAbility.isAugmentEnabled('formula r');
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

                if (rangeAugment || berserkAugment || enrageAugment) {
                    graphicsUtils.addOrShowDisplayObject(this.hpTallyMeter, 0.5);
                    graphicsUtils.addOrShowDisplayObject(this.hpTallyMeterBorder, 0.75);
                    medic.hpGivenTally += actualHealingAmount;
                    this.hpTallyMeter.scale = {
                        x: this.fullhpTallyMeterWidth * medic.hpGivenTally / 20,
                        y: 4
                    };
                    this.hpTallyHideTimer.reset();
                    if (medic.hpGivenTally > continuousHealthNeeded) {
                        medic.hpGivenTally -= continuousHealthNeeded;
                        this.hpTallyMeter.scale = {
                            x: this.fullhpTallyMeterWidth * medic.hpGivenTally / 20,
                            y: 4
                        };

                        if (berserkAugment) {
                            target.berserk({
                                duration: enrageEFTime,
                                amount: 1.5,
                                id: 'formulaB'
                            });
                        }
                        if (enrageAugment) {
                            target.enrage({
                                duration: enrageEFTime,
                                amount: enrageAugment.amount,
                                id: 'formulaE'
                            });
                        }
                        if (rangeAugment) {
                            target.applyRangeBuff({
                                duration: enrageEFTime,
                                amount: rangeAugment.range,
                                id: 'formulaR'
                            });
                        }
                        Matter.Events.trigger(globals.currentGame, efCollEventName, {
                            value: 1
                        });
                    }
                }

                if (!ppBypass) {
                    this.spendEnergy(thisAbility.energyCost);
                } else {
                    //we've healed at no cost, send the collector event
                    Matter.Events.trigger(globals.currentGame, ppCollEventName, {
                        freeHealing: actualHealingAmount
                    });
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
