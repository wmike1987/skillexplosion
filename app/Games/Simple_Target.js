define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin', 'howler', 'utils/GameUtils'], function($, Matter, PIXI, CommonGameMixin, h, utils) {

	var targetScore = 1;

	var game = {
		gameName: 'SimpleTargets',
		ball: null,
		victoryCondition: {type: 'timed', limit: 35},
		hideScore: false,
		noClickIndicator: false,
		outputLag: 3,

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

			//create ghost target indicator
			this.addEventListener('mousedown', function(event) {
				this.ghostTarget = this.ghostTarget || utils.addSomethingToRenderer('blueTarget2Ghost', 'stageNTwo');
				this.ghostTargetCenter = this.ghostTargetCenter || utils.addSomethingToRenderer('bluetarget2CenterGhost', 'stageNTwo');
				var vlen = this.ball.verticiesCopy.length;
				var plen = this.ball.positionsCopy.length;
				var framePosition = this.ball.positionsCopy[plen-this.outputLag];
				this.ghostTarget.position.x = framePosition.x;
				this.ghostTarget.position.y = framePosition.y;
				this.ghostTarget.scale.x = this.ghostTarget.scale.y = this.ball.circleRadius*2/128;
				this.ghostTargetCenter.position.x = framePosition.x;
				this.ghostTargetCenter.position.y = framePosition.y;
				this.ghostTargetCenter.scale.x = this.ghostTargetCenter.scale.y = this.ball.circleRadius*2/3/32;
			}.bind(this), false, true);

			this.addEventListener('mousedown', function(event) {
				var x = event.data.global.x;
				var y = event.data.global.y;

			    var hitSound = this.hit;
				var vlen = this.ball.verticiesCopy.length;
				var plen = this.ball.positionsCopy.length;

				var framePosition = this.ball.positionsCopy[plen-this.outputLag];
				if(Matter.Vertices.contains(this.ballCenter.verticiesCopy[vlen-this.outputLag], {x: x, y: y})) {
					this.addToGameTimer(1000);

					//play sound
					hitSound = this.bullseye;

					//play animation
					var deathanimation = utils.getAnimationB({
						numberOfFrames: 8,
						baseName: 'ssBlueDeath',
						speed: 1,
						transform: [framePosition.x, framePosition.y, 2, 2]
					});
					utils.addSomethingToRenderer(deathanimation, 'stageOne');
					deathanimation.play();
					var plusOne = utils.addSomethingToRenderer('PlusOne', 'foreground');
					plusOne.position = framePosition;
					plusOne.position.y -= 50;
					utils.floatSprite(plusOne);
				}
				if(Matter.Vertices.contains(this.ball.verticiesCopy[vlen-this.outputLag], {x: x, y: y})) {
					this.incrementScore(targetScore);

					//play animation
					var deathanimation = utils.getAnimationB({
						numberOfFrames: 8,
						baseName: 'blueCollapse',
						speed: 1,
						transform: [framePosition.x, framePosition.y, this.ball.circleRadius*2/512, this.ball.circleRadius*2/512]
					});
					utils.addSomethingToRenderer(deathanimation, 'stageOne');
					deathanimation.play();

					//play sound
            		hitSound.play();
					//hitSound.fade(.75, 0, 750, );

					this.removeBody(this.ball);
					this.removeBody(this.ballCenter);
					utils.removeSomethingFromRenderer(this.ballTargetSprite)
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
			var rchildren = [];
			rchildren.push({
				id: 'mainData',
				data: 'blueTarget2',
				scale: {x: radius*2/128, y: radius*2/128}
			})
			this.ball.renderChildren = rchildren;
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
			var ballCenter = Matter.Bodies.circle(ball.position.x, ball.position.y, ball.radius/3, {isSensor: true, isStatic: true});
			ballCenter.noWire = true;
			this.ballTargetSprite = utils.addSomethingToRenderer('bluetarget2Center', {where: 'stageOne', scale: {x: ball.radius*2/3/32, y: ball.radius*2/3/32}});
			utils.attachSomethingToBody(this.ballTargetSprite, this.ball);
			utils.attachSomethingToBody(ballCenter, this.ball);
			return ballCenter;
		}
	}

	/*
	 * Options to for the game starter
	 */
	game.worldOptions = {
			background: {image: 'SteelBackground', scale: {x: 1.334, y: 1.334}},
		        width: 1200,
		        height: 600,
				interpolate: true,
		       };

	return $.extend({}, CommonGameMixin, game);
})
