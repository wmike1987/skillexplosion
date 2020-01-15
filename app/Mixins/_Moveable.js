define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'utils/GameUtils', 'utils/Command'],
function($, Matter, PIXI, CommonGameMixin, utils, Command) {

    var moveable = {
        //private
        isMoveable: true,
        isMoving: false,
        destination: null,
        moveTick: null,
        hasMoved: false,
        isSoloMover: false,
        stopOnCollisionBuffer: 30, //pixels
        overshootBuffer: 1, //pixels
        smallerBodyCollisionCategory: 0x4000,
        noProgressBuffer: 15, //pixels

        //user defined
        moveSpeed: null,

        //directional data
        facing: null,
        visibleSprite: null,

        moveableInit: function() {
            this.eventClickMappings['move'] = this.move;

            //Create body sensor - the selection box collides with a slightly smaller body size
            this.smallerBody = Matter.Bodies.circle(0, 0, this.body.circleRadius - 8, {
                isSensor: true,
                noWire: true
            });
            this.smallerBody.collisionFilter.category = this.smallerBodyCollisionCategory;
            this.smallerBody.collisionFilter.mask = 0x0002; //this.smallerBody.collisionFilter.mask - (this.team || 4);
            this.smallerBody.isSmallerBody = true;
            this.smallerBody.unit = this;
            var smallerCallback = currentGame.addTickCallback(function() {
                Matter.Body.setPosition(this.smallerBody, {
                    x: this.body.position.x,
                    y: this.body.position.y
                });
            }.bind(this));
            currentGame.addBody(this.smallerBody);

            Matter.Events.on(this.body, 'onCollideActive', this.avoidCallback);

            Matter.Events.on(this.body, 'onCollideActive', this.slowIfCollideWithAttackingUnit);

            //Deathpact these entities
            utils.deathPact(this, this.smallerBody);
            utils.deathPact(this, smallerCallback);
        },

        move: function(destination, command) {

            //if command is given, we're being executed as part of a command queue, else, fake the command object
            if(!command)
                command = {done: function() {return;}}

            //don't do anything if they're already at their destination
            if (this.body.position.x == destination.x && this.body.position.y == destination.y)
                return;

            //set state
            this.destination = destination;
            this.isMoving = true;
            this.body.frictionAir = 0;
            this.lastPosition = { //nullify "lastPosition"
                x: -50,
                y: -50
            };

            //immediate set the velocity (rather than waiting for the next tick)
            this.constantlySetVelocityTowardsDestination();

            //setup the constant move tick
            if(this.moveTick)
                currentGame.removeRunnerCallback(this.moveTick);
            this.moveTick = currentGame.addRunnerCallback(this.constantlySetVelocityTowardsDestination.bind(this), false, 'beforeTick');
            utils.deathPact(this, this.moveTick, 'moveTick');

            //Setup stop conditions
            //general condition
            if(this.stopConditionCheck)
                currentGame.removeRunnerCallback(this.stopConditionCheck);
            this.stopConditionCheck = currentGame.addRunnerCallback(this.generalStopCondition.bind(this, command), false);
            utils.deathPact(this, this.stopConditionCheck, 'generalStopCondition');

            //"no progress" stop condition
            this.tryForDestinationTimer = {
                name: 'tryForDestination' + this.body.id,
                gogogo: true,
                timeLimit: 550,
                callback: function() {
                    if (this.lastPosition && this.isMoving && !this.isHoning) {
                        //clickPointSprite2.position = this.position;
                        if (this.lastPosition.x + this.noProgressBuffer > this.body.position.x && this.lastPosition.x - this.noProgressBuffer < this.body.position.x) {
                            if (this.lastPosition.y + this.noProgressBuffer > this.body.position.y && this.lastPosition.y - this.noProgressBuffer < this.body.position.y) {
                                this.stop();
                                command.done();
                            }
                        }
                    }
                    //clickPointSprite.position = this.lastPosition || {x: 0, y: 0};
                    this.lastPosition = Matter.Vector.clone(this.body.position);
                }.bind(this)
            };
            currentGame.addTimer(this.tryForDestinationTimer);
            utils.deathPact(this, this.tryForDestinationTimer, 'tryForDestination');

            //group movement stop condition
            if(this.collideCallback) {
                Matter.Events.off(this.body, 'onCollideActive', this.collideCallback);
            }
            this.collideCallback = function(pair) {
                if (!this.isMoving) return;
                var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
                if (this.destination.x + this.stopOnCollisionBuffer > this.position.x && this.destination.x - this.stopOnCollisionBuffer < this.position.x) {
                    if (this.destination.y + this.stopOnCollisionBuffer > this.position.y && this.destination.y - this.stopOnCollisionBuffer < this.position.y) {
                        if (otherBody.isMoveable && !otherBody.isMoving && otherBody.destination && otherBody.destination.x == this.destination.x && otherBody.destination.y == this.destination.y) {
                            this.stop();
                            command.done();
                        }
                    }
                }
            }.bind(this);
            Matter.Events.on(this.body, 'onCollideActive', this.collideCallback);

            //trigger movement event
            Matter.Events.trigger(this, 'move', {
                direction: utils.isoDirectionBetweenPositions(this.position, destination)
            });
        },
        stop: function() {

            Matter.Body.setVelocity(this.body, {
                x: 0,
                y: 0
            });

            //remove stop conditions
            if(this.stopConditionCheck)
                currentGame.removeRunnerCallback(this.stopConditionCheck);

            if(this.tryForDestinationTimer)
                currentGame.invalidateTimer(this.tryForDestinationTimer);

            if(this.collideCallback) {
                Matter.Events.off(this.body, 'onCollideActive', this.collideCallback);
            }

            Matter.Events.trigger(this, 'stop', {});

            this.body.frictionAir = .9;
            this.isMoving = false;
            this.isSoloMover = false;
        },

        pause: function(target) {
            // Matter.Body.setVelocity(this.body, {
            //     x: 0.001,
            //     y: 0.001,
            // });
            Matter.Events.trigger(this, 'pause', {});

            this.body.frictionAir = .9;
            this.isMoving = false;
            this.isSoloMover = false;
            this.tryForDestinationTimer.paused = true;
        },

        resume: function() {
            this.isMoving = true;
            this.body.frictionAir = 0;
        },

        generalStopCondition: function(command) {
            var alteredOvershootBuffer = this.isSoloMover ? this.overshootBuffer : this.overshootBuffer * 20;

            //stop condition: This executes after an engine update, but before a render. It detects when a body has overshot its destination
            //and will stop the body. Group movements are more forgiving in terms of reaching one's destination; this is reflected in a larger
            //overshoot buffer
            if (this.destination.x + alteredOvershootBuffer > this.body.position.x && this.destination.x - alteredOvershootBuffer < this.body.position.x) {
                if (this.destination.y + alteredOvershootBuffer > this.body.position.y && this.destination.y - alteredOvershootBuffer < this.body.position.y) {
                    this.stop();
                    command.done();
                }
            }
        },

        constantlySetVelocityTowardsDestination: function(event) {
            if (!this.isMoving) {
                return;
            }

            var localMoveSpeed = Matter.Vector.magnitude(this.body.velocity);

            //accelerate into the movement and give initial movement a small increment before becoming full force
            var deltaTime = event ? event.deltaTime : .16; //this is bad
            if(localMoveSpeed <= 0.001) {
                localMoveSpeed += 0.001 * deltaTime;
            } else if(localMoveSpeed < this.moveSpeed) {
                localMoveSpeed += .05 * deltaTime;
                if(localMoveSpeed > this.moveSpeed) {
                    localMoveSpeed = this.moveSpeed;
                }
            } else {
                localMoveSpeed = this.moveSpeed;
            }

            //send body
            utils.sendBodyToDestinationAtSpeed(this.body, this.destination, localMoveSpeed, false);
        },

        //This will move me out of the way if I'm not moving and a moving object is colliding with me.
        avoidCallback: function(pair) {
            if (this.isMoving || this.isAttacking || this.isHoning) return;
            var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
            if (otherBody.isMoveable && otherBody.isMoving && otherBody.destination != this.destination) {
                this.frictionAir = .9;
                var m = otherBody.velocity.y / otherBody.velocity.x;
                var x = this.position.x - otherBody.position.x;
                var b = otherBody.position.y;
                magicY = m * x + b;
                var swapX = 1;
                var swapY = 1;
                if (magicY < this.position.y) {
                    if (otherBody.velocity.x <= 0)
                        swapY = -1;
                    else
                        swapX = -1;
                } else {
                    if (otherBody.velocity.x <= 0)
                        swapX = -1;
                    else
                        swapY = -1;
                }

                var scatterDistance = this.circleRadius * 2.8;
                var newVelocity = {x: otherBody.velocity.y * swapX, y: otherBody.velocity.x * swapY};
                var scatterScale = scatterDistance/Matter.Vector.magnitude(newVelocity);

                if(!this.isAttacker) {
                    this.unit.move(Matter.Vector.add(this.position, Matter.Vector.mult(newVelocity, scatterScale)));
                }
                else {
                    this.unit.attackMove(Matter.Vector.add(this.position, Matter.Vector.mult(newVelocity, scatterScale)));
                }
            }
        },
        slowIfCollideWithAttackingUnit: function(pair) {
            var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
            var positionVector = Matter.Vector.sub(otherBody.position, this.position);
            if(this.isMoving && otherBody.unit && otherBody.unit.isAttacking) {
                if(utils.angleBetweenTwoVectors(positionVector, this.velocity) < Math.PI/2)
                    Matter.Body.setVelocity(this, {x: 0, y: 0})
            }
        },

        groupRightClick: function(destination) {
            this.move(destination);
        },
    }

    return moveable;
})
