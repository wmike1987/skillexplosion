import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import utils from '@utils/GameUtils.js'
import {CommonGameMixin} from '@core/CommonGameMixin.js'

var targetScore = 1;

var game = {
	gameName: 'Split',
	extraLarge: 20,
	large: 18,
	medium: 16,
	small: 8,
	zoneSize: 128,
	level: 1,
	victoryCondition: {type: 'lives', limit: 305},
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
	    this.nextWave = utils.getSound('rush1.wav');

	    //blow up sound
	    this.pop = utils.getSound('pop1.wav');
	},

	play: function(options) {
        this.nextLevel();
	},

	nextLevel: function() {
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
	    this.level += 30;
	    //start increasing speed if we've got lots of units on the map
	    var levelCap = 30;
	    if(this.level < levelCap) {
		    this.baneSpeed = Math.min(2.5, this.baneSpeed+.05);
		    var numberOfDrones = 3 + this.level * 2; //add two drones per level
		    var numberOfBanes = Math.floor(numberOfDrones*.75); // three fourths-ish
	    } else {
	        this.baneSpeed = Math.min(3.2, this.baneSpeed+.03);
		    var numberOfDrones = 3 + levelCap * 2; //add two drones per level
		    var numberOfBanes = Math.floor(numberOfDrones*.75); // three fourths-ish
	    }

	    //create drones
	    this.createDrones(numberOfDrones);

	    //create banelings
	    this.createBanelings(numberOfBanes);

	    //send banelings to attack

	    //add tick callback to detect if no banelings exist
	        //if so, tally score and play next level
	},

	createDrones: function(number) {
	    for(x = 0; x < number; x++) {
			var radius = this.large;
			const marble = Matter.Bodies.circle(0, 0, radius, { restitution: .95, frictionAir: 1});
			this.marbles.push(marble);
			$.extend(marble, Moveable);
			marble.isSelectable = true;
			marble.isMoveable = true;
			marble.isTargetable = true;
			marble.moveSpeed = 2.5;
			marble.stop();
			var tintIndex = this.getRandomIntInclusive(0, this.acceptableTints.length-1);
			marble.originalTint = 0xED25FD;
			marble.tint = marble.originalTint;
			marble.highlightTint = this.highlightTints[tintIndex];
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
			    stage: "stageNTwo",
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
			    stage: "stageNTwo",
			    offset: {x: 12, y: 12}
			}, {
			    id: 'selected',
			    data: this.texture('MarbleSelected'),
			    scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
			    tint: this.selectionTint,
			    stage: 'stageNOne',
			    visible: false,
			    rotate: 'none'
			}, {
			    id: 'selectionPending',
			    data: this.texture('MarbleSelectedPending'),
			    scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
			    stage: 'stageNOne',
			    visible: false,
			    tint: this.pendingSelectionTint,
			    rotate: 'continuous'
			}];

			utils.placeBodyWithinRadiusAroundCanvasCenter(marble, number*3);
			this.addBody(marble, true);
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
			marble.honeRange = 500;
			marble.range = radius+1;
			marble.team = 2;
			marble.isSelectable = false;
			marble.isMoveable = true;
			marble.moveSpeed = this.baneSpeed;
			marble.stop();
			var tintIndex = this.getRandomIntInclusive(0, this.acceptableTints.length-1);
			marble.originalTint = 0x00FF00;
			marble.tint = marble.originalTint;
			marble.highlightTint = this.highlightTints[tintIndex];
			marble.typeId = 33;
		    marble.honableTargets = new Set();
			$.each(this.marbles, function(index, drone) {
			    marble.honableTargets.add(drone);
			})

			marble._initAttacker();

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
		        if(otherBody.isTargetable && marble.team != otherBody.team) {
	                marble.blastTargets.add(otherBody);
		        }
		    });

            Matter.Events.on(blastSensor, 'onCollideEnd', function(pair) {
		        var otherBody = pair.pair.bodyA == blastSensor ? pair.pair.bodyB : pair.pair.bodyA;
		        if(otherBody.isTargetable && marble.team != otherBody.team) {
	                marble.blastTargets.delete(otherBody);
		        }
		    });

			marble.attack = function(target) {
			    this.getAnimation('bane', [marble.positionCopy.x, marble.positionCopy.y, (blastRadius*2/64), (blastRadius*2/64), Math.random()*40], .5, null, 1).play();
			    this.banes.splice(this.banes.indexOf(marble), 1);
			    var nextLevelGo = false;
			    if(this.banes.length == 0) {
			        nextLevelGo = true;
			    }
			    this.pop.play();
			    this.removeBody(marble);
			    marble.blastTargets.forEach(function(index, target) {
			        if(this.marbles.indexOf(target) >= 0) {
			            var shard = utils.addSomethingToRenderer('glassShards', 'background', {position: target.position, scale: {x: .65, y: .65}, tint: target.tint, rotation: Math.random()*6});
            		    this.addTimer({name: 'shardDisappear' + target.id, persists: true, timeLimit: 48, runs: 20, killsSelf: true, callback: function() {
                            shard.alpha -= .05;
        					    }, totallyDoneCallback: function() {
        					        utils.removeSomethingFromRenderer(shard);
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
			    stage: "stageNTwo",
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
			    stage: "stageNTwo",
			    offset: {x: 12, y: 12}
			}, {
			    id: 'selected',
			    data: this.texture('MarbleSelected'),
			    scale: {x: (radius+5)*2/64, y: (radius+5)*2/64},
			    tint: this.selectionTint,
			    stage: 'stageNOne',
			    visible: false,
			    rotate: 'none'
			}, {
			    id: 'selectionPending',
			    data: this.texture('MarbleSelectedPending'),
			    scale: {x: (radius+8)*2/64, y: (radius+8)*2/64},
			    stage: 'stageNOne',
			    visible: false,
			    tint: this.pendingSelectionTint,
			    rotate: 'continuous'
			}];
            if(side > .5) {
                Matter.Body.setPosition(marble, {x: Math.random() * 100, y: this.getCanvasCenter().y + Math.random() * 600 - 300});
            } else {
                Matter.Body.setPosition(marble, {x: this.getCanvasWidth() - Math.random() * 100, y: this.getCanvasCenter().y + Math.random() * 600 - 300});
            }
			this.addBody(marble, true);
	    }

	},

	resetGameExtension: function() {
	    this.level = 0;
	    this.banes = [];
	    this.marbles = [];
	}
}

/*
 * Options to for the game starter
 */
game.worldOptions = {
		background: {image: 'Grass', scale: {x: 1, y: 1}},
	        width: 1200,
	        height: 600,
	        gravity: 0,
	       };

game.instructions = ['Split the purple marbles to avoid area of effect damage', 'If all purple marbles die, you lose a life'];

export default $.extend({}, CommonGameMixin, game);
