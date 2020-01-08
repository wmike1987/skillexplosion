define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'utils/GameUtils', 'utils/Command', 'utils/PathFinder'],
function($, Matter, PIXI, CommonGameMixin, utils, Command, pf) {

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

        //path-finding
        path: null,

        moveableInit: function() {
            this.eventMappings['move'] = this.move;

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

            //////////// PATH FINDING -- FOR TESTING ONLY /////////////////////
            var grid = new pf.Grid(currentGame.width / 300,
                                   currentGame.height / 300);

            //add an obstacle
            var obstacle = [
                {x: 12, y: 15},
                {x: 12, y: 12},
                {x: 12, y: 9},
                {x: 12, y: 6}
            ];
            grid.addObstacle(obstacle);

            var AStar = new pf.AStar({
                allowDiagonal: true,
                heuristic: "octile",
            });

            var startX = Math.floor(this.body.position.x / 300);
            var startY = Math.floor(this.body.position.y / 300);
            var endX = Math.floor(destination.x / 300);
            var endY = Math.floor(destination.y / 300);

            this.path = AStar.findPath(startX, startY, endX, endY, grid);
            console.log(this.path);
            //////////// PATH FINDING END /////////////////////

            //un-static the body (attackers become static when firing)
            if(this.body.isStatic) {
                Matter.Body.setStatic(this.body, false);
            }

            //immediate set the velocity (rather than waiting for the next tick)
            this.constantlySetVelocityTowardsDestination();

            //setup the constant move tick
            if(this.moveTick)
                currentGame.removeRunnerCallback(this.moveTick);
            this.moveTick = currentGame.addRunnerCallback(this.constantlySetVelocityTowardsDestination.bind(this), false);
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
                timeLimit: 500,
                callback: function() {
                    if (this.lastPosition && this.isMoving) {
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
            if (!this.isMoving)
                return;

            //////////////////////// AJBOND //////////////////////////////
            // Set current path index
            var pi = 0;

            // get current position in terms of tiles
            var curX = Math.floor(this.body.position.x / 300);
            var curY = Math.floor(this.body.position.y / 300);

            // check if the tile specified by path[pi] has been reached
            if (this.path[pi].x == curX && this.path[pi].y == curY) {
                if (this.path.length === 1) {
                    utils.sendBodyToDestinationAtSpeed(this.body, this.destination, this.moveSpeed, false);
                    return;
                }
                this.path.shift();
            }
            ///////////////////// AJBOND /////////////////////////////////

            //send body
            utils.sendBodyToDestinationAtSpeed(this.body, {x: this.path[pi].x * 300, y: this.path[pi].y * 300}, this.moveSpeed, false);
        },

        //This will move me out of the way if I'm not moving and a moving object is colliding with me.
        avoidCallback: function(pair) {
            if (this.isMoving) return;
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
                this.unit.move(Matter.Vector.add(this.position, Matter.Vector.mult(newVelocity, scatterScale)));
            }
        },
        groupRightClick: function(destination) {
            this.move(destination);
        },
    }

    return moveable;
})
