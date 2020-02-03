define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'units/Marble'], function($, Matter, PIXI, CommonGameMixin, Moveable, Marble) {

	var targetScore = 1;

	var game = {
		gameName: 'Marbles',
		extraLarge: 20,
		large: 18,
		medium: 16,
		small: 8,
		zoneSize: 128,
		level: 0,
		victoryCondition: {type: 'timed', limit: 5},
		currentZones: [],
		selectionBox: true,
		noClickIndicator: true,
		acceptableTints: [/*blue*/ 0x009BFF, /*green*/0xCBCBCB /*red0xFF2300 0xFFFFFF*/, /*purple*/0xCC00BA, /*yellow*/0xCFD511],
		highlightTints: [/*blue*/ 0x43FCFF, /*green*/0xFFFFFF /*red0xFF2300 0xFFFFFF*/, /*purple*/0xFFB8F3, /*yellow*/0xFBFF00],
		selectionTint: 0x33FF45,
		pendingSelectionTint: 0x70ff32,
		previousListener: null,

		initExtension: function() {
		    this.marblePour = utils.getSound('marbles.wav');
		    this.marbleHit = utils.getSound('marblehit.wav', {volume: .15});
		    this.timerBoostAppear = utils.getSound('powerup1.wav', {volume: .15});
		    //this.timerBoostGrab = utils.getSound('bellhit3.wav', {volume: .25, rate: 1.85});
		    this.timerBoostGrab = utils.getSound('mybell1.wav', {volume: 2.5, rate: 2});
		},

		play: function(options) {
            this.nextLevel();

		    game = this;
		    var fadePercent = .8;
		    this.addTimer({name: 'timeBoostTimer', gogogo: true, timeLimit: 15000, callback: function() {
		        this.timeLimit = 13000 + Math.random() * 4000;
		        var timeBoost = game.createTimeBoost(1);
		        game.addBody(timeBoost);
		        game.timerBoostAppear.play();

		        var deathTimer = game.addTimer({name: 'boosterLifetime' + timeBoost.id, runs: 1, timeLimit: 1200, callback: function() {
		            game.removeBody(timeBoost);
		            game.removeEventListener(clickListener);
		        }, tickCallback: function(deltaTime) {
		            if(this.percentDone > fadePercent && !timeBoost.activated) {
		                timeBoost.renderlings['timeBoost'].alpha = 1-(this.percentDone-fadePercent)*(1/(1-fadePercent));
		                timeBoost.renderlings['timeBoostShadow'].alpha = 1-(this.percentDone-fadePercent)*(1/(1-fadePercent));
		            }
		        }});

    		    var clickListener = game.addEventListener('mousedown', function(event) {
    				var x = event.data.global.x;
    				var y = event.data.global.y;
    				if(!timeBoost.activated) {
        				if(Matter.Bounds.contains(timeBoost.bounds, {x: x, y: y})) {
        					if(Matter.Vertices.contains(timeBoost.vertices, {x: x, y: y})) {
        					    //clicked on timer boost!
        					    this.timerBoostGrab.play();
        		                timeBoost.renderlings['timeBoost'].alpha = 1;
        		                timeBoost.renderlings['timeBoostShadow'].alpha = 1;
        					    game.addTimer({name: 'fadeOutTimer' + timeBoost.id, timeLimit: 32, runs: 10, callback: function() {
        					        if(timeBoost.renderlings['timeBoost'].tint == 0x7AFF24) {
        					            timeBoost.renderlings['timeBoost'].tint = 0xFF30C7;
        					        } else {
        					            timeBoost.renderlings['timeBoost'].tint = 0x7AFF24;
        					        }
        					    }, totallyDoneCallback: function() {
                                    game.removeBody(timeBoost);
        					    }.bind(game)})
        	                    timeBoost.activated = true;
        					    game.invalidateTimer(deathTimer);
        						game.addToGameTimer(5000);
        						var plusFiveSprite = game.addSomethingToRenderer('PlusFive', 'foreground');
        						plusFiveSprite.position = {x: timeBoost.position.x, y: timeBoost.position.y-30};
        						plusFiveSprite.alpha = 1.4;
        						game.addTimer({name: 'plusFiveMoveAndFade' + timeBoost.id, timeLimit: 16, runs: 34, callback: function() {
        						    plusFiveSprite.position.y -= 1;
        						    plusFiveSprite.alpha -= 1.4/34;
        						}, totallyDoneCallback: function() {
        						    game.removeSomethingFromRenderer(plusFiveSprite, 'foreground');
        						}})
        					}
        				}
    				}
    			}.bind(game), false, true);
		    }});

		},

		nextLevel: function() {
		    //increment level
		    this.level += 1;

		    //give time bonus for completion
		    if(this.level > 1) {
		        this.addToGameTimer(2000);
		        var plusTwo = utils.addSomethingToRenderer('PlusTwo', 'foreground');
		            plusTwo.alpha = 1.4;
					plusTwo.position = this.getCanvasCenter();
					this.addTimer({name: 'plusTwo', timeLimit: 16, runs: 34, callback: function() {
					    plusTwo.position.y -= 1;
					    plusTwo.alpha -= 1.4/34;
					}, totallyDoneCallback: function() {
					    utils.removeSomethingFromRenderer(plusTwo, 'foreground');
				}.bind(this)})
		    }

		    //set marble count
		    this.marbleCount = 14 + this.level;

		    //remove previous goal zones
		    $.each(this.currentZones, function(index, zone) {
		        this.removeBody(zone);
		    }.bind(this))
		    this.currentZones = [];

		    //create and randomly place the zones in a corner
			var canvasWidth = this.canvasEl.getBoundingClientRect().width;
			var canvasHeight = this.canvasEl.getBoundingClientRect().height;
			var zoneBuffer = this.zoneSize + 40;
			var corners = [{x: (zoneBuffer)/2, y: (zoneBuffer)/2}, {x: canvasWidth-(zoneBuffer)/2, y: (zoneBuffer)/2}, {x: canvasWidth-(zoneBuffer)/2, y: canvasHeight-(zoneBuffer)/2}, {x: (zoneBuffer)/2, y: canvasHeight-(zoneBuffer)/2}];
			for(var x = 0; x < this.acceptableTints.length; x++) {
			    var newZone = this.createZone(this.acceptableTints[x]);
			    newZone.highlightTint = this.highlightTints[(x+1) % this.highlightTints.length];
			    newZone.isFlashing = 0;
			    newZone.timer = this.addTimer({name: 'zone' + x, timeLimit: 32, gogogo: true, callback: function() {
			            if(this.isFlashing > 0) {
			                if(this.renderlings['zone' + this.id].tint == this.tint)
			                    this.renderlings['zone' + this.id].tint = 0xFF9E00;
			                else
			                    this.renderlings['zone' + this.id].tint = this.tint;
			                this.isFlashing -= 1;
			            }
			        }.bind(newZone)
			    });

			    this.currentZones.push(newZone);
			    chosenCorner = null;
			    while(!chosenCorner) {
			        var cornerIndex = this.getRandomIntInclusive(0, this.acceptableTints.length-1);
			        var chosenCorner = corners[cornerIndex];
			        corners[cornerIndex] = null;
			    }
			    Matter.Body.setPosition(newZone, chosenCorner);
			    (function(newZone) {
    			    Matter.Events.on(newZone, 'onCollide', function(pair) {
        		        var otherBody = pair.pair.bodyA == newZone ? pair.pair.bodyB : pair.pair.bodyA;
        		        if(otherBody.unit.tint == newZone.tint) {
        		            newZone.isFlashing += 8;
        		            this.marbleHit.play();
        	                this.removeUnit(otherBody.unit);
        	                this.incrementScore(1);
        	                this.marbleCount -= 1;
        	                if(this.marbleCount == 0) {
        	                    this.nextLevel();
        	                }
        		        }
    			    }.bind(this));
			    }.bind(this)(newZone))
			    this.addBody(newZone);
			}

			//create handful of marbles
			this.createMarbles(this.marbleCount);

			//play sound
			var s = this.marblePour.play();
			this.marblePour.fade(.5, 0, 500, s);
		},

		createTimeBoost: function(scale) {
		    var boosterScale = scale || .15;
		    var timeBoost = Matter.Bodies.circle(0, 0, 32, {isStatic: true, isSensor: true});
	        timeBoost.renderChildren =
	        [{
		        id: 'timeBoostShadow',
			    data: this.texture('StopwatchShadow'),
    			    scale: {x: boosterScale, y: boosterScale},
			    rotate: 'none',
			    stage: 'StageNTwo',
			    filter: this.timeFilter
		    }, {
		        id: 'timeBoost',
			    data: this.texture('Stopwatch'),
    			    scale: {x: boosterScale, y: boosterScale},
			    rotate: 'none',
			    stage: 'StageNTwo',
			    filter: this.timeFilter
		    }]
		    var newPos = this.calculateRandomPlacementForBodyWithinCanvasBounds(timeBoost);
		    Matter.Body.setPosition(timeBoost, newPos);

		    this.addTimer({name: 'shakeTimer' + timeBoost.id, timeLimit: 48, runs: 10, callback: function() {
					        Matter.Body.setPosition(timeBoost, {x: newPos.x + (this.runs%2==0 ? 1 : -1)*2, y: newPos.y})
					    }, totallyDoneCallback: function() {
			    }.bind(this)})
		    return timeBoost;
		},

		createZone: function(tint) {
		    var zone = Matter.Bodies.rectangle(0, 0, this.zoneSize, this.zoneSize, {isStatic: true, isSensor: true});
		        zone.renderChildren = [{
		        id: 'zone' + zone.id,
			    data: this.texture('GoalZoneStar'),
			    tint: tint,
			    scale: {x: .5, y: .5},
			    rotate: 'none',
			    stage: 'StageNTwo',
		    }]
		    zone.tint = tint;
		    return zone;
		},

		createMarbles: function(number) {
		    for(x = 0; x < number; x++) {
    			var tintIndex = this.getRandomIntInclusive(0, this.acceptableTints.length-1);
    			var tint = this.acceptableTints[tintIndex];
    			var highlightTint = this.highlightTints[tintIndex];

    			var marble = Marble({tint: tint, highlightTint: highlightTint, selectionTint: this.selectionTint, pendingSelectionTint: this.pendingSelectionTint});
				marble.tint = tint;

    			utils.placeBodyWithinRadiusAroundCanvasCenter(marble, 10);
    			this.addBody(marble, true);
		    }

		},

		resetGameExtension: function() {
		    this.level = 0;
		},

		endGameExtension: function() {
			this.currentZones = [];
		}
	}

	/*
	 * Options to for the game starter
	 */
	game.worldOptions = {
			background: {image: 'Cork', scale: {x: 1, y: 1}},
		        width: 1200,
		        height: 600,
		        gravity: 0,
		       };

	game.instructions = ['Group marbles into their respective corners', 'Utilize shift-clicking and the selection box for economy of selection', 'Right-click to move a selection', 'Click the timers for a time boost'];

	return $.extend({}, CommonGameMixin, game);
})
