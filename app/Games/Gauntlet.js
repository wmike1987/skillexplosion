import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
import zone from '@utils/TargetSpawnZone'

var targetScore = 1;

var numberStyle = new PIXI.TextStyle({
    fill: "#49c59f",
    fillGradientType: 1,
    fontFamily: "Times New Roman",
    fontSize: 55,
    fontVariant: "small-caps",
    lineJoin: "bevel"
});

var game = {

    worldOptions: {
            background: {image: 'ClayBackground', scale: {x: 1.334, y: 1.334}},
            width: 1200,
            height: 600,
            gravity: 0.000,
        },

    assets: [{name: 'gauntlet', target: 'Textures/Gauntlet.json'}],

	gameName: 'Gauntlet',
	ball: null,
	baseScoreText: "Time Elapsed: ",
	showWave: true,
	showSubLevel: true,
	victoryCondition: {type: 'lives', limit: 3},
	tints: [/*yellow*/0xFCF628, /*white*/0xFFFFFF, /*green*/0x0AC202, /*red*/0xEE1B1B, /*purple*/0xCE81FF, /*dark blue*/0x195FFF],
	deadZones: [{x: 480, y: 330}, {x: 690, y: 280}], //don't create targets over the eyes

	initExtension: function() {
	    this.hit = gameUtils.getSound('nicehit1.wav', {volume: .12, rate: 2});
	    this.countDown = gameUtils.getSound('softBeep.wav', {volume: .2, rate: 1});
	    this.whistle = gameUtils.getSound('whistle.wav', {volume: .2, rate: 1.2});
	    this.gameFinished = gameUtils.getSound('nextlevel.wav', {volume: .38, rate: .75});
	    this.hits = [this.hit, this.hit2, this.hit3, this.hit4];

		//create face
		this.face = graphicsUtils.addSomethingToRenderer('EyeFace', 'background');
		this.face.scale.x = .75;
		this.face.scale.y = .75;
		this.face.position = gameUtils.getCanvasCenter();
		this.face.persists = true;

		this.eyes = graphicsUtils.addSomethingToRenderer('EyeEyes', 'background');
		this.eyes.scale.x = .75;
		this.eyes.scale.y = .75;
		this.eyes.position = gameUtils.getCanvasCenter();
		this.eyes.persists = true;

		this.blink = graphicsUtils.addSomethingToRenderer('EyeBlink', 'background');
		this.blink.scale.x = .75;
		this.blink.scale.y = .75;
		this.blink.position = gameUtils.getCanvasCenter();
		this.blink.persists = true;

		this.wink = graphicsUtils.addSomethingToRenderer('EyeWink', 'background');
		this.wink.scale.x = .75;
		this.wink.scale.y = .75;
		this.wink.position = gameUtils.getCanvasCenter();
		this.wink.visible = false;
		this.wink.persists = true;

		//create zones
		var leftZoneTop = new zone(this.canvas.width/6, this.canvas.height/3, this.canvas.width/3, this.canvas.height/6, 60, 20);
		var leftZoneBottom = new zone(this.canvas.width/6, this.canvas.height/2, this.canvas.width/3, this.canvas.height/6, 60, 20);

		var rightZoneTop = new zone(this.canvas.width/2, this.canvas.height/3, this.canvas.width/3, this.canvas.height/6, 60, 20);
		var rightZoneBottom = new zone(this.canvas.width/2, this.canvas.height/2, this.canvas.width/3, this.canvas.height/6, 60, 20);
		var self = this;
		this.zoneManager = {left: true, zones: [leftZoneTop, leftZoneBottom], flip: function() {
			this.zones = this.left ? [rightZoneTop, rightZoneBottom] : [leftZoneTop, leftZoneBottom];
			this.left = !this.left;
		}};
	},

	play: function(options) {

		//current targets, sorted by tint
		this.currentTargets = {};

		this.currentTint;

	    this.currentWave = 0;
		this.chain = 0;

		this.nextWave();

		this.addEventListener('mousedown', function(event) {
		    var hit = false;
		    if(!this.gameInProgress || !this.currentTint || this.blink.visible) return;

			var rect = this.canvasEl.getBoundingClientRect();
			var x = event.clientX - rect.left;
			var y = event.clientY - rect.top;

			//loop targets
		    $.each(this.currentTargets, function(i, tintArray) {
		        if(i == this.currentTint) {
		            //hit
		            this.currentTargets[i] = $.grep(tintArray, function(target, i) {
    			        if(Matter.Vertices.contains(target.vertices, {x: x, y: y})) {
    			            hit = true;
    		                if(this.clickHook) {
    			                return this.clickHook(target);
    			            }
    		                return false;
    			        } else {
    			            return true;
    			        }
    			    }.bind(this));
		        } else {
		            //miss
		            this.currentTargets[i] = $.grep(tintArray, function(target, i) {
    			        if(Matter.Vertices.contains(target.vertices, {x: x, y: y})) {
    			            if(!hit)
    		                    this.addLives(-1);
    		                return true;
    			        } else {
    			            return true;
    			        }
    			    }.bind(this));
		        }
	        }.bind(this))

	        if(hit && this.afterLoopHitAction) {
	            this.afterLoopHitAction();
	        }

		    //run victory test
		    if(this.victoryHook)
		        this.victoryHook();
		}.bind(this));

		//create scoreTimer (every second is a point)
        var scoreTimer = this.addTimer({name: 'scoreTimer', gogogo: true, timeLimit: 1000, callback: function() {
                this.incrementScore(1);
	        }.bind(this)
        });

	},

	//defaults to creating a circle
	createTargetSomewhere: function(options) {
		var radius = null;
		var scale = null;
		var shadowScale = null;
		var shadowOffset = null;
		var target = null;
		var rotate;
		if(!options) {
		    options = {};
		}

		//set parameters and create body based on diamond or square
		if(options.textureName == 'Diamond') {
		    var radius = options.size;
	        target = Matter.Bodies.circle(0, 0, radius, {isStatic: true});
	        rotate = 'random';
	        scale = {x: radius*2/128, y: radius*2/128};
	        shadowScale = {x: radius*2.5/256, y: radius*2.5/256};
	        shadowOffset = {x: 12, y: 12};

	        target.playDeathAnimation = function() {
							var animationOptions = {};
							animationOptions.numberOfFrames = 4;
							animationOptions.baseName = 'DiamondFlash';
							animationOptions.transform = [target.position.x, target.position.y, scale.x, scale.y];
							animationOptions.speed = .5;
							animationOptions.playThisManyTimes = 2;
							animationOptions.rotation = target.renderlings[0].initialRotate;
	            var anim = gameUtils.getAnimation(animationOptions);
							graphicsUtils.addSomethingToRenderer(anim);
							anim.play();
	        }.bind(this);
		}
	    else { //else square
	        var width = options.size;
	        target = Matter.Bodies.rectangle(0, 0, width, width, {isStatic: true});
	        scale = {x: width/128, y: width/128};
	        shadowOffset = {x: 32, y: 32};
	        shadowScale = {x: 0, y: 0};

	        target.playDeathAnimation = function() {
						var animationOptions = {};
						animationOptions.numberOfFrames = 4;
						animationOptions.baseName = 'SquareWithBorderDeath';
						animationOptions.transform = [target.position.x, target.position.y, scale.x, scale.y];
						animationOptions.speed = .75;
						animationOptions.playThisManyTimes = 1;
						animationOptions.rotation = target.renderlings[0].initialRotate;
						var anim = gameUtils.getAnimation(animationOptions);
						graphicsUtils.addSomethingToRenderer(anim);
						anim.play();
	        }.bind(this);
	    }

	    var bodyWidth = target.bounds.max.x - target.bounds.min.x;

	    //choose tine
	    if(options.forceTint) {
	        var tint = options.forceTint;
	    } else {
		    do {
		        var tint = this.tints[utils.getIntBetween(0, this.tints.length-1)];
		    } while(options.excludeATint && tint == options.excludeATint)
	    }

        target.collisionFilter.group = -1; //don't collide with each other

	    target.renderChildren = [{
				data: options.textureName,
		    //data: utils.texture(options.textureName),
		    scale: scale || {x: 1, y: 1},
		    tint: tint,
		    initialRotate: rotate || null
		},
		{
		    id: 'shadow',
		    data: options.textureName + 'Shadow',
		    scale: shadowScale || {x: 1, y: 1},
		    visible: true,
		    rotate: 'none',
		    tint: tint,
		    stage: "stageNTwo",
		    offset: shadowOffset,
			}
		];
		target.tint = tint;

		if(!this.currentTargets[tint]) {
		    this.currentTargets[tint] = [];
		}

		//find position, makes sure the position isn't over a dead zone and that positions aren't repeated
		do {
		    var newPos = gameUtils.calculateRandomPlacementForBodyWithinCanvasBounds(target, true);
		    var goodPlacement = true;
		    $.each(this.deadZones, function(i, zone) {
		        if(Math.abs(newPos.x - zone.x) < bodyWidth && Math.abs(newPos.y - zone.y) < bodyWidth) {
		            goodPlacement = false;
		        }
		    })

		    $.each(Object.keys(this.currentTargets), function(i, key) {
			        $.each(this.currentTargets[key], function(i, target) {
			            if(newPos.x == target.position.x && newPos.y == target.position.y) {
			                goodPlacement = false;
			            }
			        })
		    }.bind(this))
		}
		while(!goodPlacement)

		//or uses the provided position
		Matter.Body.setPosition(target, options.position || newPos);
		this.addBody(target);
		this.currentTargets[tint].push(target);
		return target;
	},

	nextWave: function() {
	    this.setSubLevel(null);
	    this.resetGameState();
	    this.blink.visible = true;
	    this.currentWave += 1;
	    this.setWave(this.currentWave);
	    if(this.currentWave % 3 == 0 && this.lives < 3) {
	        this.addLives(1);
	        this.floatText("+1 life!", {x: gameUtils.getCanvasCenter().x, y: gameUtils.getCanvasCenter().y/2});
	    }
	    var newWave = $.Deferred();
	    var countDown = $.Deferred();
	    this.clearAllDef = $.Deferred();
	    this.leftRightDef = $.Deferred();
	    this.numbersDef = $.Deferred();
	    gameUtils.signalNewWave(this.currentWave, newWave);

	    //count down after wave
	    newWave.done(this.endLevelAndPerformCountdown.bind(this, countDown));

	    //start level 1
	    countDown.done(this.clearAll.bind(this, this.currentWave));

	    //level 2
	    this.clearAllDef.done(this.leftRight.bind(this, this.currentWave));

	    //level 3
	    this.leftRightDef.done(this.numbers.bind(this, this.currentWave));

	},

	//mini games
	clearAll: function(wave) {
	    this.gameInProgress = true;
	    this.setSubLevel(1);

	    //**********
	    //game logic
	    //**********

	    //create initial set based on wave
	    for(var x = 0; x < 5 + (this.currentWave * 1); x++) {
	        this.createTargetSomewhere({textureName: "Diamond", size: 35-this.currentWave});
	    }

	    //initial blink
	    this.newBlink();

	    //create timer to introduce new targets
        var newTargetTimer = this.addTimer({name: 'newTargetTimer', gogogo: true, timeLimit: (1600 - (30*this.currentWave)), callback: function() {
                this.createTargetSomewhere({textureName: "Diamond", size: 35-this.currentWave});
	        }.bind(this)
        });

	    //create blink timer
        var newBlinkTimer = this.addTimer({name: 'newBlinkTimer', gogogo: true, timeLimit: 3800, callback: function() {
                newBlinkTimer.timeLimit = (2.5 + Math.random() * 1.3) * 1000;
                if(Math.random() < .1) {
                    newBlinkTimer.timeLimit = 1000;
                }
	            this.newBlink();
	        }.bind(this)
        });

	    //set victory condition
	    this.victoryHook = function() {
		    if(Object.keys(this.currentTargets).every(function(tint) {
		        if(this.currentTargets[tint].length == 0) {
		            return true;
		        }
	        }.bind(this))) {
	            this.endLevelAndPerformCountdown(this.clearAllDef, true);
	            this.invalidateTimer(newTargetTimer);
	            this.invalidateTimer(newBlinkTimer);
	        } else if(this.currentTargets[this.currentTint].length == 0){
	            this.newBlink();
	            newBlinkTimer.reset();
	            newBlinkTimer.timeLimit = (2.5 + Math.random() * 1.3) * 1000;
                if(Math.random() < .1) {
                    newBlinkTimer.timeLimit = 1000;
                }
	        }
	    };

	    this.clickHook = function(target) {
            this.removeBody(target);
            target.playDeathAnimation();
            this.hit.play();
            return false;
	    }.bind(this);
	},


	leftRight: function(wave) {
	    var targetsHit = 0;
	    var targetGoal = 12 + wave*2;
	    this.setSubLevel(2);

	    //initial targets
	    var t = null;
        $.each(this.zoneManager.zones, function(i, zone) {
            t = this.createTargetSomewhere({textureName: 'Diamond', position: zone.giveMeLocation(), excludeATint: t, size: 35-this.currentWave}).tint;
        }.bind(this));
        //blink
        this.newBlink();

        //game logic
	    this.clickHook = function(target) {
	        this.removeBody(target);
	        target.playDeathAnimation();
	        return false;
	    }.bind(this);

	    this.afterLoopHitAction = function(target) {
            this.hit.play();

	        //remove current targets
	        this.clearTargets();

	        //add to targets hit
	        targetsHit += 1;

	        if(targetsHit < targetGoal) {
	            //flip the zone and create new targets
		        this.zoneManager.flip();
		        var t = null;
    	        $.each(this.zoneManager.zones, function(i, zone) {
    	            t = this.createTargetSomewhere({textureName: 'Diamond', position: zone.giveMeLocation(), excludeATint: t, size: 35-this.currentWave}).tint;
    	        }.bind(this));

		        //blink
		        this.newBlink(120);
	        }
        }.bind(this)

	    this.victoryHook = function() {
	        if(targetsHit == targetGoal) {
	            this.clearTargets();
	            this.endLevelAndPerformCountdown(this.leftRightDef, true);
	        }
	    }

	},

	numbers: function(wave) {

	    //game logic
	    this.setSubLevel(3);

	    //chose two tints
	    var tint1 = this.tints[utils.getIntBetween(0, this.tints.length-1)];
	    do {
	        var tint2 = this.tints[utils.getIntBetween(0, this.tints.length-1)];
	    } while (tint1 == tint2)

	    var tintManager = {};
	    tintManager[tint1] = 1;
	    tintManager[tint2] = 1;

	    //create number grids
	    var tintToUse = tint1;
	    var maxSquares = 50;
	    var numberOfSquaresToMake = (6 + wave*2) < maxSquares ? (6 + wave*2) : maxSquares;
	    for(var i = 0; i < numberOfSquaresToMake; i++) {
	        if(i % 2 == 0) {
	            tintToUse = tint1;
	        } else {
	            tintToUse = tint2;
	        }
	        var newTarget = this.createTargetSomewhere({textureName: 'SquareWithBorder', forceTint: tintToUse, size: 100-this.currentWave*3})
	        newTarget.numberValue = this.currentTargets[tintToUse].length;
	    }

	    //apply number text to target
	    $.each(this.currentTargets, function(i, tintArray) {
	        $.each(tintArray, function(i, target) {
	            target.numberSprite = graphicsUtils.addSomethingToRenderer("TEX+:"+target.numberValue, 'hud', {style: $.extend({}, numberStyle, {fill: target.tint}), x: target.position.x, y: target.position.y});
	        }.bind(this))
	    }.bind(this))

	    //initial blink
	    this.newBlink();

	    //create blink timer
        var newBlinkTimer = this.addTimer({name: 'newBlinkTimer', gogogo: true, timeLimit: 3800, callback: function() {
                newBlinkTimer.timeLimit = (2.5 + Math.random() * 1.3) * 1000;
	            this.newBlink({forceChange: true});
	        }.bind(this)
        });

	    //click hook
	    this.clickHook = function(target) {
	        if(tintManager[target.tint] == target.numberValue) {
                this.removeBody(target);
                target.playDeathAnimation();
                graphicsUtils.removeSomethingFromRenderer(target.numberSprite);
                tintManager[target.tint] += 1;
                this.hit.play();
                return false
	        } else {
	            return true;
	        }
	    }

	    //victory hook
	    this.victoryHook = function() {
	        if(Object.keys(this.currentTargets).every(function(tint) {
		        if(this.currentTargets[tint].length == 0) {
		            return true;
		        }
	        }.bind(this))) {

	            this.blink.visible = true;
	            //trigger new wave
	            this.invalidateTimer(newBlinkTimer);

	            var startNextWave = $.Deferred();
	            gameUtils.praise({deferred: startNextWave});
	            this.gameFinished.play();
	            startNextWave.done(function() {
		            this.nextWave();
	            }.bind(this))
	        } else if(this.currentTargets[this.currentTint].length == 0) {
	            newBlinkTimer.reset();
	            newBlinkTimer.timeLimit = (1.7 + Math.random() * 2.2) * 1000;
	            this.newBlink();
	        }
	    }
	},

	resetGameState: function() {
	    this.currentTint = null;
	    this.gameInProgress = false;
	    this.clearAllInProgress = false;
	    this.numbersInProgress = false;
	    this.leftRightInProgress = false;
	    this.clickHook = null;
	    this.afterLoopHitAction = null;
	    this.victoryHook = null;
	},

	//clear all targets
	clearTargets: function() {
	    Object.keys(this.currentTargets).forEach(function(tint) {
	        $.each(this.currentTargets[tint], function(i, target) {
	            this.removeBody(target);
	        }.bind(this));
	    }.bind(this))

        this.currentTargets = {};
	},

	//new blink performs a blink and sets the currentTint
	newBlink: function(options) {
	    if(!options) {
	        options = {};
	    }
	    if(this.blink.visible) {
	        this.blink.visible = false;
	        this.eyes.tint = this.getNewEyeTint();
	    } else {
			this.blink.visible = true;
		    this.addTimer({name: 'blinkTimer', timeLimit: options.timeLimit || 190, runs: 1, callback: function() {
			    this.blink.visible = false;
                this.eyes.tint = this.getNewEyeTint(options.forceChange);
			    }.bind(this)
		    });
	    }
	},

	//no side effects, just cosmetic
	newWink: function() {
		this.wink.visible = true;
	    this.addTimer({name: 'winkTimer', timeLimit: 350, runs: 1, callback: function() {
		    this.wink.visible = false;
		    }.bind(this)
	    });
	},

	//gets a new eye tint of a color that exists as a target
	getNewEyeTint: function(forceChange) {
	    if(!this.currentTargets || this.currentTargets.length == 0)
	        return;

	    var newTint = null;
	    do {
		    Object.keys(this.currentTargets).some(function(tint) {
		        if(this.currentTargets[tint] && this.currentTargets[tint].length > 0) {
		            if(mathArrayUtils.flipCoin()) {
		                if(this.oneColorExists() || forceChange && this.currentTint != tint) {
		                    newTint = tint;
		                } else if (!forceChange){
		                    newTint = tint;
		                }
		                return true;
		            }
		        }
		    }.bind(this))
	    }
	    while(newTint == null)
	    this.currentTint = newTint;
	    return this.currentTint;
	},

	endLevelAndPerformCountdown: function(deferredToResolve, praise) {

	    this.resetGameState();
	    this.blink.visible = true;
	    var startTimerDeferred = $.Deferred();
	    if(praise) {
	        gameUtils.praise({deferred: startTimerDeferred})
	        this.gameFinished.play();
	    } else {
	        startTimerDeferred.resolve();
	    }
	    startTimerDeferred.done(function() {
		    var thisTimer = this.addTimer({name: 'countDownTimer', immediateStart: true, timeLimit: 1000, runs: 4, callback: function() {
		            if(thisTimer.runs > 1) {
		                this.countDown.play();
		            }
    			    graphicsUtils.floatText(thisTimer.runs > 1 ? thisTimer.runs-1 : "GO!", gameUtils.getCanvasCenter(), {textSize: 90, stationary: false})
			    }.bind(this), totallyDoneCallback: function() {
			        deferredToResolve.resolve();
	                this.whistle.play();
	                this.gameInProgress = true;
			    }.bind(this)
		    });
	    }.bind(this))
	},

	oneColorExists: function() {
	    if(!this.currentTargets) return;
	    var colorsThatExist = 0;
        $.each(this.currentTargets, function(i, tintArray) {
	        if(tintArray.length > 0) {
	            colorsThatExist += 1;
	        }
	    }.bind(this))
	    return colorsThatExist == 1;
	},

	endGameExtension: function() {
	    this.blink.visible = true;
	    this.resetGameState();
	}
}

export default $.extend({}, CommonGameMixin, game);
