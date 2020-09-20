import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import utils from '@utils/GameUtils.js'
import {CommonGameMixin} from '@core/CommonGameMixin.js'
import Marble from '@games/Marbles/Units/Marble.js'

var targetScore = 1;

var game = {

	worldOptions: {
		background: {image: 'Grass', scale: {x: 1, y: 1}},
		width: 1200,
		height: 600,
		gravity: 0,
	},

	assets: [
				{name: "backgroundSheet", target: "Textures/BackgroundSheet.json"},
				{name: "rainyBackgroundAndMarbles", target: "Textures/legacy/RainyBackgroundAndMarbles.json"},
				{name: "DeathAnimations", target: "Textures/legacy/DeathAnimations.json"}
			],

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
	enableUnitSystem: true,
	hidePrevailingIndicator: true,
	noClickIndicator: true,
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

		var curG = this;
	    if(this.banes)
			this.banes.forEach((bane, i) => {
				curG.removeUnit(bane);
			})
	    if(this.marbles) {
	        this.incrementScore(this.marbles.length);
	        this.marbles.forEach((marb, i) => {
				curG.removeUnit(marb);
			})
	    }
	    this.marbles = [];
	    this.banes = [];

	    //increment level
	    this.level += 1;
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
	    this.createDrones(1);

	    //create banelings
	    this.createBanelings(1);

	    //send banelings to attack

	    //add tick callback to detect if no banelings exist
	        //if so, tally score and play next level
	},

	createDrones: function(number) {
	    for(var x = 0; x < number; x++) {
			var radius = this.large;
			var marble = Marble({adjustHitbox: false, tint: 0xc106d1, radius: this.smallish, team: this.playerTeam});
			marble.isSelectable = true;
			marble.isMoveable = true;
			marble.attackerDisabled = true;
			marble.isTargetable = true;
			this.marbles.push(marble);
			marble.moveSpeed = 2.5;

			utils.placeBodyWithinRadiusAroundCanvasCenter(marble, number*3);
			this.addUnit(marble, true);
	    }
	},

	createBanelings: function(number) {
	    var side = Math.random();
	    for(var x = 0; x < number; x++) {
			var radius = this.medium;
			var marble = Marble({adjustHitbox: false, tint: 0x00FF00, radius: this.smallish, team: 5});
			marble.isSelectable = true;
			marble.isTargetable = true;
			this.marbles.push(marble);
			marble.moveSpeed = 2.5;

			this.addUnit(marble);
		    marble.honableTargets = new Set();
			$.each(this.marbles, function(index, drone) {
			    marble.honableTargets.add(drone);
			})
			marble.honeRange = 1000;
			marble.range = 50;
            var blastRadius = radius*2.5;
            const blastSensor = Matter.Bodies.circle(0, 0, blastRadius, { isStatic: true, isSensor: true, noWire: true });
            blastSensor.collisionFilter.category = marble.sensorCollisionCategory;
            blastSensor.collisionFilter.mask = blastSensor.collisionFilter.mask - marble.sensorCollisionCategory - marble.team;
			utils.deathPact(marble, blastSensor);
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
		        if(otherBody.isTargetable && marble.team != otherBody.unit.team) {
	                marble.blastTargets.add(otherBody);
		        }
		    });

            Matter.Events.on(blastSensor, 'onCollideEnd', function(pair) {
		        var otherBody = pair.pair.bodyA == blastSensor ? pair.pair.bodyB : pair.pair.bodyA;
		        if(otherBody.isTargetable && marble.team != otherBody.unit.team) {
	                marble.blastTargets.delete(otherBody);
		        }
		    });

			marble.attack = function(unitTarget) {
				var position = utils.clonePosition(marble.position);
				var baneexplode = utils.getAnimationB({
					spritesheetName: 'DeathAnimations',
					animationName: 'bane',
					speed: .6,
					times: 1,
					scale: .5,
					transform: [position.x,position.y, (blastRadius*2/64), (blastRadius*2/64), Math.random()*40]
				});
				baneexplode.play();
				utils.addSomethingToRenderer(baneexplode, 'stageOne');
			    this.banes.splice(this.banes.indexOf(marble), 1);
			    var nextLevelGo = false;
			    if(this.banes.length == 0) {
			        nextLevelGo = true;
			    }
			    this.pop.play();
				marble._death();
			    this.removeUnit(marble);
			    marble.blastTargets.forEach(function(index, target) {
			        if(this.marbles.indexOf(target) >= 0) {
			            var shard = utils.addSomethingToRenderer('glassShards', 'background', {position: target.position, scale: {x: .65, y: .65}, tint: target.tint, rotation: Math.random()*6});
            		    this.addTimer({name: 'shardDisappear' + target.id, persists: true, timeLimit: 48, runs: 20, killsSelf: true, callback: function() {
                            shard.alpha -= .05;
        					    }, totallyDoneCallback: function() {
        					        utils.removeSomethingFromRenderer(shard);
        			    }.bind(this)})
			            this.marbles.splice(this.marbles.indexOf(target), 1);
						this.removeUnit(unitTarget);
			        }

			        if(this.marbles.length == 0) {
			            this.addLives(-1);
			            nextLevelGo = true;
			        }

			    }.bind(this));

			    if(nextLevelGo) {
			        setTimeout(this.nextLevel.bind(this), 250);
			    }
			}.bind(this);

            if(side > .5) {
                marble.position = {x: Math.random() * 100, y: utils.getCanvasCenter().y + Math.random() * 600 - 300};
            } else {
                marble.position = {x: utils.getCanvasWidth() - Math.random() * 100, y: utils.getCanvasCenter().y + Math.random() * 600 - 300};
            }
	    }
	},

	resetGameExtension: function() {
	    this.level = 0;
	    this.banes = [];
	    this.marbles = [];
	}
}

game.instructions = ['Split the purple marbles to avoid area of effect damage', 'If all purple marbles die, you lose a life'];

export default $.extend({}, CommonGameMixin, game);
