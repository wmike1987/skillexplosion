define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin'], function($, Matter, PIXI, CommonGameMixin) {
	
	var game = {
		gameName: 'Raindrops',
		ball: null,
		victoryCondition: {type: 'lives', limit: 10},
		noBorder: true,
		
		initExtension: function() {
		    this.hits = [utils.getSound('nicehit1.wav', {volume: .2}), utils.getSound('nicehit2.wav', {volume: .2}), utils.getSound('nicehit3.wav', {volume: .2}), utils.getSound('nicehit4.wav', {volume: .2})]
		},
		
		play: function(options) {
		    this.levelWave = 0;
			this.lastSoundPlayed = 0;
			this.drops = []
			this.ghostTarget = null;
			var self = this;
			self.createRaindrop();
			
			this.addTimer({name: 'dropletTimer', gogogo: true, timeLimit: 1500, callback: function() {
					this.timeLimit = Math.max(this.timeLimit -= 50, 500);
					self.createRaindrop();
					if(self.levelWave > 1300 && self.levelWave % 3 == 0) {
					    self.createRaindrop();
					}else if(self.levelWave > 800 && self.levelWave % 4 == 0) {
					    self.createRaindrop();
					}else if(self.levelWave > 500 && self.levelWave % 5 == 0) {
					    self.createRaindrop();
					}else if(self.levelWave > 200 && self.levelWave % 10 == 0) {
					    self.createRaindrop();
					}
				}
			});	
			
			this.addEventListener('mousedown', function(event) { 
				var rect = this.canvasEl.getBoundingClientRect();
				var x = event.clientX - rect.left;
				var y = event.clientY - rect.top;
				$.each(this.drops, function(i, drop) {
					if(drop == null) return;
					if(Matter.Bounds.contains(drop.bounds, {x: x, y: y})) {
						if(Matter.Vertices.contains(drop.vertices, {x: x, y: y})) {								
							//play death animation
							this.getAnimation('raindropflash', [drop.position.x, drop.position.y], .6, null, 3, null, drop).play();
							this.removeBody(drop);
						    utils.removeSomethingFromRenderer(drop.displacementSprite);
							this.drops[i] = null;
							this.incrementScore(1);
							this.lastSoundPlayed = (this.lastSoundPlayed + this.getRandomIntInclusive(1, this.hits.length-1)) % this.hits.length;
							this.hits[this.lastSoundPlayed].play();
						}	
					}
				}.bind(this));
			}.bind(this));

			//align displacement sprites and kill drop if out of sight
			this.addTickListener(function(event) {
				$.each(this.drops, function(i, drop) {
					
					if(drop == null) return;
					if(this.bodyRanOffStage(drop)) {
						this.removeBody(drop);
						utils.removeSomethingFromRenderer(drop.displacementSprite);
						this.drops[i] = null;
						this.addLives(-1);
					}

				}.bind(this));
				
				if(this.drops.length >= 50) {
					this.drops = this.drops.filter(function(value) {
						return value != null;
					});
				}
			}.bind(this));
		},
		
		createRaindrop: function() {
			var radius = Math.random() * 10 + 30; //radius between 15-25
			var xLoc = Math.random() * (this.canvasEl.getBoundingClientRect().width-radius*2) + radius;
			var yLoc = -60;
			var drop = Matter.Bodies.fromVertices(xLoc, yLoc, Matter.Vertices.fromPath('-6, 64   ,  -11, 63   ,  -20, 59   ,  -30, 49   ,  -35, 38   ,  -36, 22   ,  -34, 16   ,  -30, 5   ,  -27, -3   ,  -1, -64   ,  4, -53   ,  17, -26   ,  20, -19   ,  24, -9   ,  31, 7   ,  36, 23   ,  36, 35   ,  30, 49   ,  21, 58   , 8, 64') , { restitution: .95, friction: .3});
			drop.render.sprite.texture = this.texture('alpha');
			
			var displacementSprite = PIXI.Sprite.fromImage("http://i.imgur.com/CbFRs98.png"); //trying something
			displacementSprite.x = -100;
			displacementSprite.y = -100;
        	utils.addSomethingToRenderer(displacementSprite);
        	
        	var displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);
			displacementFilter.scale.x = Math.random() * 10 + 20;
			displacementFilter.scale.y = Math.random() * 20 + 50;
			drop.render.filters = [displacementFilter];
			drop.displacementSprite = displacementSprite;
			
			drop.collisionFilter.group = -1;
			
			this.addBody(drop);
			this.drops.push(drop);
			this.levelWave++;
			return drop;
			
			Matter.Bodies.circle(xLoc, yLoc, radius, { restitution: .95, friction: .3});
		},
	}
	
	/*
	 * Options to for the game starter
	 */ 
	game.worldOptions = {
			background: {image: CommonGameMixin.texture('dullLandscape'), scale: {x: 1, y: 1}, bloat: true},
		        width: 1200, 
		        height: 600,     
		        gravity: .23,  
		       };
	
	return $.extend({}, CommonGameMixin, game);
})














