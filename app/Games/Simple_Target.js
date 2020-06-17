define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin', 'howler', 'utils/GameUtils'], function($, Matter, PIXI, CommonGameMixin, h, utils) {

	var targetScore = 1;

	var game = {
		gameName: 'SimpleTargets',
		ball: null,
		victoryCondition: {type: 'timed', limit: 35},
		hideScore: false,
		noClickIndicator: false,

		initExtension: function() {
		    this.hit = utils.getSound('bellhit3.wav', {volume: .2, rate: 2});
		    this.bullseye = utils.getSound('powerup2.wav', {volume: .75, rate: 1.1});
		},

		play: function(options) {

			this.ghostTarget = null;
			this.ghostTargetCenter = null;

			//init a ball
			this.ball = this.createBodyAtRandomLocation();

			//init the center target
			this.ballCenter = this.createBallCenter(this.ball);

			this.addBody(this.ball, true);
			this.addBody(this.ballCenter, true);
			this.addTickListener(function() {
			    if(this.ball && this.ballTarget)
                    Matter.Body.setPosition(this.ballCenter, {x: this.ball.position.x, y: this.ball.position.y});
			}.bind(this), false, 'afterUpdate');

			//create ghost target indicator
			this.addEventListener('mousedown', function(event) {
				this.ghostTarget = this.ghostTarget || utils.addSomethingToRenderer('blueTarget2Ghost', 'stageNTwo');
				this.ghostTargetCenter = this.ghostTargetCenter || utils.addSomethingToRenderer('bluetarget2CenterGhost', 'stageNTwo');
				this.ghostTarget.position.x = this.ball.positionCopy.x;
				this.ghostTarget.position.y = this.ball.positionCopy.y;
				this.ghostTarget.scale.x = this.ghostTarget.scale.y = this.ball.circleRadius*2/128;
				this.ghostTargetCenter.position.x = this.ball.positionCopy.x;
				this.ghostTargetCenter.position.y = this.ball.positionCopy.y;
				this.ghostTargetCenter.scale.x = this.ghostTargetCenter.scale.y = this.ball.circleRadius*2/3/32;
			}.bind(this), false, true);

			this.addEventListener('mousedown', function(event) {
				var x = event.data.global.x;
				var y = event.data.global.y;

			    var hitSound = this.hit;
				if(Matter.Vertices.contains(this.ballTarget.verticeCopy, {x: x, y: y})) {
					this.addToGameTimer(1000);

					//play sound
					hitSound = this.bullseye;

					//play special animation
					utils.getAnimation('ssBlueDeath', [this.ball.positionCopy.x, this.ball.positionCopy.y, (this.ball.circleRadius*2/32), (this.ball.circleRadius*2/32)], 1, null, 1).play();
					utils.getAnimation('ssBlueDeath', [this.ball.positionCopy.x, this.ball.positionCopy.y, (this.ball.circleRadius*2/32), (this.ball.circleRadius*2/32)], .6, null, 1, 0.785398).play(); //with rotation
					var plusOne = utils.addSomethingToRenderer('PlusOne', 'foreground');
					plusOne.position = this.ballTarget.position;
					plusOne.position.y -= 50;
					utils.floatSprite(plusOne);
				}
				if(Matter.Vertices.contains(this.ball.verticeCopy, {x: x, y: y})) {
					this.incrementScore(targetScore);

					//play death animation
					utils.getAnimation('blueCollapse', [this.ball.positionCopy.x, this.ball.positionCopy.y, (this.ball.circleRadius*2/512), (this.ball.circleRadius*2/512)], .6).play();

					//play sound
            		hitSound.play();
					//hitSound.fade(.75, 0, 750, );

					this.removeBody(this.ball);
					this.removeBody(this.ballCenter);
					this.addBody(this.ball = this.createBodyAtRandomLocation(), true);
					this.addBody(this.ballCenter = this.createBallCenter(this.ball), true);
				}
			}.bind(this), false, true);
		},

		createBodyAtRandomLocation: function() {
			var radius = Math.random() * 25 + 25; //radius between 25-50
			var xLoc = Math.random() * (this.canvasEl.getBoundingClientRect().width-radius*2) + radius;
			var yLoc = Math.random() * (this.canvasEl.getBoundingClientRect().height-radius*2) + radius;
			this.ball = Matter.Bodies.circle(xLoc, yLoc, radius, { restitution: .95, friction: .3});
			this.ball.render.sprite.texture = 'blueTarget2';
			this.ball.render.sprite.xScale = this.ball.render.sprite.yScale = radius*2/128;
			this.ball.radius = radius;

			var velocityRange = 5;
			var xVelocity = Math.random() * velocityRange*10 ;
			var yVelocity = Math.random() * velocityRange ;
			xVelocity = xVelocity-(velocityRange*10 /2);
			yVelocity = yVelocity-(velocityRange /2);
			Matter.Body.setAngularVelocity(this.ball, .02 * xVelocity);
			Matter.Body.setVelocity(this.ball, {x: xVelocity , y: yVelocity-(velocityRange /2)});
			return this.ball;
		},

		createBallCenter: function(ball) {
			this.ballTarget = Matter.Bodies.circle(ball.position.x, ball.position.y, ball.radius/3, {isSensor: true, isStatic: true});
			this.ballTarget.render.sprite.texture = 'bluetarget2Center';
			this.ballTarget.render.sprite.xScale = this.ballTarget.render.sprite.yScale = ball.radius*2/3/32;
			return this.ballTarget;
		}
	}

	/*
	 * Options to for the game starter
	 */
	game.worldOptions = {
			background: {image: 'SteelBackground', scale: {x: 1.334, y: 1.334}},
		        width: 1200,
		        height: 600,
		       };

	return $.extend({}, CommonGameMixin, game);
})
