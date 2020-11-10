import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Moveable from '@core/Unit/_Moveable.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
import Marble from '@games/Marbles/Units/Marble.js'

var targetScore = 1;

var game = {

	worldOptions: {
		background: {image: 'DarkCork', scale: {x: 1, y: 1}},
		width: 1200,
		height: 600,
		gravity: 0,
	},

	assets: [
		{name: 'snowflakeSheet', target: 'Textures/SnowflakeSheet.json'},
		{name: "rainyBackgroundAndMarbles", target: "Textures/legacy/RainyBackgroundAndMarbles.json"},
	],

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
	enableUnitSystem: true,
	hidePrevailingIndicator: true,
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
		    data: 'BlueTransparency',
		    scale: {x: dividerWidth, y: this.canvas.height},
		    rotate: 'none',
		}];

		this.addTimer({name: 'createSnowFlakeLeft', timeLimit: 1000, gogogo: true, callback: function() {
		    var xPos = Math.random() * (((game.canvas.width)/2)-5-36) + 18;
		    var yPos = -10;
		    game.createSnowflake({x: xPos, y: yPos}, {velocity: {x: 0, y: Math.random() * 1.5 + .85}});
		    this.timeLimit = Math.random() * 100 + 650 - (game.level * 20);
		}});

		this.addTimer({name: 'createSnowFlakeRight', timeLimit: 1000, gogogo: true, callback: function() {
		    var xPos = Math.random() * (((game.canvas.width)/2)-5-36) + 18 + 5 + game.canvas.width/2;
		    var yPos = -10;
		    game.createSnowflake({x: xPos, y: yPos}, {velocity: {x: 0, y: Math.random() * 1.5 + .85}});
		    this.timeLimit = Math.random() * 100 + 650 - (game.level * 20);
		}});

		this.addTimer({name: 'score', timeLimit: 1000, gogogo: true, callback: function() {
		    game.incrementScore(1);
		}});

		this.addTickListener(function(event) {
			$.each(this.flakes, function(i, flake) {

				if(flake == null) return;
				if(gameUtils.bodyRanOffStage(flake)) {
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
        var tintIndexLeft = mathArrayUtils.getRandomElementOfArray(this.acceptableTints);
        var tintIndexRight = mathArrayUtils.getRandomElementOfArray(this.acceptableTints);
        while(tintIndexRight == tintIndexLeft) {
            tintIndexRight = mathArrayUtils.getRandomElementOfArray(this.acceptableTints);
        }

		//create marble on the left side
		this.createLeftMarble(tintIndexLeft);

		//create marble on the right side
		this.createRightMarble(tintIndexRight);

		//create snowflake
		//this.createSnowflake({x: this.canvas.width/4, y: 0});
	},

	createLeftMarble: function(tint) {
	    this.createMarble({x: gameUtils.getCanvasWidth()/4, y: gameUtils.getCanvasHeight()/2}, tint);
	},

	createRightMarble: function(tint) {
	    this.createMarble({x: gameUtils.getCanvasWidth()*3/4, y: gameUtils.getCanvasHeight()/2}, tint);
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
	    var sfNumber = mathArrayUtils.getRandomIntInclusive(1, 4);

	    var game = this;
		var radius = this.large;
	    var snowflake = Matter.Bodies.circle(0, 0, radius, { restitution: .95, frictionAir: 0, isSensor: true});
		snowflake.drawWire = false;
        snowflake.collisionFilter.group = -1; //don't collide with each other
	    snowflake.renderChildren = [{
		    id: 'marble',
		    data: 'Snowflake' + sfNumber,
		    scale: {x: radius*2/114, y: radius*2/114},
		    rotate: 'continuous',
		}];

		Matter.Body.setVelocity(snowflake, options.velocity);
		Matter.Body.setPosition(snowflake, position)
		this.addBody(snowflake, true);

		Matter.Events.on(snowflake, 'onCollide', function(pair) {
    		        var otherBody = pair.pair.bodyA == snowflake ? pair.pair.bodyB : pair.pair.bodyA;
    		        if(otherBody.unit) {

    		            var emitter = gameUtils.createParticleEmitter({where: this.renderer.stages.stage,
        		            config: {
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
						}});

                        // Start emitting
						emitter.spawnPos = {x: 100, y: 100};
    		            emitter.updateSpawnPos(snowflake.position.x, snowflake.position.y);
                        emitter.playOnceAndDestroy();
    		            game.removeBody(snowflake);
    		            game.addLives(-1);
    		        }
	    }.bind(this));
	    this.flakes.push(snowflake);
	},

	createMarble: function(position, tint) {
		var marble = Marble({adjustHitbox: false, tint: tint, radius: this.smallish, team: this.playerTeam, tint: tint, pendingSelectionTint: this.pendingSelectionTint});
		marble.position = position;
		marble.isSelectable = true;
		marble.isMoveable = true;
		marble.moveSpeed = 4.5;
		this.addUnit(marble);
	},

	resetGameExtension: function() {
	    this.level = 0;
	}
}

//game.instructions = ['Dodge', 'Utilize shift-clicking and the selection box for economy of selection', 'Right-click to move a selection', 'Click the timers for a time boost'];

export default $.extend({}, CommonGameMixin, game);
