define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'howler'], function($, Matter, PIXI, CommonGameMixin, h) {
	
	var targetScore = 1;
	var fragShader = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform vec2 mouse;
                uniform vec2 resolution;
                
                void main(){
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    if(mouse.x > 0.0 && gl_FragCoord.x > mouse.x-75.0 && gl_FragCoord.x < mouse.x+75.0 && gl_FragCoord.y < (resolution.y - (mouse.y-18.0))) {
                            gl_FragColor.r *= 0.0;
                            gl_FragColor.b *= 0.0;
                            gl_FragColor.g *= 0.0;
                            gl_FragColor.a = 0.0;
                    }
                }
            `;
    var filter = new PIXI.Filter(null, fragShader);
    
	var game = {
		gameName: 'RainySeason',
		victoryCondition: {type: 'timed', limit: 35},
		hideScore: false,
		noClickIndicator: true,
		raindrops: [],
		
		initExtension: function() {
		    var self = this;
		    
		    var rainWaveFrequency = 100;
		    var rainDensity = 30;
		    
		  	$(this.canvasEl).addClass('noCursor');  
		  	utils.addSomethingToRenderer("GreenGridRain", "background", {x: 600, y: 300, filter: filter});
  			this.addTimer({name: 'dropletTimer', gogogo: true, persists: true, timeLimit: rainWaveFrequency, callback: function() {
					self.createRaindrop(rainDensity);
				}
			});	
			
			this.umbrella = this.getAnimation('Umbrella', [-2000, -2000, 1, 1], .15, 'stage', -1);
			this.umbrella.play();
			this.umbrella.persists = true;
			this.mousePosition = {x: -1000, y: -1000};
			this.addTickCallback(function() {
			    this.umbrella.position = this.mousePosition;
			    filter.uniforms.mouse = this.mousePosition;
			}.bind(this), true);
			
			this.addTickCallback(function(event) {
			    for(var i = self.raindrops.length-1; i >= 0; i--) {
			        var raindrop = self.raindrops[i];
			        raindrop.position.y += raindrop.velocity.y * event.deltaTime;
			        if(self.isSpriteBelowStage(raindrop) 
			            || (raindrop.position.x > (self.umbrella.position.x - self.umbrella.width/2) && raindrop.position.x < (self.umbrella.position.x + self.umbrella.width/2) 
			               && (raindrop.position.y > self.umbrella.position.y - 20)))// && (raindrop.position.y < self.umbrella.position.y))) 
		            {
			            self.removeSomethingFromRenderer(raindrop, 'background');
			            self.raindrops.splice(i, 1);
			        }
			    }
			}, true)
		},
		
		preGameExtension: function() {
		
		    
		},
		
		play: function(options) {
		    
		},
		
		createRaindrop: function(amount) {
		    for(i = 0; i < amount; i++) {
    		    var raindrop = utils.addSomethingToRenderer("raindrop2", "background");//, {filter: filter});
    		    var rainSpeed = .5;
    		    raindrop.scale.x = .25 + Math.random() * .75;
    		    raindrop.scale.y = .25 + Math.random() * .75;
    		    raindrop.position = {x: 10 * Math.random()*119, y: -50};
    		    raindrop.velocity = {x: 0, y: rainSpeed + (Math.random() * 0.4 - 0.1)};
    		    this.raindrops.push(raindrop);
		    }
		}

	};
	 
	game.worldOptions = {
			background: {image: 'GreenGrid', scale: {x: 1, y: 1}},
		        width: 1200, 
		        height: 600,
		        //backgroundFilter: backgroundFilter,
		       };
	
	return $.extend({}, CommonGameMixin, game);
})














