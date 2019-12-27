define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin'], function($, Matter, PIXI, CommonGameMixin) {
	
	var targetScore = 1;
	var winGame = 20;
	var tintToColor = '#070054';
	
	var game = {
		victoryCondition: {type: 'timed', limit: 45},
		gameName: 'SimpleZarya',
		ball: null,
		
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
				if(this.ball && this.ball.timer && this.ball.timer.started && !Matter.Bounds.contains(this.ball.bounds, this.mousePosition)) {
					this.ball.timer.paused = true;
				}
			    if(this.leftDown && this.ball.verticeCopy && Matter.Vertices.contains(this.ball.verticeCopy, this.mousePosition)) {
					if(!this.ball.timer) {
						this.ball.timer = {name: 'zarya', timeLimit: 950, callback: function() {
							this.ball.timer = null;
							this.incrementScore(targetScore);
								
							var plusOne = utils.addSomethingToRenderer('PlusOne', 'foreground');
    						plusOne.position = this.ball.position;
    						plusOne.position.y -= 50;
    						this.addTime(1000);
    						this.floatSprite(plusOne);
							
							//play death animation
							this.getAnimation('blueCollapse', [this.ball.position.x, this.ball.position.y, (this.ball.circleRadius*2/512), (this.ball.circleRadius*2/512)], .6).play();
							
							this.hit.play();
							
							this.removeBody(this.ball);
							this.addBody(this.ball = this.createBodyAtRandomLocation(), true);
						}.bind(this)};
						this.addTimer(this.ball.timer);
					} else {
						this.ball.timer.paused = false;
						this.ball.renderling.tint = this.shadeBlendConvert(Math.max(this.ball.timer.percentDone), '#ffffff', tintToColor);
					}
			    }
			}.bind(this));
			
		},
		
		createBodyAtRandomLocation: function() {
			var radius = Math.random() * 15 + 40; //radius between 40-55
			var xLoc = Math.random() * (this.canvasEl.getBoundingClientRect().width-radius*2) + radius;
			var yLoc = Math.random() * (this.canvasEl.getBoundingClientRect().height-radius*2) + radius;
			this.ball = Matter.Bodies.circle(xLoc, yLoc, radius, { restitution: .95, friction: .3});
			this.ball.render.sprite.texture = this.texture('blueTarget2');
			this.ball.render.sprite.xScale = this.ball.render.sprite.yScale = radius*2/128;

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
	
	/*
	 * Options to for the game starter
	 */ 
	game.worldOptions = {
			background: {image: 'SteelBackground', scale: {x: 1.334, y: 1.334}},
		        width: 1200, 
		        height: 600, 
		        gravity: .5,
		       };

    game.instructions = ['Click and hold over the moving target to destroy it'];
	
	return $.extend({}, CommonGameMixin, game);
})














