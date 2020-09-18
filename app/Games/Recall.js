import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as h from  'howler'
import utils from '@utils/GameUtils.js'
import {CommonGameMixin} from '@core/CommonGameMixin.js'

var targetScore = 1;
var greenScoreStyle = new PIXI.TextStyle({
	    fontFamily: 'Arial',
	    fontSize: 30,
	    fill: ['#b1ff84'],
	    stroke: '#4a1850',
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
		    fontSize: 30,
		    fill: ['#ff00ff'],
		    stroke: '#4a1850',
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
    noBorder: true,
	gameName: 'Recall',
	victoryCondition: {type: 'lives', limit: 5},
	acceptableTints: [/*blue*/ 0x009BFF, /*green*/0xCBCBCB /*red0xFF2300 0xFFFFFF*/, /*purple*/0xCC00BA, /*yellow*/0xCFD511],
	acceptableNumbers: ['1', '1', '2', '2', '3', '3', '4', '4', '5', '5', '6', '7', '8'],
	acceptableCharacters: ['a', 's', 'd', 'f', 'q', 'w', 'e', 'r', 't', 'v', 'c', 'g', 'x', 'Tab'],

	initExtension: function() {
	    this.hit = utils.getSound('nicehit1.wav', {volume: .2, rate: 2});
	    this.hit2 = utils.getSound('nicehit1.wav', {volume: .2, rate: 2.2});
	    this.hit3 = utils.getSound('nicehit1.wav', {volume: .2, rate: 2.4});
	    this.hit4 = utils.getSound('nicehit1.wav', {volume: .2, rate: 2.6});
	    this.hit5 = utils.getSound('nicehit1.wav', {volume: .2, rate: 2.8});
	    this.hits = [this.hit, this.hit2, this.hit3, this.hit4, this.hit5];
	},

	play: function(options) {

	    this.sequences = [];
	    this.wave = 0;
	    this.chain = 0;
	    this.firstLetterOfSomethingActive = false;
	    this.firstLetterOfSomethingWasActive = false;
	    this.lastPosY = 0;
	    this.lastPosY2 = 0;
	    this.lastPosY3 = 0;
	    this.sequenceXVelocity = -1.6;
	    this.wavesElapsed = [];
	    this.newWave(1);

        this.addTimer({name: 'createSequenceTimer', persists: false, timeLimit: 1150, gogogo: true, killsSelf: true, callback: function() {
            this.createSequence();
            if(this.wave > 480) {
                this.newWave(10);
                this.sequenceXVelocity = -3.5;
                this.createSequence();
                this.createSequence();
                this.createSequence();
                if(Math.random() > .5) {
                    this.createSequence();
                }
            } else if(this.wave > 420) {
                this.newWave(9);
                this.createSequence();
                this.createSequence();
                this.createSequence();
            } else if(this.wave > 360) {
                this.sequenceXVelocity = -3.2;
                this.newWave(8);
                this.createSequence();
                if(Math.random() > .5) {
                    this.createSequence();
                    this.createSequence();
                }
            } else if(this.wave > 280) {
                this.newWave(7);
                this.createSequence();
            } else if(this.wave > 220) {
                this.sequenceXVelocity = -2.9;
                this.newWave(6);
                if(this.wave % 2 == 0)
                    this.createSequence();
            } else if(this.wave > 160) {
                this.newWave(5);
                if(this.wave % 3 == 0)
                    this.createSequence();
            } else if(this.wave > 100) {
                this.sequenceXVelocity = -2.4;
                this.newWave(4);
                if(this.wave % 4 == 0)
                    this.createSequence();
            } else if(this.wave > 40) {
                this.newWave(3);
                this.sequenceXVelocity = -1.9;
                if(this.wave % 5 == 0)
                    this.createSequence();
            } else if(this.wave > 15) {
                this.newWave(2);
                if(this.wave % 6 == 0)
                    this.createSequence();
            }
            this.wave++;
	    }.bind(this)});

	    $('body').on('keydown.recall', function( event ) {

	        if(this.firstLetterOfSomethingActive) {
	            this.firstLetterOfSomethingWasActive = true;
	            this.firstLetterOfSomethingActive = false;
	        }
	        var killedSomething = false;
            this.sequences = $.each(this.sequences, function(index, seq) {
                if(!seq.dead) {
	                if(!seq.firstCompleted) {
	                    if(seq.first == event.key) {
	                        seq.firstCompleted = true;
	                        this.firstLetterOfSomethingActive = true;
	                        seq.renderlings.first.style = redScoreStyle;
	                    }
	                } else if(seq.second == event.key) {
                        seq.dead = true;
                        Matter.Body.setVelocity(seq, {x: (3 + Math.random() * 3) * (Math.random() > .5 ? -1 : 1), y: (3 + Math.random() * 3) * (Math.random() > .5 ? -1 : 1)})
                        Matter.Body.setAngularVelocity(seq, 2 + Math.random() * 3);
                        seq.renderlings.second.style = redScoreStyle;
                        this.incrementScore(1);
                        killedSomething = true;
                        this.chain += 1;
                        if(this.chain > 5) this.chain = 1;

                        this.hits[this.chain-1].play();
                        if(this.chain == 5) {
                            this.floatText("+1", seq.position);
                            this.incrementScore(1);
                        }
                    } else {
                        seq.firstCompleted = false;
                        seq.renderlings.first.style = greenScoreStyle;
                    }
                }
            }.bind(this));

            if((!this.firstLetterOfSomethingActive && !this.firstLetterOfSomethingWasActive) || (!killedSomething && this.firstLetterOfSomethingWasActive)) {
                this.firstLetterOfSomethingActive = false;
                this.chain = 0;
            }

            if(killedSomething) {
                this.firstLetterOfSomethingActive = false;
                $.each(this.sequences, function(index, seq) {
                    if(!seq.dead) {
	                    seq.firstCompleted = false;
                        seq.renderlings.first.style = greenScoreStyle;
                    }
                })
            }

            this.firstLetterOfSomethingWasActive = false;
	    }.bind(this));

	    this.addTickCallback(function() {
	        this.sequences = $.grep(this.sequences, function(seq, index) {
	            if(this.bodyRanOffStage(seq)) {
	                if(!seq.dead) {
	                    this.addLives(-1);
	                }
	                this.removeBody(seq);
	                return false;
                } else {
                    return true;
                }
	        }.bind(this))
         }.bind(this))
	},

	newWave: function(wave) {
	    if(!this.wavesElapsed.includes(wave)) {
	        this.signalNewWave((this.wavesElapsed.length+1));
	        this.wavesElapsed.push(wave);
	    }
	},

	createSequence: function() {
	    var first = this.acceptableNumbers[this.getRandomIntInclusive(0, this.acceptableNumbers.length-1)];
	    var second = this.acceptableCharacters.concat([first, first, first, first, first, first, first])[this.getRandomIntInclusive(0, this.acceptableCharacters.length + 7 - 1)];

	    var seq = Matter.Bodies.circle(0, 0, 20, { restitution: .95, frictionAir: 0});
	    seq.first = first;
	    seq.second = second;
	    seq.renderChildren = [{
	        id: 'first',
	        data: 'TEXT:' + first,
	        options: {style: greenScoreStyle},
	        offset: {x: 0, y: 0}
        }, {
            id: 'second',
	        data: 'TEXT:' + second,
	        options: {style: greenScoreStyle},
	        offset: {x: (second == 'Tab' ? 34 : (second == 'w' ? 20 : 18)) - (first == '1' || first == 'f' || first == 'r' || first == 't' ? 2 : 0), y: 0}
        }]

        seq.collisionFilter.group = -1;

        //figure out y position (if multiple sequences are made at once, make sure they don't overlap)
        var buffer = 40;
        var posY = 0;
        do {
            posY = 40 + (Math.random() * (this.getCanvasHeight() - 80))
        }
        while(Math.abs(posY - this.lastPosY) < buffer || Math.abs(posY - this.lastPosY2) < buffer || Math.abs(posY - this.lastPosY3) < buffer);
        this.lastPosY3 = this.lastPosY2;
        this.lastPosY2 = this.lastPosY;
        this.lastPosY = posY;

        Matter.Body.setPosition(seq, {x: this.getCanvasWidth() + 10, y: posY});
        Matter.Body.setVelocity(seq, {x: this.sequenceXVelocity, y: 0});
        this.sequences.push(seq);
        this.addBody(seq);
	},

	resetGameExtension: function() {
	    this.level = 0;
	},

	nukeExtension: function() {
	    $('body').off('keydown.recall');
	}
}

/*
 * Options to for the game starter
 */
game.worldOptions = {
		background: {image: 'Ice', scale: {x: 1, y: 1}},
	        width: 1200,
	        height: 600,
	        gravity: 0,
	       };

game.instructions = ['Type the key-sequences before they leave the screen', 'Five correct in a row gives one bonus point'];

export default $.extend({}, CommonGameMixin, game);
