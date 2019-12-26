define(['jquery', 'pixi', 'units/UnitConstructor', 'matter-js'], function($, PIXI, UC, Matter) {

    return function Gunner(options) {
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
            up: currentGame.getSpineAnimation({
                spine: spineNorth,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            upRight: currentGame.getSpineAnimation({
                spine: spineNorthEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            right: currentGame.getSpineAnimation({
                spine: spineEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            downRight: currentGame.getSpineAnimation({
                spine: spineSouthEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            down: currentGame.getSpineAnimation({
                spine: spineSouth,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            downLeft: currentGame.getSpineAnimation({
                spine: spineSouthWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            left: currentGame.getSpineAnimation({
                spine: spineWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            upLeft: currentGame.getSpineAnimation({
                spine: spineNorthWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
        };

        var attackAndStop = function() {
            this.gotoAndStop(0);
        };

        var attackAnimations = {
            up: currentGame.getSpineAnimation({
                spine: spineNorth,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            upRight: currentGame.getSpineAnimation({
                spine: spineNorthEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            right: currentGame.getSpineAnimation({
                spine: spineEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            downRight: currentGame.getSpineAnimation({
                spine: spineSouthEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            down: currentGame.getSpineAnimation({
                spine: spineSouth,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            downLeft: currentGame.getSpineAnimation({
                spine: spineSouthWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            left: currentGame.getSpineAnimation({
                spine: spineWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            upLeft: currentGame.getSpineAnimation({
                spine: spineNorthWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
        }

        var otherAnimations = {
        }

        var sc = {x: .3, y: .3};
        var adjustedUpDownsc = {x: .33, y: .33};
        var flipsc = {x: -1 * sc.x, y: sc.y};
        var yOffset = 22;
        var rc = [
        {
            id: 'selected',
            data: currentGame.texture('IsometricSelected'),
            scale: {x: .8, y: .8},
            stage: 'stageOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {x: 0, y: 22},
        },
        {
            id: 'selectionPending',
            data: currentGame.texture('IsometricSelectedPending'),
            scale: {x: 1, y: 1},
            stage: 'stageOne',
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
            data: currentGame.texture('IsoShadow'),
            scale: {x: .75, y: .75},
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageZero",
            offset: {x: 0, y: 22}}];

        var fireSound = currentGame.getSound('machinegun.wav', {volume: .002, rate: 3});

        var dashVelocity = .8;
        var dash = function(destination) {
            this.stop(); //stop any movement
            this._becomePeaceful(); //prevent us from honing/attacking
            this.moveSpeedAugment = this.moveSpeed;
            this.body.frictionAir = .2;
            var velocityVector = Matter.Vector.sub(destination, this.position);
            var velocityScaled = dashVelocity / Matter.Vector.magnitude(velocityVector);
            Matter.Body.applyForce(this.body, this.position, {x: velocityScaled * velocityVector.x, y: velocityScaled * velocityVector.y});
        }

        var knifeSound = currentGame.getSound('marbles.wav', {volume: .1, rate: 20});
        var knifeSpeed = 14;
        var throwKnife = function(destination) {
            //create knife body
            var knife = Matter.Bodies.circle(0, 0, 4, {
                restitution: .95,
                frictionAir: 0,
                mass: options.mass || 5,
                isSensor: true
            });

            Matter.Body.setPosition(knife, this.position);
            knife.renderChildren = [{
                id: 'knife',
                data: currentGame.texture('Knife'),
                scale: {x: .8, y: .8},
                rotate: currentGame.angleBetweenVectors(knife.position, destination),
            },
            {
                id: 'shadow',
                data: currentGame.texture('MarbleShadow'),
                scale: {x: 10/256, y: 50/256},
                offset: {x: 15, y: 25},
                rotate: currentGame.angleBetweenVectors(knife.position, destination),
    			stage: "stageZero",
            }]
            currentGame.addBody(knife);

            //send knife
            knifeSound.play();
            knife.deltaTime = this.body.deltaTime;
            currentGame.sendBodyToDestinationAtSpeed(knife, destination, knifeSpeed, true, true);
            var removeSelf = currentGame.addTickCallback(function() {
                if(currentGame.bodyRanOffStage(knife)) {
                    currentGame.removeBody(knife);
                }
            })
            currentGame.deathPact(knife, removeSelf);
            Matter.Events.on(knife, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == knife ? pair.pair.bodyA : pair.pair.bodyB;
                if(otherBody != this.body && otherBody.isAttackable) {
                    currentGame.removeBody(knife);
                    otherBody.unit.sufferAttack(10); //we can make the assumption that a body is part of a unit if it's attackable
                }
            }.bind(this))
        }

        return UC({
                renderChildren: rc,
                radius: options.radius || 23,
                mass: options.mass || 8,
                unit: {
                    unitType: 'Gunner',
                    health: 45,
                    energy: 45,
                    team: options.team || 4,
                    heightAnimation: 'up',
                    keyMappings: {
                        d: dash,
                        f: throwKnife
                    }
                },
                moveable: {
                    moveSpeed: 2.65,
                    walkAnimations: walkAnimations,
                }, attacker: {
                    attackAnimations: attackAnimations,
                    cooldown: 650,
                    honeRange: 300,
                    range: 180,
                    damage: 2,
                    attack: function(target) {
                        target.sufferAttack(this.damage);
                        fireSound.play();
                    },
                },
        });
    }
})
