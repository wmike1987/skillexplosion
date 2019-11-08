define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin'], function($, Matter, PIXI, CommonGameMixin) {
    
    return {
        isMoveable: true,
        isMoving: false,
        destination: null,
        moveSpeed: null,
        moveTick: null,
        hasMoved: false,
        isSoloMover: false,
        stopOnCollisionBuffer: 30, //pixels
        overshootBuffer: 1, //pixels
        sensorCollisionCategory: 0x8000,
        noProgressBuffer: 15, //pixels
        
        moveableInit: function() {
            /*var clickPointSprite = currentGame.addSomethingToRenderer(currentGame.texture('MouseX'), 'foreground', {x: -50, y: -50});
				clickPointSprite.scale.x = .25;
				clickPointSprite.scale.y = .25;
				
				var clickPointSprite2 = currentGame.addSomethingToRenderer(currentGame.texture('MouseXGreen'), 'foreground', {x: -50, y: -50});
					clickPointSprite2.scale.x = .25;
				clickPointSprite2.scale.y = .25;*/
            
            this._moveableInit = true;
            
            //create body sensor - the selection box collides with a slightly smaller body size
            this.smallerBody = Matter.Bodies.circle(0, 0, this.circleRadius-8, { isSensor: true, noWire: true });
            this.smallerBody.collisionFilter.category = this.sensorCollisionCategory;
            this.smallerBody.collisionFilter.mask = 0x2000;
            this.smallerBody.isSmallerBody = true;
            this.smallerBody.parentBody = this;
            var smallerCallback = currentGame.addTickCallback(function() {
                Matter.Body.setPosition(this.smallerBody, {x: this.position.x, y: this.position.y});
            }.bind(this));
            currentGame.addBody(this.smallerBody);
            Matter.Events.on(this, "onremove", function() {
                currentGame.removeBody(this.smallerBody);
                currentGame.removeTickCallback(smallerCallback);
                currentGame.invalidateTimer(this.timer);
                currentGame.removeTickCallback(this.moveTick);
            }.bind(this));
            
            Matter.Events.on(this, 'onCollideActive', this.collideCallback);
            Matter.Events.on(this, 'onCollideActive', this.avoidCallback);
            this.moveTick = currentGame.addRunnerCallback(this.constantlySetVelocityTowardsDestination.bind(this), false, 'afterUpdate');
            this.timer = {name: 'tryForDestination' + this.id, gogogo:true, timeLimit: 850, callback: function() {
    			    if(this.lastPosition) {
    			        //clickPointSprite2.position = this.position;
    			        if(this.lastPosition.x + this.noProgressBuffer > this.position.x && this.lastPosition.x - this.noProgressBuffer < this.position.x) {
        			        if(this.lastPosition.y + this.noProgressBuffer > this.position.y && this.lastPosition.y - this.noProgressBuffer < this.position.y) {
        			            this.stop();
        			        }
    			        }
    			    }
    			    //clickPointSprite.position = this.lastPosition || {x: 0, y: 0};
    				this.lastPosition = Matter.Vector.clone(this.position);
    			}.bind(this)};
            currentGame.addTimer(this.timer);
        },
        
        move: function(destination) {
            
            if(!this._moveableInit) {
                this.moveableInit();
            }
            
            //reset try for destination timer and nullify (not literally) the body's last position
            this.timer.reset();
            this.lastPosition = {x: -50, y: -50};
            
            //don't do anything if they're already at their destination
            if(this.position.x == destination.x && this.position.y == destination.y)
                return;
                
            //set state, some of this does nothing and should be revamped
            this.destination = destination;
            this.isMoving = true;
            this.frictionAir = 0;
            Matter.Body.setMass(this, 5);
        }, 
        stop: function() {
            if(!this._moveableInit) {
                this.moveableInit();
            }
            
            Matter.Body.setVelocity(this, {x: 0, y: 0});
            this.frictionAir = .8;
            Matter.Body.setMass(this, 5);
            this.isMoving = false;
            this.isSoloMover = false;
            this.timer.paused = true;
        },
        constantlySetVelocityTowardsDestination: function(event) {
            if(!this.isMoving) return;
            var alteredOvershootBuffer = this.isSoloMover ? this.overshootBuffer : this.overshootBuffer * 20;
            
            //stop condition: This executes after an engine update, but before a render. It detects when a body has overshot its destination
            //and will stop the body. Group movements are more forgiving in terms of reaching one's destination; this is reflected in a larger
            //overshoot buffer
            if(this.destination.x + alteredOvershootBuffer > this.position.x && this.destination.x - alteredOvershootBuffer < this.position.x) {
                if(this.destination.y + alteredOvershootBuffer > this.position.y && this.destination.y - alteredOvershootBuffer < this.position.y) {
                    this.stop();
                    return;
                }
            }
            
            //figure out the movement vector
            var velocityVector = Matter.Vector.sub(this.destination, this.position);
            var velocityScale = this.moveSpeed/Matter.Vector.magnitude(velocityVector);
            if(Matter.Vector.magnitude(velocityVector) < this.moveSpeed)
                Matter.Body.setVelocity(this, velocityVector);
            else
                Matter.Body.setVelocity(this, Matter.Vector.mult(velocityVector, velocityScale));
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
                Matter.Body.setVelocity(this, {x: otherBody.velocity.y * swapX * 4, y: otherBody.velocity.x * swapY * 4.5});
            }
        },
        groupRightClick: function(destination) {
            this.move(destination);
        },
    }
    
})














