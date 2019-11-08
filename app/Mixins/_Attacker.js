define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin'], function($, Matter, PIXI, CommonGameMixin) {
    
    return {
        isAttacker: true,
        honeRange: 250,
        range: 100,
        cooldown: 3000,
        damage: 6,
        currentTarget: null,
        currentHone: null,
        canAttack: true,
        sensorCollisionCategory: 0x0008,
        randomizeHone: true,
        honableTargets: null, //this prevents the need for honing sensor (which can have a negative performance impact)
        
        _initAttacker: function() {
            
            this.availableTargets = new Set();
            this.tickCallbacks = [];
            
            //setup collision params
            this.collisionFilter.category = this.team || 4;
            
            //create range sensor
            this.rangeSensor = Matter.Bodies.circle(0, 0, this.range, { isStatic: true, isSensor: true, noWire: true });
			this.rangeSensor.collisionFilter.category = this.sensorCollisionCategory;
			this.rangeSensor.collisionFilter.mask = this.rangeSensor.collisionFilter.mask-this.sensorCollisionCategory-this.collisionFilter.category;
            this.tickCallbacks.push(currentGame.addTickCallback(function() {
                Matter.Body.setPosition(this.rangeSensor, {x: this.position.x, y: this.position.y});
            }.bind(this)));
            currentGame.addBody(this.rangeSensor);
            
            //create honing sensor if needed
            if(!this.honableTargets) {
                this.honableTargets = new Set();
                this.honingSensor = Matter.Bodies.rectangle(0, 0, this.honeRange, this.honeRange, { isStatic: true, isSensor: true, noWire: true });
    			this.honingSensor.collisionFilter.category = this.sensorCollisionCategory;
    			this.honingSensor.collisionFilter.mask = this.honingSensor.collisionFilter.mask-this.sensorCollisionCategory-this.collisionFilter.category;
                this.tickCallbacks.push(currentGame.addTickCallback(function() {
                    Matter.Body.setPosition(this.honingSensor, {x: this.position.x, y: this.position.y});
                }.bind(this)));
                currentGame.addBody(this.honingSensor);
                
                //honing range sensing
                Matter.Events.on(this.honingSensor, 'onCollide', function(pair) {
    		        var otherBody = pair.pair.bodyA == this.honingSensor ? pair.pair.bodyB : pair.pair.bodyA;
    		        if(otherBody.isAttackable && this.team != otherBody.team) {
    	                this.honableTargets.add(otherBody);
    		        }
    		    }.bind(this));
    		    
                Matter.Events.on(this.honingSensor, 'onCollideEnd', function(pair) {
    		        var otherBody = pair.pair.bodyA == this.honingSensor ? pair.pair.bodyB : pair.pair.bodyA;
    		        if(otherBody.isAttackable && this.team != otherBody.team) {
    	                this.honableTargets.delete(otherBody);
    		        }
    		        if(this.currentHone == otherBody)
    		            this.currentHone = null;
    		    }.bind(this));
            }
            
            Matter.Events.on(this, "onremove", function() {
                if(this.rangeSensor)
                    currentGame.removeBody(this.rangeSensor);
                if(this.honingSensor)
                    currentGame.removeBody(this.honingSensor);
                $.each(this.tickCallbacks, function(index, cb) {
                    currentGame.removeTickCallback(cb);
                })
                currentGame.invalidateTimer(this.cooldownTimer);
                this._becomePeaceful();
            }.bind(this));
            
            //attack range sensing
            Matter.Events.on(this.rangeSensor, 'onCollide', function(pair) {
		        var otherBody = pair.pair.bodyA == this.rangeSensor ? pair.pair.bodyB : pair.pair.bodyA;
		        if(otherBody.isAttackable && this.team != otherBody.team) {
	                this.availableTargets.add(otherBody);
		        }
		    }.bind(this));
		    
            Matter.Events.on(this.rangeSensor, 'onCollideEnd', function(pair) {
		        var otherBody = pair.pair.bodyA == this.rangeSensor ? pair.pair.bodyB : pair.pair.bodyA;
		        if(otherBody.isAttackable && this.team != otherBody.team) {
	                this.availableTargets.delete(otherBody);
		        }
		        if(this.currentTarget == otherBody)
		            this.currentTarget = null;
		    }.bind(this));
		    
		    this.cooldownTimer = currentGame.addTimer({name: 'cooldown' + this.id, runs: 0, timeLimit: this.cooldown, callback: function() {
                this.canAttack = true;
		    }.bind(this)});
		    
		    //extend move to cease attacking
		    var originalMove = this.move;
		    this.move = function(destination) {
		        originalMove.call(this, destination);
		        this._becomePeaceful();
		    }
		    
		    //extend stop
		    var originalStop = this.stop;
		    this.stop = function() {
		        originalStop.call(this);
                this._becomeOnAlert();
		    }
		    
		    this._becomeOnAlert();
		    this._attackerInit = true;
        },
        
        _attack: function(target) {
            if(!this._attackerInit)
                this._initAttacker();
            
            if(this.canAttack) {
                this.stop();
                if(this.attack)
                    this.attack(target);
                this.canAttack = false;
                this.cooldownTimer.reset();
                this.cooldownTimer.runs = 1;
            }
        },
        
        //this assumes _moveable is mixed in
        attackMove: function(destination) {
            if(!this._attackerInit)
                this._initAttacker();
                
            //move unit
            this.move(destination);
            
            //become alert to nearby enemies
            this._becomeOnAlert();            
        },
        
        _becomeOnAlert: function() {
            if(this.attackHoneTick)
                currentGame.removeTickCallback(this.attackHoneTick);
        
            //constantly scan for units within honing range and move towards them
            this.attackHoneTick = currentGame.addTickCallback(function() {
                if(this.honableTargets.size > 0 && (!this.currentHone || !Matter.Composite.get(currentGame.renderer.engine.world, this.currentHone.id, 'body'))) {
                    //make sure we have honable targets
                    var oneExists = false;
                    
                    for (let item of this.honableTargets) {
                        oneExists = oneExists || Matter.Composite.get(currentGame.renderer.engine.world, item.id, 'body')
                    }
                    
                    if(!oneExists)
                        return;
                    
                    //get random target
                    var randomTarget = {id: -11111}; //doesn't matter first time around
                    while(!Matter.Composite.get(currentGame.renderer.engine.world, randomTarget.id, 'body')) {
                        var j = 1;
                        var rand = currentGame.getRandomIntInclusive(1, this.honableTargets.size);
                        for (let item of this.honableTargets) {
                            if(rand == j) {
                                randomTarget = item;
                            }
                            j++;
                        }
                    }
                    this.currentHone = randomTarget;
                }
                if(this.currentHone)
                    this.attackMove(this.currentHone.position);                
            }.bind(this));
            
            //constantly scan for units within range and issue attack
            if(this.attackMoveTick)
                currentGame.removeTickCallback(this.attackMoveTick);
                
            this.attackMoveTick = currentGame.addTickCallback(function() {
                if(this.availableTargets.size > 0 && !this.currentTarget) {
                    for (let item of this.availableTargets) {
                        this.currentTarget = item;
                        break;
                    }
                }
                if(this.currentTarget)
                    this._attack(this.currentTarget);                
            }.bind(this))
        },
        
        _becomePeaceful: function() {
            this.currentTarget = null;
            if(this.attackMoveTick)
                currentGame.removeTickCallback(this.attackMoveTick);
            if(this.attackHoneTick)
                currentGame.removeTickCallback(this.attackHoneTick);
        },
        
        //might use later for prioritizing targets
        chooseTarget: function() {
            
        },
        
        attackChosenTarget: function() {
            
        },
    }
    
})














