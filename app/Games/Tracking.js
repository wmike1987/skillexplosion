import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import utils from '@utils/GameUtils.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
import {globals, mouseStates} from '@core/Fundamental/GlobalState.js'

var targetScore = 1;
var winGame = 20;
var tintToColor = '#070054';

var game = {

	worldOptions: {
		background: {image: 'SteelBackground', scale: {x: 1.334, y: 1.334}},
	    width: 1200,
	    height: 600,
	    gravity: .5,
	},

	assets: [
		{name: "BlueTargetDeath", target: "Textures/BlueTargetDeath.json"},
		{name: "blueCollapse", target: "Textures/blueCollapse.json"},
		{name: "backgroundSheet", target: "Textures/BackgroundSheet.json"},
		{name: "rainyBackgroundAndMarbles", target: "Textures/legacy/RainyBackgroundAndMarbles.json"}
	],

	victoryCondition: {type: 'timed', limit: 5},
	gameName: 'Tracking',
	ball: null,
	outputLag: 3,

	initExtension: function() {
	    this.hit = utils.getSound('nicehit1.wav', {volume: .2, rate: 2});
	},

	play: function(options) {

		//this.hideScore = true;

		//init a ball
		this.ball = this.createBodyAtRandomLocation();
		this.addBody(this.ball, true);

		this.addEventListener('mouseup', function(event) {
			if(this.ball && this.ball.timer)
				this.ball.timer.paused = true;
		}.bind(this));

		this.addTickCallback(function() {
			if(this.ball && this.ball.timer && this.ball.timer.started) {
				this.ball.timer.paused = true;
			}

			if(!this.ball.positionsCopy || (this.ball.positionsCopy && this.ball.positionsCopy.length < this.outputLag)) return;

			var plen = this.ball.positionsCopy.length;
			var vlen = this.ball.verticesCopy.length;

		    if(mouseStates.leftDown && Matter.Vertices.contains(this.ball.verticesCopy[vlen-this.outputLag], this.mousePosition)) {
				if(!this.ball.timer) {
					this.ball.timer = {name: 'zarya', timeLimit: 950, callback: function() {
						this.ball.timer = null;
						this.incrementScore(targetScore);
						var framePosition = this.ball.positionsCopy[plen-this.outputLag];

						var plusOne = utils.addSomethingToRenderer('PlusOne', 'foreground');
						plusOne.position = framePosition;
						plusOne.position.y -= 50;
						this.addTime(1000);
						utils.floatSprite(plusOne);

						//play death animation
						var deathanimation = utils.getAnimationB({
							numberOfFrames: 8,
							baseName: 'blueCollapse',
							speed: 1,
							transform: [framePosition.x, framePosition.y, this.ball.circleRadius*2/512, this.ball.circleRadius*2/512]
						});
						utils.addSomethingToRenderer(deathanimation, 'stageOne');
						deathanimation.play();

						this.hit.play();

						this.removeBody(this.ball);
						this.addBody(this.ball = this.createBodyAtRandomLocation(), true);
					}.bind(this)};
					this.addTimer(this.ball.timer);
				} else {
					this.ball.timer.paused = false;
					this.ball.renderlings.mainData.tint = utils.shadeBlendConvert(Math.max(this.ball.timer.percentDone), '#ffffff', tintToColor);
				}
		    }
		}.bind(this));

	},

	createBodyAtRandomLocation: function() {
		var radius = Math.random() * 15 + 40; //radius between 40-55
		var xLoc = Math.random() * (this.canvasEl.getBoundingClientRect().width-radius*2) + radius;
		var yLoc = Math.random() * (this.canvasEl.getBoundingClientRect().height-radius*2) + radius;
		this.ball = Matter.Bodies.circle(xLoc, yLoc, radius, { restitution: .95, friction: .3});
		var rchildren = [];
		rchildren.push({
			id: 'mainData',
			data: 'blueTarget2',
			scale: {x: radius*2/128, y: radius*2/128}
		})
		this.ball.renderChildren = rchildren;
		this.ball.radius = radius;

		var velocityRange = 6;
		var xVelocity = 2.2 + Math.random() * velocityRange*5 ;
		xVelocity *= Math.random() > .5 ? 1 : -1; //randomly make negative
		var yVelocity = Math.random() * velocityRange*2 ;
		xVelocity = xVelocity;
		yVelocity = yVelocity;
		Matter.Body.setAngularVelocity(this.ball, .01 * xVelocity);
		Matter.Body.setVelocity(this.ball, {x: xVelocity , y: yVelocity-(velocityRange)});
		return this.ball;
	},
}

game.instructions = ['Click and hold over the moving target to destroy it'];

export default $.extend({}, CommonGameMixin, game);
