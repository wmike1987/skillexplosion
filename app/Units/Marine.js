define(['jquery', 'pixi', 'unitcore/UnitConstructor', 'matter-js', 'utils/GameUtils', 'unitcore/UnitAbility'], function($, PIXI, UC, Matter, utils, Ability) {

    return function Marine(options) {
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

        var attackAnimations = {
            up: utils.getSpineAnimation({
                spine: spineNorth,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            upRight: utils.getSpineAnimation({
                spine: spineNorthEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            right: utils.getSpineAnimation({
                spine: spineEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            downRight: utils.getSpineAnimation({
                spine: spineSouthEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            down: utils.getSpineAnimation({
                spine: spineSouth,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            downLeft: utils.getSpineAnimation({
                spine: spineSouthWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            left: utils.getSpineAnimation({
                spine: spineWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            upLeft: utils.getSpineAnimation({
                spine: spineNorthWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
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

        var fireSound = utils.getSound('machinegun.wav', {volume: .002, rate: 3});

        //Dash
        var dashVelocity = .8;
        var dashSound = utils.getSound('dashsound.wav', {volume: .02, rate: 1.4});

        var dash = function(destination, commandObj) {
            this.stop(); //stop any movement
            this._becomePeaceful(); //prevent us from honing/attacking
            this.moveSpeedAugment = this.moveSpeed;
            this.body.frictionAir = .2;
            var velocityVector = Matter.Vector.sub(destination, this.position);
            var velocityScaled = dashVelocity / Matter.Vector.magnitude(velocityVector);
            Matter.Body.applyForce(this.body, this.position, {x: velocityScaled * velocityVector.x, y: velocityScaled * velocityVector.y});
            dashSound.play();

            //play animation
            var dashAnimation = utils.getAnimationB({
                spritesheetName: 'bloodswipes1',
                animationName: 'dash',
                speed: .3,
                transform: [this.position.x, this.position.y, 3.5, 2.5]
            });

            dashAnimation.play();
            dashAnimation.alpha = .8;
            dashAnimation.rotation = utils.pointInDirection(this.position, destination, 'north');
            utils.addSomethingToRenderer(dashAnimation, 'stageNOne');

            var self = this;
            self.dashTimer = currentGame.addTimer({
                name: 'dashDoneTimer' + self.unitId,
                runs: 1,
                timeLimit: 280,
                callback: function() {
                    if(self.commandQueue.getCurrentCommand().id == commandObj.command.id) {
                        //only stop if we're still on the current dash command
                        self.stop();
                    }
                    commandObj.command.done();
                }
            })
            utils.deathPact(this, self.dashTimer, 'dashDoneTimer');
        }

        var dashAbility = new Ability({
            name: 'Dash',
            key: 'd',
            type: 'click',
            icon: utils.createDisplayObject('DashIcon'),
            method: dash,
            title: 'Dash',
            description: 'Quickly move throughout the battlefield.',
            hotkey: 'D',
            energyCost: 3
        })

        //Knife
        var knifeThrowSound = utils.getSound('knifethrow.wav', {volume: .03, rate: 1.5});
        var knifeImpactSound = utils.getSound('knifeimpact.wav', {volume: .05, rate: 1});
        var knifeSpeed = 22;
        var knifeDamage = 20;
        var throwKnife = function(destination, commandObj) {
            //get current augment
            var thisAbility = this.getAbilityByName('Throw Knife');
            var currentAugment = thisAbility.currentAugment || {name: 'null'};

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
            knife.renderChildren = [{
                id: 'knife',
                data: 'ThrowingDagger',
                scale: {x: .7, y: .7},
                rotate: utils.pointInDirection(knife.position, destination),
            },
            {
                id: 'shadow',
                data: 'MarbleShadow',
                scale: {x: 10/256, y: 50/256},
                offset: {x: 15, y: 20},
                rotate: utils.pointInDirection(knife.position, destination),
    			      stage: "stageNTwo",
            }]
            currentGame.addBody(knife);

            //send knife
            knifeThrowSound.play();
            knife.deltaTime = this.body.deltaTime;
            knife.destination = destination;
            utils.sendBodyToDestinationAtSpeed(knife, destination, knifeSpeed, true, true);
            var removeSelf = currentGame.addTickCallback(function() {
                if(utils.bodyRanOffStage(knife)) {
                    currentGame.removeBody(knife);
                }
            })
            utils.deathPact(knife, removeSelf);

            var self = this;
            Matter.Events.on(knife, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == knife ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit;
                if(otherUnit != this && otherUnit && otherUnit.isAttackable && otherUnit.team != this.team) {
                    otherUnit.sufferAttack(knifeDamage, self); //we can make the assumption that a body is part of a unit if it's attackable
                    if(otherUnit.isDead) {
                        Matter.Events.trigger(this, 'knifeKill');
                    }
                    var bloodPierceAnimation = utils.getAnimationB({
                        spritesheetName: 'bloodswipes1',
                        animationName: 'pierce',
                        speed: .95,
                        transform: [knife.position.x, knife.position.y, .25, .25]
                    });
                    knifeImpactSound.play();
                    bloodPierceAnimation.play();
                    bloodPierceAnimation.rotation = utils.pointInDirection(knife.position, knife.destination, 'east');
                    utils.addSomethingToRenderer(bloodPierceAnimation, 'foreground');
                    if(currentAugment && currentAugment.name == 'pierce') {
                        knife.lives -= 1;
                        if(knife.lives == 0) {
                            currentGame.removeBody(knife);
                        }
                    } else {
                        currentGame.removeBody(knife);
                    }
                }

                if(otherBody.isMine) {
                    otherBody.explode();
                }
            }.bind(this))

            currentGame.addTimer({
                name: 'knifeDoneTimer' + knife.id,
                runs: 1,
                killsSelf: true,
                timeLimit: 125,
                callback: function() {
                    commandObj.command.done();
                }
            })
        };

        var knifeAbility = new Ability({
            name: 'Throw Knife',
            key: 'f',
            type: 'click',
            icon: utils.createDisplayObject('KnifeIcon'),
            method: throwKnife,
            title: 'Throwing Knife',
            description: 'Throw a knife, dealing ' + knifeDamage + ' damage.',
            hotkey: 'F',
            energyCost: 5,
            activeAugment: null,
            augments: [
                {
                    name: 'pierce',
                    lives: 3,
                    icon: utils.createDisplayObject('PiercingKnife'),
                    title: 'Piercing Blow',
                    description: 'Allows a single knife to pierce multiple enemies.'
                },
                {
                    name: 'poison tip',
                    seconds: 3,
                    damage: 20,
                    icon: utils.createDisplayObject('PoisonTip'),
                    title: 'Poison Tip',
                    description: 'Deal an additional 20 damage over 3 seconds.'
                },
                {
                    name: 'multi throw',
                    knives: 3,
                    damage: 20,
                    icon: utils.createDisplayObject('MultiShot'),
                    title: 'Multi-throw',
                    description: 'Throw multiple knives in a fan.'
                },
            ],
        })

        var setSleeping = function() {
            Matter.Sleeping.set(this.body, !this.body.isSleeping);
        }

        return UC({
                renderChildren: rc,
                radius: options.radius || 22,
                hitboxWidth: 35,
                hitboxHeight: 60,
                mass: options.mass || 8,
                mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
                slaves: [dashSound, fireSound, knifeThrowSound, knifeImpactSound],
                unit: {
                    unitType: 'Marine',
                    health: 75,
                    defense: 1,
                    energy: 20,
                    energyRegenerationRate: 1,
                    portrait: utils.createDisplayObject('MarineRedHat'),
                    wireframe: utils.createDisplayObject('MarineRedHat'),
                    team: options.team || 4,
                    priority: 50,
                    name: options.name,
                    heightAnimation: 'up',
                    abilities: [dashAbility, knifeAbility],
                    death: function() {
                        var self = this;
                        var anim = utils.getAnimationB({
                            spritesheetName: 'deathAnimations',
                            animationName: 'bloodsplat',
                            speed: .3,
                            transform: [self.position.x, self.position.y, .3, .3]
                        });
                        utils.addSomethingToRenderer(anim);
                        anim.play();

                        this.isAttackable = false;
                        utils.moveUnitOffScreen(this);
                        this.stop();
                        currentGame.unitSystem.deselectUnit(this);
                        //currentGame.removeUnit(this);
                    }
                },
                moveable: {
                    moveSpeed: 2.35,
                    walkAnimations: walkAnimations,
                    smallerBodyHeightChange: true,
                }, attacker: {
                    attackAnimations: attackAnimations,
                    cooldown: 650,
                    honeRange: 300,
                    range: 180,
                    damage: 10,
                    attackExtension: function(target) {
                        fireSound.play();

                        //bullet emitter
                        var emitter = utils.createParticleEmitter({where: currentGame.renderer.stages.stage,
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
                        }, texture: PIXI.Texture.fromImage('../app/Textures/bulletParticle.png')})
                        emitter.updateSpawnPos(target.position.x, target.position.y);
                        emitter.playOnceAndDestroy();

                        //blood emitter
                        var bloodEmitter = utils.createParticleEmitter({where: currentGame.renderer.stages.stage,
                            config: {
                        	"alpha": {
                        		"start": 1,
                        		"end": 1
                        	},
                        	"scale": {
                        		"start": 0.1,
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
                        	"maxParticles": 2,
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
                        }, texture: PIXI.Texture.fromImage('../app/Textures/particle.png')});
                        bloodEmitter.updateSpawnPos(target.position.x, target.position.y);
                        bloodEmitter.playOnceAndDestroy();
                    },
                },
        });
    }
})
