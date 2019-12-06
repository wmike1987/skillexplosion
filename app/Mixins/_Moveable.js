define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin'], function($, Matter, PIXI, CommonGameMixin) {
    
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
        sensorCollisionCategory: 0x8000,
        noProgressBuffer: 15, //pixels
        
		//user defined
		moveSpeed: null,
		
        //directional data
		facing: null,
        visibleSprite: null,
        animationStateNames: ['stand', 'left', 'right', 'up', 'down', 'downRight', 'downLeft', 'upRight', 'upLeft'],
        
        moveableInit: function() {
            if(this._moveableInit) return;
            this._moveableInit = true;
            
            //create body sensor - the selection box collides with a slightly smaller body size
            this.smallerBody = Matter.Bodies.circle(0, 0, this.body.circleRadius-8, { isSensor: true, noWire: true });
            this.smallerBody.collisionFilter.category = this.sensorCollisionCategory;
            this.smallerBody.collisionFilter.mask = 0x0002;//this.smallerBody.collisionFilter.mask - (this.team || 4);
            this.smallerBody.isSmallerBody = true;
            this.smallerBody.unit = this;
            var smallerCallback = currentGame.addTickCallback(function() {
                Matter.Body.setPosition(this.smallerBody, {x: this.body.position.x, y: this.body.position.y});
            }.bind(this));
            currentGame.addBody(this.smallerBody);
            Matter.Events.on(this, "onremove", function() {
                currentGame.removeBody(this.smallerBody);
                currentGame.removeTickCallback(smallerCallback);
                currentGame.invalidateTimer(this.timer);
                currentGame.removeTickCallback(this.moveTick);
            }.bind(this));
            
            Matter.Events.on(this.body, 'onCollideActive', this.collideCallback);
            Matter.Events.on(this.body, 'onCollideActive', this.avoidCallback);
            this.moveTick = currentGame.addRunnerCallback(this.constantlySetVelocityTowardsDestination.bind(this), false);
            this.timer = {name: 'tryForDestination' + this.body.id, gogogo:true, timeLimit: 850, callback: function() {
    			    if(this.lastPosition && this.isMoving) {
    			        //clickPointSprite2.position = this.position;
    			        if(this.lastPosition.x + this.noProgressBuffer > this.body.position.x && this.lastPosition.x - this.noProgressBuffer < this.body.position.x) {
        			        if(this.lastPosition.y + this.noProgressBuffer > this.body.position.y && this.lastPosition.y - this.noProgressBuffer < this.body.position.y) {
        			            this.stop();
        			        }
    			        }
    			    }
    			    //clickPointSprite.position = this.lastPosition || {x: 0, y: 0};
    				this.lastPosition = Matter.Vector.clone(this.body.position);
    			}.bind(this)};
            currentGame.addTimer(this.timer);
        },
        
        move: function(destination) {
            
            //reset try for destination timer and nullify (not literally) the body's last position
            this.timer.reset();
            this.lastPosition = {x: -50, y: -50};
            
            //don't do anything if they're already at their destination
            if(this.body.position.x == destination.x && this.body.position.y == destination.y)
                return;
                
            //set state, some of this does nothing and should be revamped
            this.destination = destination;
            this.isMoving = true;
            this.body.frictionAir = 0;
            Matter.Body.setMass(this.body, 5);
        }, 
        stop: function() {
            
            Matter.Body.setVelocity(this.body, {x: 0, y: 0});
            Matter.Events.trigger(this, 'stop', {});
            
            this.body.frictionAir = .8;
            Matter.Body.setMass(this.body, 5);
            this.isMoving = false;
            this.isSoloMover = false;
            this.timer.paused = true;
        },
		
		pause: function(target) {
            Matter.Body.setVelocity(this.body, {x: 0, y: 0});
            Matter.Events.trigger(this, 'pause', {});
            
            this.body.frictionAir = .8;
            Matter.Body.setMass(this.body, 5);
            this.isMoving = false;
            this.isSoloMover = false;
            this.timer.paused = true;
        },
		resume: function() {
			this.isMoving = true;
            this.body.frictionAir = 0;
            Matter.Body.setMass(this.body, 5);
		},
        constantlySetVelocityTowardsDestination: function(event) {
            
            if(!this.isMoving) {
                return;
            }
            var alteredOvershootBuffer = this.isSoloMover ? this.overshootBuffer : this.overshootBuffer * 20;
            
            //stop condition: This executes after an engine update, but before a render. It detects when a body has overshot its destination
            //and will stop the body. Group movements are more forgiving in terms of reaching one's destination; this is reflected in a larger
            //overshoot buffer
            if(this.destination.x + alteredOvershootBuffer > this.body.position.x && this.destination.x - alteredOvershootBuffer < this.body.position.x) {
                if(this.destination.y + alteredOvershootBuffer > this.body.position.y && this.destination.y - alteredOvershootBuffer < this.body.position.y) {
                    this.stop();
                    return;
                }
            }
            
            //figure out the movement vector
            var velocityVector = Matter.Vector.sub(this.destination, this.body.position);
            var velocityScale = this.moveSpeed/Matter.Vector.magnitude(velocityVector);
            
			//trigger movement event
			Matter.Events.trigger(this, 'move', {direction: currentGame.isoDirectionBetweenPositions(this.position, this.destination)});
            if(Matter.Vector.magnitude(velocityVector) < this.moveSpeed)
                Matter.Body.setVelocity(this.body, velocityVector);
            else
                Matter.Body.setVelocity(this.body, Matter.Vector.mult(velocityVector, velocityScale));
        },
        collideCallback: function(pair) {
            if(!this.isMoving) return;
            var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
            if(this.destination.x + this.stopOnCollisionBuffer > this.position.x && this.destination.x - this.stopOnCollisionBuffer < this.position.x) {
                if(this.destination.y + this.stopOnCollisionBuffer > this.position.y && this.destination.y - this.stopOnCollisionBuffer < this.position.y) {
                    if(otherBody.isMoveable && !otherBody.isMoving && otherBody.destination && otherBody.destination.x == this.destination.x && otherBody.destination.y == this.destination.y) {
                        this.stop();
                    }
                }
            }
        },
        avoidCallback: function(pair) {
            if(this.isMoving) return;
            var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
            if(otherBody.isMoveable && otherBody.isMoving && otherBody.destination != this.destination) {
                var m = otherBody.velocity.y / otherBody.velocity.x;
                var x = this.position.x - otherBody.position.x;
                var b = otherBody.position.y;
                magicY = m*x + b;
                var swapX = 1;
                var swapY = 1;
                if(magicY < this.position.y) {
                    if(otherBody.velocity.x <= 0)
                        swapY = -1;
                    else
                        swapX = -1;
                } else {
                    if(otherBody.velocity.x <= 0)
                        swapX = -1;
                    else
                        swapY = -1;
                }
				//gtfo scale needs to move the body at it's velocity
				var gtfoScale = 4.5;
                Matter.Body.setVelocity(this, {x: otherBody.velocity.y * swapX * gtfoScale, y: otherBody.velocity.x * swapY * gtfoScale});
            }
        },
        groupRightClick: function(destination) {
            this.move(destination);
        },
    }
    
})














