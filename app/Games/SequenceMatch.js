import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'

var targetScore = 1;

var sequenceStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 70,
    fill: ['#119EFF'],
    stroke: '#119EFF',
    strokeThickness: 0,
    wordWrap: true,
    wordWrapWidth: 440
});

var matchStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 70,
    fill: ['#FAFAFA'],
    stroke: '#FAFAFA',
    strokeThickness: 0,
    wordWrap: true,
    wordWrapWidth: 440
});

var style = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 140,
    fill: ['#FAFAFA'],
    stroke: '#000000',
    strokeThickness: 2,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 2,
    wordWrap: true,
    wordWrapWidth: 440
});

var redScoreStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 140,
    fill: ['#ff542d'],
    stroke: '#000000',
    strokeThickness: 2,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 2,
    wordWrap: true,
    wordWrapWidth: 440
});

var game = {

    worldOptions: {
        background: {image: 'Chalkboard', scale: {x: 1.0, y: 1.0}},
        width: 1200,
        height: 600,
        gravity: 0,
    },

    assets: [{name: 'chalkboardSheet', target: 'Textures/ChalkboardSheet.json'}],

	gameName: 'SequenceMatch',
	victoryCondition: {type: 'timed', limit: 180},
	hideScore: false,
	noClickIndicator: true,
	noBorder: true,
	lastTap: null,

	initExtension: function() {
	    this.begin = gameUtils.getSound('chalkWriting1.wav', {volume: .5, rate: 1.4});
	    this.match = gameUtils.getSound('chalkEraser1.wav', {volume: 1, rate: 1});
	    this.tap = [gameUtils.getSound('chalkWriting2.wav', {volume: .03, rate: .9}),
        		    gameUtils.getSound('chalkWriting2.wav', {volume: .02, rate: 1.1}),
        		    gameUtils.getSound('chalkWriting3.wav', {volume: .03, rate: .9}),
        		    gameUtils.getSound('chalkWriting3.wav', {volume: .02, rate: 1.1}),
        		    gameUtils.getSound('chalkWriting4.wav', {volume: .03, rate: .9}),
        		    gameUtils.getSound('chalkWriting4.wav', {volume: .02, rate: 1.1})];

		this.levelEmitterConfig = { "alpha": { "start": 1, "end": 0.11 }, "scale": { "start": 0.2, "end": 0.2, "minimumScaleMultiplier": 1 }, "color": { "start": "#ffffff", "end": "#ffffff" }, "speed": { "start": 200, "end": 0, "minimumSpeedMultiplier": 1.02 }, "acceleration": { "x": 0, "y": 0 }, "maxSpeed": 0, "startRotation": { "min": 0, "max": 360 }, "noRotation": false, "rotationSpeed": { "min": 2, "max": 0 }, "lifetime": { "min": 0.5, "max": 0.5 }, "blendMode": "add", "frequency": 0.2, "emitterLifetime": 0.5, "maxParticles": 500, "pos": { "x": 0, "y": 0 }, "addAtBack": false, "spawnType": "burst", "particlesPerWave": 14, "particleSpacing": 100, "angleStart": 16 }
	},

	play: function(options) {

		var buttonSpacing = style.fontSize;

		//initialize first match
		this.currentMatch = null;
		this.sequence = [];
		this.begin.play();
		this.generateNewMatch();

		//initialize sequence, just hold up to 4?
		var initSeq = ['.', '.', 1, 2];
		var i = 0;
		var initSequenceTimer = this.addTimer({name: 'initializeSequence', runs: initSeq.length, timeLimit: 140, callback: function() {
	        this.updateSequenceBodies(initSeq[i]);
	        i++;
        }.bind(this)});

	    /***create buttons***/
	    //plus
	    var add = graphicsUtils.addSomethingToRenderer('TEX+:' + '+', null, {style: $.extend({}, style), x: this.canvas.width/2-(2*buttonSpacing) + buttonSpacing/2, y: this.canvas.height*3/4});

	    //minus
	    var subtract = graphicsUtils.addSomethingToRenderer('TEX+:' + '–', null, {style: $.extend({}, style), x: this.canvas.width/2-(buttonSpacing) + buttonSpacing/2, y: this.canvas.height*3/4});

	    //multiply
	    var multiply = graphicsUtils.addSomethingToRenderer('TEX+:' + 'x', null, {style: $.extend({}, style), x: this.canvas.width/2+0 + buttonSpacing/2, y: this.canvas.height*3/4});

	    //divide
	    var divide = graphicsUtils.addSomethingToRenderer('TEX+:' + '÷', null, {style: $.extend({}, style), x: this.canvas.width/2+buttonSpacing + buttonSpacing/2, y: this.canvas.height*3/4});

	    //create MATCH text
	    graphicsUtils.addSomethingToRenderer('MatchChalk', null, {style: $.extend({}, style), x: this.canvas.width/2-(1.5*buttonSpacing), y: this.canvas.height*1/4});

	    var buttons = [add, subtract, multiply, divide];

	    $.each(buttons, function(index, button) {
	        button.interactive = true;
	        button.buttonMode = true;
		    button.on("mouseover", function() {
	            button.style = $.extend({}, redScoreStyle);
	            button.style.fontSize = button.style.fontSize + 20;
	        });

	        button.on("mouseout", function() {
		        button.style = $.extend({}, style);
		        button.style.fontSize = button.style.fontSize - 20;
		    });
	    })

	    add.on("click", function() {
	        this.operation("+");
	    }.bind(this));

	    subtract.on("click", function() {
	        this.operation("-");
	    }.bind(this));

	    multiply.on("click", function() {
	        this.operation("*");
	    }.bind(this));

	    divide.on("click", function() {
	        this.operation("/");
	    }.bind(this));

	    //setup listener to stop the shift
	    this.addTickCallback(function() {
	        if(!this.newestValue) return;
	        if(this.newestValue.position.x <= this.canvas.width/2) {
	            var adjustment = this.canvas.width/2 - this.newestValue.position.x;
	            this.blockOperation = false;
	            $.each(this.sequence, function(index, body) {
	                Matter.Body.setVelocity(body, {x: 0, y: 0});
	                Matter.Body.setPosition(body, {x: body.position.x + adjustment, y: body.position.y})
	            }.bind(this))

	            //check match condition
	            var len = this.sequence.length;
	            if(len > 1 && this.sequence[len-1].numericalValue &&
	               this.sequence[len-1].numericalValue == this.currentMatch.numericalValue) {
	                    this.foundMatch();
	            }
	        }

	        this.sequence = $.grep(this.sequence, function(seq, index) {
	            if(gameUtils.bodyRanOffStage(seq)) {
	                this.removeBody(seq);
	                return false;
                } else {
                    return true;
                }
	        }.bind(this))
         }.bind(this))

	},

	operation: function(operation) {
	    if(this.blockOperation) return;
	    var len = this.sequence.length;
	    var limit = 999;
	    var newValue = limit;
	    switch(operation) {
            case "+":
                newValue = this.sequence[len-2].numericalValue + this.sequence[len-1].numericalValue;
                break;
            case "-":
                newValue = Math.abs(this.sequence[len-2].numericalValue - this.sequence[len-1].numericalValue);
                break;
            case "/":
                if(this.sequence[len-2].numericalValue % this.sequence[len-1].numericalValue == 0)
                    newValue = this.sequence[len-2].numericalValue / this.sequence[len-1].numericalValue;
                break;
            case "*":
                newValue = this.sequence[len-2].numericalValue * this.sequence[len-1].numericalValue;
                break;
            default:
        }
        if(newValue < limit) {
            this.tap[mathArrayUtils.getRandomIntInclusive(0, this.tap.length-1)].play();
            this.updateSequenceBodies(newValue);
        }
	},

	foundMatch: function() {

	    var emitter = gameUtils.createParticleEmitter({where: this.renderer.stages.stage, config: this.levelEmitterConfig});

        // Start emitting
        emitter.updateSpawnPos(this.currentMatch.position.x, this.currentMatch.position.y);
        emitter.playOnceAndDestroy();

        //add to game timer
        this.addToGameTimer(8000);

	    this.match.play();
	    this.incrementScore(1);
	    this.generateNewMatch();
	},

	generateNewMatch: function() {
	    if(this.currentMatch) {
		    graphicsUtils.removeSomethingFromRenderer(this.currentMatch);
	    }

	    var fontSize = 70;
	    var first = mathArrayUtils.getRandomIntInclusive(1, 40);

	    //if this is the first number we ever generate... let's not have it be 2
	    if(!this.currentMatch) {
	        while(first == 2) {
	            first = mathArrayUtils.getRandomIntInclusive(1, 40);
	        }
	    }

	    var firstSprite = graphicsUtils.addSomethingToRenderer('TEX+:' + first.toString(), null, {style: matchStyle, x: this.canvas.width/2, y: this.canvas.height/4});
	    firstSprite.numericalValue = first;
		this.currentMatch = firstSprite;

	},

	updateSequenceBodies: function(value) {

        //shrink all but the last number to achieve a reducing effect of the trailing numbers
        if(this.sequence) {
	        $.each(this.sequence, function(index, body) {
	            if(index < this.sequence.length-1) {
	                $.each(body.renderlings, function(key, sprite) {
	                    sprite.style.fill = ['#527D93'];
	                    sprite.style.fontSize = sprite.style.fontSize - 8;
                        sprite.alpha = sprite.alpha == 1 ? .4 : sprite.alpha -.1;
	                })
	            }
	            else { //slightly dim the 2nd value, but don't fade it
	                $.each(body.renderlings, function(key, sprite) {
	                    sprite.style.fill = ['#08C9CD'];
	                })
	            }
	        }.bind(this))
        }

        //generate new body for the value and set its render props
        var newNumber = Matter.Bodies.circle(0, 0, 20, { restitution: .95, frictionAir: 0});
        newNumber.renderChildren = [{
	        id: mathArrayUtils.uuidv4(),
	        data: 'TEX+:' + value.toString(),
	        options: {style: $.extend({}, sequenceStyle)},
	        offset: {x: 0, y: 0}
        }]
        newNumber.numericalValue = value;
        newNumber.collisionFilter.group = -1;
        Matter.Body.setPosition(newNumber, {x: this.canvas.width/2+sequenceStyle.fontSize*7/4, y: this.canvas.height/2});

        //initial condition
        if(this.sequence.length < 1) {
            Matter.Body.setPosition(newNumber, {x: this.canvas.width/2, y: this.canvas.height/2});
        }

        //add body to world and to the sequence array
        this.addBody(newNumber);
        this.sequence.push(newNumber);

        //set the velocity of the numbers so the fly leftward.
        var len = this.sequence.length;
        this.newestValue = len > 1 ? this.sequence[this.sequence.length-1] : null;
        $.each(this.sequence, function(index, body) {
            if(len > 1)
                Matter.Body.setVelocity(body, {x: -15, y: 0});
        })

        //disable operating on anything until the numbers are in place
        this.blockOperation = true;
    }

}

game.instructions = ['Use + - x ÷ to manipulate the number sequence and match the given number', 'Negatives become positive (ex: 3 - 5 = 2)', 'Can only divide evenly'];

export default $.extend({}, CommonGameMixin, game);
