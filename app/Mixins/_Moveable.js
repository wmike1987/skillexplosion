define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'utils/GameUtils'], function($, Matter, PIXI, CommonGameMixin, utils) {

    return {
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
            if (this._moveableInit) return;
            this._moveableInit = true;

            //create body sensor - the selection box collides with a slightly smaller body size
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

            Matter.Events.on(this.body, 'onCollideActive', this.collideCallback);
            Matter.Events.on(this.body, 'onCollideActive', this.avoidCallback);

            this.moveTick = currentGame.addRunnerCallback(this.constantlySetVelocityTowardsDestination.bind(this), false);

            //This timer stops a moveable object from moving forever if they're making "no progress"
            this.tryForDestinationTimer = {
                name: 'tryForDestination' + this.body.id,
                gogogo: true,
                timeLimit: 500,
                callback: function() {
                    if (this.lastPosition && this.isMoving) {
                        //clickPointSprite2.position = this.position;
                        if (this.lastPosition.x + this.noProgressBuffer > this.body.position.x && this.lastPosition.x - this.noProgressBuffer < this.body.position.x) {
                            if (this.lastPosition.y + this.noProgressBuffer > this.body.position.y && this.lastPosition.y - this.noProgressBuffer < this.body.position.y) {
                                this.stop();
                            }
                        }
                    }
                    //clickPointSprite.position = this.lastPosition || {x: 0, y: 0};
                    this.lastPosition = Matter.Vector.clone(this.body.position);
                }.bind(this)
            };

            //Deathpact these entities
            utils.deathPact(this, this.smallerBody);
            utils.deathPact(this, smallerCallback);
            utils.deathPact(this, this.tryForDestinationTimer);
            utils.deathPact(this, this.moveTick);

            currentGame.addTimer(this.tryForDestinationTimer);
        },

        move: function(destination) {

            //reset try for destination timer and nullify (not literally) the body's last position
            this.tryForDestinationTimer.reset();
            this.lastPosition = {
                x: -50,
                y: -50
            };

            //don't do anything if they're already at their destination
            if (this.body.position.x == destination.x && this.body.position.y == destination.y)
                return;

            //set state
            this.destination = destination;
            this.isMoving = true;
            this.body.frictionAir = 0;

            //immediate set the velocity (rather than waiting for the next tick)
            this.constantlySetVelocityTowardsDestination();

            //un-static the body (attackers become static when firing)
            if(this.body.isStatic) {
                Matter.Body.setStatic(this.body, false);
            }

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

            Matter.Events.trigger(this, 'stop', {});

            this.body.frictionAir = .9;
            this.isMoving = false;
            this.isSoloMover = false;
            this.tryForDestinationTimer.paused = true;
        },

        pause: function(target) {
            Matter.Body.setVelocity(this.body, {
                x: 0,
                y: 0
            });
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

        constantlySetVelocityTowardsDestination: function(event) {

            if (!this.isMoving) {
                return;
            }
            var alteredOvershootBuffer = this.isSoloMover ? this.overshootBuffer : this.overshootBuffer * 20;

            //stop condition: This executes after an engine update, but before a render. It detects when a body has overshot its destination
            //and will stop the body. Group movements are more forgiving in terms of reaching one's destination; this is reflected in a larger
            //overshoot buffer
            if (this.destination.x + alteredOvershootBuffer > this.body.position.x && this.destination.x - alteredOvershootBuffer < this.body.position.x) {
                if (this.destination.y + alteredOvershootBuffer > this.body.position.y && this.destination.y - alteredOvershootBuffer < this.body.position.y) {
                    this.stop();
                    return;
                }
            }

            //send body
            utils.sendBodyToDestinationAtSpeed(this.body, this.destination, this.moveSpeed, false);
        },

        //This tests whether units with the same destination have reached the destination as a group. If this moveable collides with a moveable with the same destination
        //and the other body is already stopped and we're in a certain range of the destination, stop us too, since we're close enough and our "group" has reached the destination.
        collideCallback: function(pair) {
            if (!this.isMoving) return;
            var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
            if (this.destination.x + this.stopOnCollisionBuffer > this.position.x && this.destination.x - this.stopOnCollisionBuffer < this.position.x) {
                if (this.destination.y + this.stopOnCollisionBuffer > this.position.y && this.destination.y - this.stopOnCollisionBuffer < this.position.y) {
                    if (otherBody.isMoveable && !otherBody.isMoving && otherBody.destination && otherBody.destination.x == this.destination.x && otherBody.destination.y == this.destination.y) {
                        this.stop();
                    }
                }
            }
        },

        //This will move me out of the way if I'm not moving and a moving object is colliding with me.
        avoidCallback: function(pair) {
            if (this.isMoving) return;
            var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
            if (otherBody.isMoveable && otherBody.isMoving && otherBody.destination != this.destination) {
                this.frictionAir = .9;
                console.info(otherBody + " colliding with me (" + this.id + ")");
                console.info(otherBody.velocity);
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
                console.info(newVelocity);
                var scatterScale = scatterDistance/Matter.Vector.magnitude(newVelocity);
                console.info(scatterScale);
                this.unit.move(Matter.Vector.add(this.position, Matter.Vector.mult(newVelocity, scatterScale)));
                // Matter.Body.setVelocity(this, {
                //     x: otherBody.velocity.y * swapX * gtfoScale,
                //     y: otherBody.velocity.x * swapY * gtfoScale
                // });
            }
        },
        groupRightClick: function(destination) {
            this.move(destination);
        },
    }

})
