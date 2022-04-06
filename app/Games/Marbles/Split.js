import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
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
	level: 1,
	victoryCondition: {type: 'lives', limit: 5},
	enableUnitSystem: true,
	hidePrevailingIndicator: true,
	noClickIndicator: true,
	selectionTint: 0x33FF45,
	pendingSelectionTint: 0x70ff32,
	baneSpeed: 2.0,

	initExtension: function() {
	    //wave begin sound
	    this.nextWave = gameUtils.getSound('rush1.wav');

	    //blow up sound
	    this.pop = gameUtils.getSound('pop1.wav');
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
	    this.createDrones(numberOfDrones);

	    //create banelings
	    this.createBanelings(numberOfBanes);
	},

	createDrones: function(number) {
	    for(var x = 0; x < number; x++) {
			var radius = this.large;
			let marble = Marble({adjustHitbox: false, tint: 0xc106d1, radius: this.smallish, team: this.playerTeam, health: 10});
			marble.attackerDisabled = true;
			this.marbles.push(marble);
			marble.moveSpeed = 2.5;

			gameUtils.placeBodyWithinRadiusAroundCanvasCenter(marble, number*3);
			this.addUnit(marble, true);
	    }
	},

	createBanelings: function(number) {
	    var side = Math.random();
	    for(var x = 0; x < number; x++) {
			var radius = this.medium;
			let marble = Marble({adjustHitbox: false, tint: 0x00FF00, radius: this.smallish, team: 5, health: 10});
			this.banes.push(marble);
			marble.moveSpeed = 2.5;
			marble.honeRange = 1000;
			marble.range = 40;

			marble.attack = function(unitTarget) {
				var position = mathArrayUtils.clonePosition(marble.position);
				var baneexplode = gameUtils.getAnimation({
					spritesheetName: 'DeathAnimations',
					animationName: 'bane',
					speed: .6,
					times: 1,
					scale: .5,
					transform: [position.x, position.y, (blastRadius*2/64), (blastRadius*2/64), Math.random()*40]
				});
				baneexplode.play();
				graphicsUtils.addSomethingToRenderer(baneexplode, 'stageOne');
			    this.banes.splice(this.banes.indexOf(marble), 1);
			    var nextLevelGo = false;
			    if(this.banes.length == 0) {
			        nextLevelGo = true;
			    }
			    this.pop.play();

				var blastRadius = 70;
				var bodiesToDamage = [];
				unitUtils.applyToUnitsByTeam(function(team) {return marble.team != team}, function(unit) {
					return (mathArrayUtils.distanceBetweenBodies(marble.body, unit.body) <= blastRadius && unit.isTargetable);
				}.bind(this), function(unit) {
					var shard = graphicsUtils.addSomethingToRenderer('glassShards', 'background', {position: unit.position, scale: {x: .65, y: .65}, tint: unit.tint, rotation: Math.random()*6});
					this.addTimer({name: 'shardDisappear' + unit.unitId, persists: true, timeLimit: 48, runs: 20, killsSelf: true, callback: function() {
						shard.alpha -= .05;
					}, totallyDoneCallback: function() {
						graphicsUtils.removeSomethingFromRenderer(shard);
					}.bind(this)})
					this.marbles.splice(this.marbles.indexOf(unit), 1);
					unit.sufferAttack(1000, this);
				}.bind(this));
				marble.alreadyAttacked = true;
				if(!marble.alreadyDied)
					marble.sufferAttack(1000);

			    if(nextLevelGo) {
			        setTimeout(this.nextLevel.bind(this), 250);
			    }
			}.bind(this);

            if(side > .5) {
                marble.position = {x: Math.random() * 100, y: gameUtils.getCanvasCenter().y + Math.random() * 600 - 300};
            } else {
                marble.position = {x: gameUtils.getCanvasWidth() - Math.random() * 100, y: gameUtils.getCanvasCenter().y + Math.random() * 600 - 300};
            }

			this.addUnit(marble);
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
