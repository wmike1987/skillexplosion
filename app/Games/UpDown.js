import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
import zone from '@utils/TargetSpawnZone'

var targetScore = 1;

var game = {

	worldOptions: {
		background: {image: 'SteelBackground', scale: {x: 1.334, y: 1.334}},
	    width: 1200,
	    height: 600,
	    gravity: 0.000,
	},

	assets: [
		{name: "BlueTargetDeath", target: "Textures/BlueTargetDeath.json"},
		{name: "blueCollapse", target: "Textures/blueCollapse.json"},
		{name: "backgroundSheet", target: "Textures/BackgroundSheet.json"},
		{name: "rainyBackgroundAndMarbles", target: "Textures/legacy/RainyBackgroundAndMarbles.json"}
	],

	gameName: 'UpDown',
	ball: null,
	victoryCondition: {type: 'timed', limit: 35},

	initExtension: function() {
	    this.hit = gameUtils.getSound('nicehit1.wav', {volume: .2, rate: 2});
	    this.hit2 = gameUtils.getSound('nicehit1.wav', {volume: .2, rate: 2.3});
	    this.hit3 = gameUtils.getSound('nicehit1.wav', {volume: .2, rate: 2.6});
	    this.hit4 = gameUtils.getSound('nicehit1.wav', {volume: .2, rate: 3});
	    this.hits = [this.hit, this.hit2, this.hit3, this.hit4];
	},

	play: function(options) {

		this.ghostTarget = null;
		this.chain = 0;

		//create zones
		this.topZone =    new zone(this.canvas.width*3/8, 0, this.canvas.width/4, this.canvas.height/2, 40, 100);
		this.bottomZone = new zone(this.canvas.width*3/8, this.canvas.height/2, this.canvas.width/4, this.canvas.height/2, 40, 100);
		var self = this;
		this.zoneManager= {zone: this.bottomZone, flip: function() {
			this.zone = this.zone == self.bottomZone ? self.topZone : self.bottomZone;
		}};

		//init a ball
		this.ball = this.createNextBody();
		this.addBody(this.ball);

		//create ghost target indicator
		this.addEventListener('mousedown', function(event) {
			this.ghostTarget = this.ghostTarget || graphicsUtils.addSomethingToRenderer('blueTarget2Ghost', 'stageNTwo');
			this.ghostTarget.position.x = this.ball.position.x;
			this.ghostTarget.position.y = this.ball.position.y;
			this.ghostTarget.scale.x = this.ghostTarget.scale.y = this.ball.circleRadius*2/128;
		}.bind(this));

		this.addEventListener('mousedown', function(event) {
			var rect = this.canvasEl.getBoundingClientRect();
			var x = event.clientX - rect.left;
			var y = event.clientY - rect.top;
			if(Matter.Bounds.contains(this.ball.bounds, {x: x, y: y})) {
				if(Matter.Vertices.contains(this.ball.vertices, {x: x, y: y})) {
					this.incrementScore(targetScore);

					//play death animation
					var collapseAnimation = gameUtils.getAnimation({
						numberOfFrames: 8,
						baseName: 'blueCollapse',
						speed: 1,
						transform: [this.ball.position.x, this.ball.position.y, this.ball.circleRadius*2/512, this.ball.circleRadius*2/512]
					});
					graphicsUtils.addSomethingToRenderer(collapseAnimation);
					collapseAnimation.play();
					this.chain += 1;
					this.hits[this.chain-1].play();

					//add time if we've chained three in a row
					if(this.chain == 4) {
					    this.chain = 0;
					    this.addToGameTimer(1000);
						var plusOne = graphicsUtils.addSomethingToRenderer('PlusOne', 'foreground');
						plusOne.position = this.ball.position;
						plusOne.position.y -= 50;
						graphicsUtils.floatSprite(plusOne);
					}

					this.removeBody(this.ball);
					this.addBody(this.ball = this.createNextBody());
				} else { //miss
			        this.chain = 0;
			    }
			} else { //miss
		        this.chain = 0;
			}
		}.bind(this));
	},

	createNextBody: function() {
		var radius = Math.random() * 15 + 40; //radius between 40-55
		var xLoc = this.zoneManager.zone.giveMeLocation().x;
		var yLoc = this.zoneManager.zone.lastLocation.y;
		this.zoneManager.flip();
		this.ball = Matter.Bodies.circle(xLoc, yLoc, radius);
		this.ball.renderChildren = [{
            id: 'ball',
            data: 'blueTarget2',
            scale: {x:radius*2/128, y:radius*2/128},
        }]
		//this.ball.render.sprite.texture = this.texture('blueTarget2');
		//this.ball.render.sprite.xScale = this.ball.render.sprite.yScale = radius*2/128;

		return this.ball;
	},
}

export default $.extend({}, CommonGameMixin, game);
