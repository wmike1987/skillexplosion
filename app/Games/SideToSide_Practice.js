define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'utils/TargetSpawnZone'], function($, Matter, PIXI, CommonGameMixin, zone) {
	
	var targetScore = 1;
	
	var game = {
		gameName: 'LeftRight',
		ball: null,
		victoryCondition: {type: 'timed', limit: 35},
		
		initExtension: function() {
		    this.hit = this.getSound('nicehit1.wav', {volume: .2, rate: 2});  
		    this.hit2 = this.getSound('nicehit1.wav', {volume: .2, rate: 2.3});  
		    this.hit3 = this.getSound('nicehit1.wav', {volume: .2, rate: 2.6});  
		    this.hit4 = this.getSound('nicehit1.wav', {volume: .2, rate: 3});  
		    this.hits = [this.hit, this.hit2, this.hit3, this.hit4];
		},
		
		play: function(options) {
		
			this.ghostTarget = null;
			this.chain = 0;
			
			//create zones
			this.leftZone = new zone(this.canvas.width/4, 0, this.canvas.width/4, this.canvas.height, 40, 200);
			this.rightZone = new zone(this.canvas.width/2, 0, this.canvas.width/4, this.canvas.height, 40, 200);
			var self = this;
			this.zoneManager= {zone: this.leftZone, flip: function() {
				this.zone = this.zone == self.leftZone ? self.rightZone : self.leftZone;
			}};
			
			//init a ball
			this.ball = this.createNextBody();
			this.addBody(this.ball);	
			
			//create ghost target indicator		
			this.addEventListener('mousedown', function(event) { 
				this.ghostTarget = this.ghostTarget || this.addSomethingToRenderer('blueTarget2Ghost', 'stageZero');
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
						this.getAnimation('blueCollapse', [this.ball.position.x, this.ball.position.y, (this.ball.circleRadius*2/512), (this.ball.circleRadius*2/512)], .6).play();
						
						this.chain += 1;
						this.hits[this.chain-1].play();
						
						//add time if we've chained three in a row
						if(this.chain == 4) {
						    this.chain = 0;
						    this.addToGameTimer(1000);
    						var plusOne = this.addSomethingToRenderer('PlusOne', 'foreground');
    						plusOne.position = this.ball.position;
    						plusOne.position.y -= 50;
    						this.floatSprite(plusOne);
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
			this.ball.render.sprite.texture = this.texture('blueTarget2');
			this.ball.render.sprite.xScale = this.ball.render.sprite.yScale = radius*2/128;
			
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
		        gravity: 0.000,
		       };
	
	return $.extend({}, CommonGameMixin, game);
})














