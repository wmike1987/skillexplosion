define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin'], function($, Matter, PIXI, CommonGameMixin) {

	var targetScore = 1;

	var game = {
		gameName: 'Gulls',
		ball: null,
		victoryCondition: {type: 'timed', limit: 40},
		hideScore: false,
		noClickIndicator: false,
		noBorder: true,
		colorCycle: [/*blue*/ '#44E6FF', /*p*/'#f975f3', /*yellow*/'#f2ed00'],
		birds: [],
		wave: 0,

		resetGameExtension: function() {
		    wave = 0;
		    birds = [];
		    this.palm.currentColor = -1;
		},

		initExtension: function() {
            this.waveRustle = utils.getSound('Beach.wav');

		    this.hit = utils.getSound('nicehit1.wav', {volume: .2, rate: 2});
		    this.hit2 = utils.getSound('nicehit1.wav', {volume: .2, rate: 2.3});
		    this.hit3 = utils.getSound('nicehit1.wav', {volume: .2, rate: 2.6});
		    this.hits = [this.hit, this.hit2, this.hit3];

            //setup palm tree
			this.palm = utils.addSomethingToRenderer('BluePalm', 'foreground');
			this.palm.persists = true;
			this.palm.tint = 0;
			this.palm.scale.x = this.palm.scale.y = 1.3;
			this.palm.position.x = 300;
			this.palm.position.y = 350;
			this.palm.nextColor = Math.floor(Math.random() * 3) + 1;
			var self = this;
			this.palm.timer = this.addTimer({name: 'palmColorTimer', timeLimit: 150, done: true, persists: true,
			    tickCallback: function() {
			        var t = self.palm.tint;
		        	self.palm.tint = self.shadeBlendConvert(this.percentDone, self.colorCycle[self.palm.currentColor%self.colorCycle.length] || '#000000', self.colorCycle[self.palm.nextColor%self.colorCycle.length]);
			    },
			    callback: function() {
			        if(self.gameState != 'playing') return;
			        self.palm.currentColor = self.palm.nextColor;
					self.palm.nextColor += Math.floor(Math.random() * 2) + 1;
					self.createBirds();
				}
			});
		},

		endGameExtension: function() {
		    var self = this;
		    this.addTimer({name: 'fadeToBlackTimer', timeLimit: 150,
			    tickCallback: function() {
		        	self.palm.tint = self.shadeBlendConvert(this.percentDone > .98 ? .98 : this.percentDone, self.colorCycle[self.palm.currentColor%self.colorCycle.length], '#000000');
			    },
			});
		},

		preGameExtension: function() {

		},

		play: function(options) {

			//create wave 1
			this.nextWave();

			//ran off stage listener
			this.addTickListener(function(event) {
			    $.each(this.birds, function(i, bird) {
                    if(bird.correctBird && this.bodyRanOffStage(bird))
                        this.nextWave();
			    }.bind(this))
			}.bind(this));

			//click listener
			this.addEventListener('mousedown', function(event) {
				var rect = this.canvasEl.getBoundingClientRect();
				var x = event.clientX - rect.left;
				var y = event.clientY - rect.top;
				$.each(this.birds, function(i, bird) {
				    if(!bird.correctBird && !bird.timerBird) return;
				    $.each(bird.partsCopy, function(i, part) {
					    if(i == 0) return;
    					if(Matter.Vertices.contains(part.vertices, {x: x, y: y})) {
    					    if(bird.timerBird) {
    					        if(!bird.alreadyHit) {
        					        bird.alreadyHit = true;
        					        this.removeBody(bird);
        					        this.hits[this.timerBirdsHit].play();
        					        this.timerBirdsHit++;
    					        }
    					    } else {
    					        if(this.timerBirdsHit == 2) { //add 2 seconds
        						    this.addToGameTimer(2000);
            						var plusOne = utils.addSomethingToRenderer('PlusTwo', 'foreground');
            						plusOne.position = {x: x, y: y};
            						plusOne.position.y -= 50;
            						this.floatSprite(plusOne);
    					            this.hits[2].play();
    					        } else if(this.timerBirdsHit == 1) { //add 1 second
        						    this.addToGameTimer(1000);
            						var plusOne = utils.addSomethingToRenderer('PlusOne', 'foreground');
            						plusOne.position = {x: x, y: y};
            						plusOne.position.y -= 50;
            						this.floatSprite(plusOne);
    					            this.hits[1].play();
    					        }
        						this.incrementScore(targetScore);
        						var s = this.waveRustle.play();
        						this.waveRustle.fade(Math.random() * .75 + .25, 0, 2000, s);
        						this.nextWave();
    					    }
    						return false;
    					}
				    }.bind(this))
				}.bind(this))
			}.bind(this));
		},

		nextWave: function() {
		    this.clearBirds();
		    this.palm.timer.reset();
		    this.wave++;
		    this.timerBirdsHit = 0;
		},

		clearBirds: function() {
			$.each(this.birds, function(i, bird) {
			    this.removeBody(bird);
			}.bind(this))
		    this.birds = [];
		},

		createBirds: function() {
		    for(i = 0; i < 2; i++) {
		        this.birds.push(this.createBird(null));
		    }

		    $.each(this.colorCycle, function(i, color) {
                this.birds.push(this.createBird(i));
		    }.bind(this));

		},

		createBird: function(tint) {
		    var createBirdOffScreenRight = Math.random() > 0.5;

            //create bird shape, giving it an initial location which allows the bounds to be properly calculated (bug?). With proper bounds we can call calculateRandomPlacementForBodyWithinCanvasBounds()
            var bird = Matter.Bodies.fromVertices(99999, 99999, Matter.Vertices.fromPath('115, -55  , 111, -39  , 105, -34  , 102, -19  , 126, -11  , 128, -7  , 123, -6  , 124, -3  , 83, -1  , 37, -15  , 29, -21  , 28, -25  , 0, -19  , 0, -24  , 4, -27  , 23, -34  , 30, -41  , 53, -42  , 49, -50  , 56, -73  , 58, -73  , 59, -63  , 63, -72  , 65, -72  , 66, -63  , 72, -67  , 72, -74  , 92, -107  , 98, -127  , 100, -127  , 100, -113  , 106, -128  , 108, -128  , 109, -121  , 107, -115  , 116, -126  , 116, -119  , 112, -111  , 123, -119  , 123, -115  , 118, -109  , 124, -109  , 124, -106  , 121, -103  , 122, -99  , 115, -82'), { frictionAir: 0});
            bird.render.sprite.texture = 'Pelican';

            //tint the bird
            if(this.palm.currentColor%this.colorCycle.length == tint)
                bird.correctBird = true;

            if(tint != null)
                bird.render.sprite.tint = parseInt(this.colorCycle[tint].replace(/^#/, ''), 16);
            else {
                bird.timerBird = true;
                bird.render.sprite.tint = parseInt('870101', 16);;
            }
            //scale bird
            var scale = Math.random() * .5 + .5;
            this.scaleBody(bird, scale, scale);

            //calculate and set position then flip the bird if it's moving left to right
            if(createBirdOffScreenRight)
			    var xLoc = (this.canvasEl.getBoundingClientRect().width) + Math.random() * 20 + 20;
			else
			    var xLoc = Math.random() * -20 - 20;
            yLoc = this.calculateRandomPlacementForBodyWithinCanvasBounds(bird).y;
            if(!createBirdOffScreenRight)
                this.scaleBody(bird, -1, 1);

            //console.debug(Matter.Vertices.area(bird.vertices));
            Matter.Body.setPosition(bird, {x: xLoc, y: yLoc});

            //set velocity
			var velocityRange = 3;
			if(this.wave > 20)
			    velocityRange = 4;
			if(this.wave > 40)
			    velocityRange = 5;
			if(this.wave > 60)
			    velocityRange = 6;
			if(this.wave > 80)
			    velocityRange = 7;
			if(this.wave > 100)
			    velocityRange = 8;
			var xVelocity = Math.random() * velocityRange * (createBirdOffScreenRight ? -1 : 1) + (createBirdOffScreenRight ? -4 : 4);
			Matter.Body.setVelocity(bird, {x: xVelocity , y: 0});

			//no collisions!
			bird.collisionFilter.group = -1;

            //add body to world
            this.addBody(bird, true);

			return bird;
		},

	}

	/*
	 * Options to for the game starter
	 */
	game.worldOptions = {
			background: {image: 'PalmBackground', scale: {x: 1.334, y: 1.334}},
			    gravity: 0,
		        width: 1200,
		        height: 600,
		       };

    game.instructions = ['Click the pelican whose color matches the tree', 'Receive a time bonus by clicking one or both red pelicans before the main pelican'];

	return $.extend({}, CommonGameMixin, game);
})
