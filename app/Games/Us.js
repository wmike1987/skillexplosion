define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'mixins/_Attacker', 'units/Gunner', 'units/Baneling'], function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Gunner, Baneling) {
	
	var targetScore = 1;
	
	var blueGlowShader = `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform vec2 unitStart;
        uniform vec2 currentUnitPosition;
        
        void main()
        {
           vec4 fg = texture2D(uSampler, vTextureCoord);
           if(fg.a > 0.0) {
            gl_FragColor.r = 1.0;
            
            if(currentUnitPosition.x < unitStart.x) {
                gl_FragColor.b = 0.0;    
            } else {
                gl_FragColor.b = 1.0;
            }
           }
        }
    `;
	
	var game = {
		gameName: 'Us',
		extraLarge: 32,
		large: 18,
		medium: 16,
		small: 8,
		zoneSize: 128,
		level: 1,
		victoryCondition: {type: 'lives', limit: 95},
		currentZones: [],
		selectionBox: true,
		noClickIndicator: true,
		acceptableTints: [/*blue*/ 0x009BFF, /*green*/0xCBCBCB /*red0xFF2300 0xFFFFFF*/, /*purple*/0xCC00BA, /*yellow*/0xCFD511],
		highlightTints: [/*blue*/ 0x43FCFF, /*green*/0xFFFFFF /*red0xFF2300 0xFFFFFF*/, /*purple*/0xFFB8F3, /*yellow*/0xFBFF00],
		selectionTint: 0x33FF45,
		pendingSelectionTint: 0x70ff32,
		previousListener: null,
		baneSpeed: 2.0,
		
		initExtension: function() {
		    //wave begin sound
		    this.nextWave = this.getSound('rush1.wav');
		    
		    //blow up sound
		    this.pop = this.getSound('pop1.wav');
		    
		    //create blue glow filter
		    //this.blueGlowFilter = new PIXI.Filter(null, blueGlowShader)
		},
		
		play: function(options) {
            this.nextLevel();
            
		},
		
		nextLevel: function() {
		    
            console.info("NEXT LEVEL - " + this.level);
		    if(this.lives == 0) return;
		    var s = this.nextWave.play();
		    this.nextWave.rate(.8 + .1 * this.level, s);
		    
		    if(this.banes)
		        this.removeBodies(this.banes);
		    if(this.marbles) {
		        this.incrementScore(this.marbles.length);
		        this.removeBodies(this.marbles);
		    }
		    this.marbles = [];
		    this.banes = [];
		    
		    //increment level
		    this.level += 1;
		    //start increasing speed if we've got lots of units on the map
		    var levelCap = 18;
		    if(this.level < levelCap) {
    		    this.baneSpeed = Math.min(2.5, this.baneSpeed+.05);
    		    var numberOfDrones = 3 + this.level * 2; //add two drones per level
    		    var numberOfBanes = Math.floor(numberOfDrones*.75); // three fourths-ish    
		    } else {
		        this.baneSpeed = Math.min(3.2, this.baneSpeed+.03);
    		    var numberOfDrones = 3 + levelCap * 2; //add two drones per level
    		    var numberOfBanes = Math.floor(numberOfDrones*.75); // three fourths-ish
		    }
		    
			this.createGunner(2);
			this.createBane(20);
			
	        //this.createGunner(2);
		        
		    //create banelings
            //this.createBanelings(10);
		
		},
		
		//create gunner
		createGunner: function(number) {
		    for(x = 0; x < number; x++) {
				var gunner = Gunner();
    			this.marbles.push(gunner.body);
    			gunner.typeId = 34;
    			gunner.directional = true;
    			this.placeBodyWithinRadiusAroundCanvasCenter(gunner, 4);
    
    // 			this.blueGlowFilter.uniforms.unitStart = {x: marble.position.x, y: marble.position.y};
    		  //  this.addTickCallback(function() {
    		  //      this.blueGlowFilter.uniforms.currentUnitPosition = {x: marble.position.x, y: marble.position.y};
    		  //  }.bind(this))
			  
    			this.addBody(gunner, true);
		    }
		},
		
		//create gunner
		createBane: function(number) {
		    for(x = 0; x < number; x++) {
				var gunner = Baneling({team: 2});
    			this.marbles.push(gunner.body);
    			gunner.typeId = 34;
    			//gunner.directional = true;
    			this.placeBodyWithinRadiusAroundCanvasCenter(gunner, 4);
    
    // 			this.blueGlowFilter.uniforms.unitStart = {x: marble.position.x, y: marble.position.y};
    		  //  this.addTickCallback(function() {
    		  //      this.blueGlowFilter.uniforms.currentUnitPosition = {x: marble.position.x, y: marble.position.y};
    		  //  }.bind(this))
			  
				if(this.flipCoin()) {
                    Matter.Body.setPosition(gunner.body, {x: Math.random() * 100, y: this.getCanvasCenter().y + Math.random() * 600 - 300});
                } else {
                    Matter.Body.setPosition(gunner.body, {x: this.getCanvasWidth() - Math.random() * 100, y: this.getCanvasCenter().y + Math.random() * 600 - 300});
                }
                
                //Matter.Body.setPosition(blastSensor, {x: marble.position.x, y: marble.position.y});
    			this.addBody(gunner, true);
		    }
		},
		
		createBanelings: function(number) {
		    var side = Math.random();
		    for(x = 0; x < number; x++) {
    			var radius = this.medium;
    			const marble = Matter.Bodies.circle(0, 0, radius, { restitution: .95, frictionAir: 1});
    			this.banes.push(marble);
    			$.extend(marble, Moveable);
    			$.extend(marble, Attacker);
    			marble.honeRange = 200;
    			marble.range = radius*2+10;
    			marble.baneling = true;
    			marble.team = 2;
    			marble.hp = 10;
    			marble.isSelectable = false;
    			marble.isMoveable = true;
			    marble.isAttackable = true;
    			marble.moveSpeed = this.baneSpeed;
    			marble.stop();
    			var tintIndex = this.getRandomIntInclusive(0, this.acceptableTints.length-1);
    			marble.originalTint = 0x00FF00;
    			marble.tint = marble.originalTint;
    			marble.highlightTint = this.highlightTints[tintIndex];
    			marble.typeId = 33;
                marble.sufferAttack = function(damage) {
                    marble.hp -= damage;
                    if(marble.hp <= 0) {
                        marble.attack();
                    }
                }
    			
	            //create attack blast radius
	            var blastRadius = radius*2.5;
                const blastSensor = Matter.Bodies.circle(0, 0, blastRadius, { isStatic: true, isSensor: true, noWire: true });
                blastSensor.collisionFilter.category = marble.sensorCollisionCategory;
                blastSensor.collisionFilter.mask = blastSensor.collisionFilter.mask - marble.sensorCollisionCategory - marble.team;
    			this.deathPact(marble, blastSensor);
                const blastSensorTick = this.addTickCallback(function() {
                    Matter.Body.setPosition(blastSensor, {x: marble.position.x, y: marble.position.y});
                }.bind(this));
                this.addBody(blastSensor);
                
                Matter.Events.on(marble, "onremove", function() {
                    this.removeTickCallback(blastSensorTick);
                }.bind(this));
                
                //blast targets
    			marble.blastTargets = new Set();
                Matter.Events.on(blastSensor, 'onCollide', function(pair) {
    		        var otherBody = pair.pair.bodyA == blastSensor ? pair.pair.bodyB : pair.pair.bodyA;
    		        if(otherBody.isAttackable && marble.team != otherBody.team) {
    	                marble.blastTargets.add(otherBody);
    		        }
    		    });
    		    
                Matter.Events.on(blastSensor, 'onCollideEnd', function(pair) {
    		        var otherBody = pair.pair.bodyA == blastSensor ? pair.pair.bodyB : pair.pair.bodyA;
    		        if(otherBody.isAttackable && marble.team != otherBody.team) {
    	                marble.blastTargets.delete(otherBody);
    		        }
    		    });
    			
    			marble.attack = function(target) {
    			    this.getAnimation('bane', [marble.positionCopy.x, marble.positionCopy.y, (blastRadius*2/64), (blastRadius*2/64), Math.random()*40], .5, null, 1, null, null, 5).play();
    			    if(this.banes.indexOf(marble) > -1)
    			        this.banes.splice(this.banes.indexOf(marble), 1);
    			    var nextLevelGo = false;
    			    if(this.banes.length == 0) {
    			        nextLevelGo = true;
    			    }
    			    this.pop.play();
    			    this.removeBody(marble);
    			    marble.blastTargets.forEach(function(index, target) {
    			        if(this.marbles.indexOf(target) >= 0) {
    			            var shard = this.addSomethingToRenderer('glassShards', 'background', {position: target.position, scale: {x: .65, y: .65}, tint: target.tint, rotation: Math.random()*6});
                		    this.addTimer({name: 'shardDisappear' + target.id, persists: true, timeLimit: 48, runs: 20, killsSelf: true, callback: function() {
                                shard.alpha -= .05;
            					    }, totallyDoneCallback: function() {
            					        this.removeSomethingFromRenderer(shard);
            			    }.bind(this)})
    			            this.marbles.splice(this.marbles.indexOf(target), 1);
    			        }
    			        if(this.marbles.length == 0) {
    			            this.addLives(-1);
    			            nextLevelGo = true;
    			        }
    			        
    			        this.removeBody(target);
    			    }.bind(this));
    			    
    			    if(nextLevelGo) {
    			        setTimeout(this.nextLevel.bind(this), 250);
    			    }
    			}.bind(this);
    			
    			marble.renderChildren = [{
    			    id: 'marble',
    			    data: this.texture('GlassMarble'),
    			    tint: marble.originalTint,
    			    scale: {x: radius*2/64, y: radius*2/64},
    			    rotate: 'none',
    			}, {
    			    id: 'marbleBodyHighlight',
    			    data: this.texture('MarbleBodyHighlights'),
    			    scale: {x: radius*2/64, y: radius*2/64},
    			    rotate: 'random',
    			    rotatePredicate: function() {
    			        return marble.isMoving;
    			    },
    			    tint: marble.highlightTint,
    			    initialRotate: 'random'
    			}, {
    			    id: 'marbleHighlight',
    			    data: this.texture('MarbleHighlight'),
    			    scale: {x: radius*2/64, y: radius*2/64},
    			    rotate: 'none',
    			    initialRotate: 'none'
    			}, {
    			    id: 'marbleShadow',
    			    data: this.texture('MarbleShadow'),
    			    scale: {x: radius*2.5/256, y: radius*2.5/256},
    			    visible: true,
    			    rotate: 'none',
    			    tint: marble.originalTint,
    			    stage: "stageZero",
    			    offset: {x: 12, y: 12},
    			}, {
    			    id: 'marbleShadowHighlights',
    			    data: this.texture('MarbleShadowHighlight'),
    			    scale: {x: radius*1.6/256, y: radius*1.6/256},
    			    visible: false,
    			    rotate: 'random',
    			    rotatePredicate: function() {
    			        return marble.isMoving;
    			    },
    			    initialRotate: 'random',
    			    tint: marble.highlightTint,
    			    stage: "stageZero",
    			    offset: {x: 12, y: 12}
    			}, {
    			    id: 'selected',
    			    data: this.texture('MarbleSelected'),
    			    scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
    			    tint: this.selectionTint,
    			    stage: 'stageOne',
    			    visible: false,
    			    rotate: 'none'
    			}, {
    			    id: 'selectionPending',
    			    data: this.texture('MarbleSelectedPending'),
    			    scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
    			    stage: 'stageOne',
    			    visible: false,
    			    tint: this.pendingSelectionTint,
    			    rotate: 'continuous'
    			}];
                if(side > .5) {
                    Matter.Body.setPosition(marble, {x: Math.random() * 100, y: this.getCanvasCenter().y + Math.random() * 600 - 300});
                } else {
                    Matter.Body.setPosition(marble, {x: this.getCanvasWidth() - Math.random() * 100, y: this.getCanvasCenter().y + Math.random() * 600 - 300});
                }
                
                Matter.Body.setPosition(blastSensor, {x: marble.position.x, y: marble.position.y});
                
    			this.addBody(marble, true);
		    }

		},
		
		resetGameExtension: function() {
		    this.level = 0;
		}
	}
	
	/*
	 * Options to for the game starter
	 */ 
	game.worldOptions = {
			background: {image: 'IsoBackground', scale: {x: 1.5, y: 1.5}},
		        width: 1200, 
		        height: 600,     
		        gravity: 0,  
		       };

    game.instructions = ['Split the purple marbles to avoid area of effect damage', 'If all purple marbles die, you lose a life'];
	
	return $.extend({}, CommonGameMixin, game);
})














