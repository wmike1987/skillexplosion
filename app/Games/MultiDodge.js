define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'particles'], function($, Matter, PIXI, CommonGameMixin, Moveable, particles) {
	
	var targetScore = 1;
	
	var game = {
		gameName: 'MultiDodge',
		extraLarge: 20,
		large: 18,
		medium: 16,
		smallish: 14,
		zoneSize: 128,
		level: 0,
		victoryCondition: {type: 'lives', limit: 6},
		currentZones: [],
		selectionBox: true,
		noClickIndicator: true,
		acceptableTints: [/*salmon*/ 0xFF5733, /*green*/0x21D06E /*red0xFF2300 0xFFFFFF*/, /*purple*/0x32F3FF, /*yellow*/0xEA1111],
		highlightTints: [/*blue*/ 0xECFF32, /*green*/0xFFFFFF /*red0xFF2300 0xFFFFFF*/, /*purple*/0xFFB8F3, /*yellow*/0xFBFF00],
		blinkTint: [],
		selectionTint: 0x33FF45,
		pendingSelectionTint: 0x70ff32,
		previousListener: null,
		flakes: [],
		
		initExtension: function() {

		},
		
		play: function(options) {
            
		    var game = this;
		    
		    //create center divider
		    var dividerWidth = 10;
		    var centerDivider = Matter.Bodies.rectangle(this.canvas.width/2, this.canvas.height/2, dividerWidth, this.canvas.height, { isStatic: true});
		    centerDivider.renderChildren = [{
			    id: 'divider',
			    data: this.texture('BlueTransparency'),
			    scale: {x: dividerWidth, y: this.canvas.height},
			    rotate: 'none',
			}];
			
			this.addTimer({name: 'createSnowFlakeLeft', timeLimit: 1000, gogogo: true, callback: function() {
    		    var xPos = Math.random() * (((game.canvas.width)/2)-5-36) + 18;
    		    var yPos = -50;
    		    game.createSnowflake({x: xPos, y: yPos}, {velocity: {x: 0, y: Math.random() * 1.5 + .85}});
    		    this.timeLimit = Math.random() * 100 + 650 - (game.level * 20);
			}});
			
			this.addTimer({name: 'createSnowFlakeRight', timeLimit: 1000, gogogo: true, callback: function() {
    		    var xPos = Math.random() * (((game.canvas.width)/2)-5-36) + 18 + 5 + game.canvas.width/2;
    		    var yPos = -50;
    		    game.createSnowflake({x: xPos, y: yPos}, {velocity: {x: 0, y: Math.random() * 1.5 + .85}});
    		    this.timeLimit = Math.random() * 100 + 650 - (game.level * 20);
			}});
			
			this.addTimer({name: 'score', timeLimit: 1000, gogogo: true, callback: function() {
    		    game.incrementScore(1);
			}});
			
			this.addTickListener(function(event) {
				$.each(this.flakes, function(i, flake) {
					
					if(flake == null) return;
					if(this.bodyRanOffStage(flake)) {
						this.removeBody(flake);
						this.snowflakeCount++;
						this.flakes[i] = null;
					}

				}.bind(this));
				
				if(this.flakes.length >= 50) {
					this.flakes = this.flakes.filter(function(value) {
						return value != null;
					});
				}
			}.bind(this));
			
		    this.addBody(centerDivider);
		    
            this.nextLevel();
            
            //randomize marble colors
            var tintIndexLeft = this.getRandomIntInclusive(0, this.acceptableTints.length-1);
            var tintIndexRight = this.getRandomIntInclusive(0, this.acceptableTints.length-1); 
            while(tintIndexRight == tintIndexLeft) {
                tintIndexRight = this.getRandomIntInclusive(0, this.acceptableTints.length-1); 
            }
            
			//create marble on the left side
			this.createLeftMarble(tintIndexLeft);
			
			//create marble on the right side
			this.createRightMarble(tintIndexRight);
			
			//create snowflake
			//this.createSnowflake({x: this.canvas.width/4, y: 0});
		},
		
		createLeftMarble: function(tint) {
		    this.createMarble({x: this.canvas.width/4, y: this.canvas.height/2}, tint);
		},
		
		createRightMarble: function(tint) {
		    this.createMarble({x: this.canvas.width*3/4, y: this.canvas.height/2}, tint);
		},
		
		nextLevel: function() {
		    //increment level
		    this.snowflakeCount = 0;
		    if(this.level < 23) {
		        this.level += 1;
		    }
		    console.log("level: " + this.level)
		},
		
		createSnowflake: function(position, options) {
		    
		    if(this.snowflakeCount > 30) {
		        this.nextLevel();
		    }
		    sfNumber = this.getRandomIntInclusive(1, 4);
		    
		    var game = this;
			var radius = this.large;
		    var snowflake = Matter.Bodies.circle(0, 0, radius, { restitution: .95, frictionAir: 0, isSensor: true});
            snowflake.collisionFilter.group = -1; //don't collide with each other
		    snowflake.renderChildren = [{
			    id: 'marble',
			    data: this.texture('Snowflake' + sfNumber),
			    scale: {x: radius*2/114, y: radius*2/114},
			    rotate: 'continuous',
			}];
			
			Matter.Body.setVelocity(snowflake, options.velocity);
			Matter.Body.setPosition(snowflake, position)
			this.addBody(snowflake, true);
			
			Matter.Events.on(snowflake, 'onCollide', function(pair) {
        		        var otherBody = pair.pair.bodyA == snowflake ? pair.pair.bodyB : pair.pair.bodyA;
        		        if(otherBody.isMarble) {
        		            
        		            var emitter = this.createParticleEmitter(this.renderer.stages.stage, 
            		            {
                            	"alpha": {
                            		"start": 1,
                            		"end": 1
                            	},
                            	"scale": {
                            		"start": 0.25,
                            		"end": 0.01,
                            		"minimumScaleMultiplier": 1
                            	},
                            	"color": {
                            		"start": "#ffffff",
                            		"end": "#ffffff"
                            	},
                            	"speed": {
                            		"start": 400,
                            		"end": 0,
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
                            	"noRotation": true,
                            	"rotationSpeed": {
                            		"min": 2,
                            		"max": 0
                            	},
                            	"lifetime": {
                            		"min": 0.25,
                            		"max": 0.5
                            	},
                            	"blendMode": "normal",
                            	"frequency": 1,
                            	"emitterLifetime": 1.1,
                            	"maxParticles": 500,
                            	"pos": {
                            		"x": 200,
                            		"y": 200
                            	},
                            	"addAtBack": false,
                            	"spawnType": "burst",
                            	"particlesPerWave": 20,
                            	"particleSpacing": 18,
                            	"angleStart": 0
                                });
            
                            // Start emitting
        		            emitter.updateSpawnPos(snowflake.position.x, snowflake.position.y);
                            emitter.playOnceAndDestroy();
        		            game.removeBody(snowflake);
        		            game.addLives(-1);
        		        }
		    }.bind(this));
		    this.flakes.push(snowflake);
		},
		
		createMarble: function(position, tint) {
			var radius = this.smallish;
			const marble = Matter.Bodies.circle(0, 0, radius, { restitution: .95, frictionAir: 1});
			$.extend(marble, Moveable);
			marble.isSelectable = true;
			marble.isMoveable = true;
			marble.moveSpeed = 4.5;
			marble.stop();
			marble.isMarble = true;
			marble.originalTint = this.acceptableTints[tint];
			marble.tint = tint;
			marble.highlightTint = this.highlightTints[tint];
			marble.typeId = 33;
			
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
			    stage: "StageNTwo",
			    offset: {x: 8, y: 8},
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
			    stage: "StageNTwo",
			    offset: {x: 12, y: 12}
			}, {
			    id: 'selected',
			    data: this.texture('MarbleSelected'),
			    scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
			    tint: this.selectionTint,
			    stage: 'StageNOne',
			    visible: false,
			    rotate: 'none'
			}, {
			    id: 'selectionPending',
			    data: this.texture('MarbleSelectedPending'),
			    scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
			    stage: 'StageNOne',
			    visible: false,
			    tint: this.pendingSelectionTint,
			    rotate: 'continuous'
			}];
			
			Matter.Body.setPosition(marble, position)
			this.addBody(marble, true);
		},
		
		resetGameExtension: function() {
		    this.level = 0;
		}
	}
	
	/*
	 * Options to for the game starter
	 */ 
	game.worldOptions = {
			background: {image: 'DarkCork', scale: {x: 1, y: 1}},
		        width: 1200, 
		        height: 600,     
		        gravity: 0,  
		       };
	
	//game.instructions = ['Dodge', 'Utilize shift-clicking and the selection box for economy of selection', 'Right-click to move a selection', 'Click the timers for a time boost'];
	
	return $.extend({}, CommonGameMixin, game);
})














