define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin'], function($, Matter, PIXI, CommonGameMixin) {
	
	var targetScore = 1;
	
	var game = {
		gameName: 'ShootPhara',
		ball: null,
		victoryCondition: {type: 'timed', limit: 35},
		
		play: function(options) {
		
			this.ghostTarget = null;
			
			//init a ball
			this.ball = this.createPhara();
			this.addBody(this.ball);
			
			//create ghost target indicator		
			this.addEventListener('mousedown', function(event) { 
				this.ghostTarget = this.ghostTarget || utils.addSomethingToRenderer('blueTargetGhost', 'StageNTwo');
				this.ghostTarget.position.x = this.ball.position.x;
				this.ghostTarget.position.y = this.ball.position.y;
				this.ghostTarget.scale.x = this.ghostTarget.scale.y = this.ball.circleRadius*2/512;
			}.bind(this));			
			
			this.addEventListener('mousedown', function(event) { 
				var rect = this.canvasEl.getBoundingClientRect();
				var x = event.clientX - rect.left;
				var y = event.clientY - rect.top;
				if(Matter.Bounds.contains(this.ball.bounds, {x: x, y: y})) {
					if(Matter.Vertices.contains(this.ball.vertices, {x: x, y: y})) {
						this.ball.lives--;
						if(this.ball.lives == 0) {
							this.incrementScore(targetScore);
							
							//play death animation
							this.getAnimation('blueCollapse', [this.ball.position.x, this.ball.position.y, (this.ball.circleRadius*2/512), (this.ball.circleRadius*2/512)], .6).play();
							
							this.removeBody(this.ball);
							this.addBody(this.ball = this.createPhara());
							return;
						}
						
						this.ball.renderling.texture = this.texture('blue' + (4 - this.ball.lives) + '4dead');
					}
				}
			}.bind(this));
		},
		
		createPhara: function() {
			var radius = Math.random() * 10 + 15; //radius between 15-25
			var xLoc = Math.random() * (this.canvasEl.getBoundingClientRect().width-radius*2) + radius;
			var yLoc = Math.random() * (this.canvasEl.getBoundingClientRect().height/2-radius*2) + radius + this.canvasEl.getBoundingClientRect().height/2;
			this.ball = Matter.Bodies.circle(xLoc, yLoc, radius, { restitution: .95, friction: .3});
			this.ball.render.sprite.texture = this.texture('blueTarget');
			this.ball.render.sprite.xScale = this.ball.render.sprite.yScale = radius*2/512;
			this.ball.zeroOutAngularVelocity = function() {
				Matter.Body.setAngularVelocity(this, 0);
			};
			this.ball.lives = 4;

			this.ball.timer = {name: 'float', gogogo:true, timeLimit: 1050, callback: function() {
				Matter.Body.applyForce(this.ball, {x: this.ball.position.x, y: this.ball.position.y - 100}, {x: 0, y: -.015*this.ball.mass});
			}.bind(this)};
			this.addTimer(this.ball.timer);
			var velocityRange = 5;
			var xVelocity = Math.random() * velocityRange*1 ;
			var yVelocity = Math.random() * velocityRange*-1.4*this.ball.mass - .8;
			xVelocity = xVelocity-(velocityRange*1 /2);
			yVelocity = yVelocity;
			Matter.Body.setVelocity(this.ball, {x: xVelocity , y: yVelocity});
			return this.ball;
		},
	}
	
	/*
	 * Options to for the game starter
	 */ 
	game.worldOptions = {
			background: {image: CommonGameMixin.texture('steelBackground'), scale: {x: 1.334, y: 1.334}},
		        width: 1200, 
		        height: 600,     
		        gravity: .3,  
		       };
	
	return $.extend({}, CommonGameMixin, game);
})














