import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import styles from '@utils/Styles.js'
import {globals} from '@core/Fundamental/GlobalState.js'

var pictureStyles = {
    FADE_IN: "FADE_IN"
}

/*
 * options {
 *   actor
 *   text
 *   textBeginPosition
 *   letterSpeed
 *   pauseAtPeriod
 *   stallInfinite
 *   style
 *   picture
 *   pictureDelay
 *   pictureStyle
 *   picturePosition
 * }
 */
var Dialogue = function Dialogue(options) {
    var defaults = {
        textBeginPosition: {x: 50, y: 75},
        titleBeginPosition: {x: null, y: 40},
        backgroundBox: false,
        actorLetterSpeed: 40,
        letterSpeed: 80,
        delayAfterEnd: 1500,
        pauseAtPeriod: true,
        leftSpaceBuffer: 0,
        actorIdleTime: 0,
        style: styles.dialogueStyle,
        actorStyle: styles.dialogueActorStyle,
        titleStyle: styles.dialogueTitleStyle,
        pictureDelay: 0,
        pictureStyle: pictureStyles.FADE_IN,
        picturePosition: {x: gameUtils.getPlayableWidth()*4/5, y: gameUtils.getCanvasHeight()/2}
    }
    $.extend(this, defaults, options);

    if(this.interrupt) {
        this.letterSpeed = 30;
    }

    if(this.pauseAfterWord && !Array.isArray(this.pauseAfterWord)) {
        this.pauseAfterWord = [this.pauseAfterWord];
    }

    this.keypressSound = gameUtils.getSound('keypress1.wav', {volume: .3, rate: 1});

    //setup text vars
    this.actorText = this.actor ? this.actor + ": " : "";

    this.play = function(options) {
        if(this.killed) return;

        var spaceBuffer = "";
        if(this.leftSpaceBuffer) {
            for(var c = 0; c < this.leftSpaceBuffer; c++) {
                spaceBuffer += " ";
            }
        } else {
            for(var c = 0; c < this.actorText.length; c++) {
                spaceBuffer += " ";
            }
        }
        this.text = spaceBuffer + this.text;

        options = options || {};
        if(this.title) {
            this.realizedText = graphicsUtils.createDisplayObject("TEX+:"+this.text, {position: this.titleBeginPosition, style: this.titleStyle, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedText.position.y += (options.yOffset || 0);
            this.realizedText.position.x = (gameUtils.getPlayableWidth()/2-this.realizedText.width/2);
            this.fullTextWidth = this.realizedText.width;
            this.fullTextHeight = this.realizedText.height;
        } else {
            this.realizedText = graphicsUtils.createDisplayObject("TEX+:"+this.text, {position: this.textBeginPosition, style: this.style, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedText.position.y += (options.yOffset || 0);
            this.fullTextWidth = this.realizedText.width;
            this.fullTextHeight = this.realizedText.height;
            this.realizedActorText = graphicsUtils.createDisplayObject("TEX+:", {position: this.textBeginPosition, style: this.actorStyle, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedActorText.position.y += (options.yOffset || 0);
        }
        this.realizedText.resolution = 2;

        if(this.picture) {
          this.realizedPicture = graphicsUtils.createDisplayObject(this.picture, {alpha: 0, position: this.picturePosition, where: "hudText"});
          this.realizedPictureBorder = graphicsUtils.createDisplayObject("CinemaBorder", {alpha: 0, position: this.picturePosition, where: "hudText"});
          this.realizedPictureBorder.tint = 0x919191;
        }

        if(this.backgroundBox) {
            this.backgroundBox = graphicsUtils.addSomethingToRenderer('TintableSquare', {where: 'hudOne', position: this.realizedText.position, anchor: {x: 0, y: 0}});
            graphicsUtils.makeSpriteSize(this.backgroundBox, {x: this.fullTextWidth, y: this.fullTextHeight});
            this.backgroundBox.tint = 0x181618;
        }

        var currentLetter = 0;
        var picRealized = false;
        var d = this;
        this.textTimer = globals.currentGame.addTimer({name: 'dialogTap', gogogo: true, timeLimit: this.actorLetterSpeed,
        callback: function() {

            if(d.pictureWordTrigger && d.text.substring(currentLetter, currentLetter+d.pictureWordTrigger.length) == d.pictureWordTrigger) {
                d.pictureTriggeredFromWord = true;
            }

            //speed change
            if(d.speedChangeAfterWord && d.text.substring(currentLetter-d.speedChangeAfterWord.word.length, currentLetter) == d.speedChangeAfterWord.word) {
                d.letterSpeed = d.speedChangeAfterWord.speed;
            }

            //fade in picture
            var fadeOverLetters = 5;
            if((d.pictureDelay <= this.totalElapsedTime && d.realizedPicture && !d.pictureWordTrigger) || d.pictureTriggeredFromWord) {
                graphicsUtils.addOrShowDisplayObject(d.realizedPicture);
                graphicsUtils.addOrShowDisplayObject(d.realizedPictureBorder);
                if(d.realizedPicture.alpha < 1.0) {
                  d.realizedPicture.alpha += 1/fadeOverLetters;
                  d.realizedPictureBorder.alpha += 1/fadeOverLetters;
                }
            }

            graphicsUtils.addOrShowDisplayObject(d.realizedText);
            if(currentLetter < d.text.length) {
                //if our actor is fulfilled, let's see if our actor needs to idle before continuing to the dialogue
                if(d.realizedActorText && d.actorIdleTime && currentLetter == d.actorText.length-1) {
                    if(!d.actorIdlingBegan) {
                        d.actorIdleBeats = d.actorIdleTime*2;
                        d.actorIdlingBegan = true;
                    }
                    var thinkingText = '';
                    if(d.actorIdleBeats % 2 == 0) {
                        thinkingText = '.';
                        d.actorIdleTime--;
                    }

                    d.actorIdleBeats--;
                    d.realizedText.text = d.text.substring(0, currentLetter) + thinkingText;
                    this.timeLimit = d.actorIdleSpeed || d.letterSpeed;
                    return;
                }

                //process text
                //first check if we have left space buffer, which will immediately satisfy
                if(currentLetter < d.leftSpaceBuffer) {
                    currentLetter = d.leftSpaceBuffer;
                }
                d.realizedText.text = d.text.substring(0, ++currentLetter);
                for(var i = currentLetter; i < d.text.length; i++) {
                    d.realizedText.text += " ";
                }

                if(d.realizedActorText && currentLetter < d.actorText.length) {
                    graphicsUtils.addOrShowDisplayObject(d.realizedActorText);
                    d.realizedActorText.text = d.actorText.substring(0, currentLetter);
                    d.currentLetterSpeed = d.actorLetterSpeed;
                } else {
                    d.keypressSound.play();
                    this.timeLimit = d.letterSpeed;
                    d.currentLetterSpeed = d.letterSpeed;
                }

                //pause at periods
                if(d.pauseAtPeriod && d.text.substring(currentLetter-1, currentLetter) == '.' && d.text.substring(currentLetter, currentLetter+1) == ' ') {
                    this.timeLimit = d.letterSpeed * 5;
                } else {
                    this.timeLimit = d.currentLetterSpeed;
                }

                //custom pause
                var timer = this;
                if(d.pauseAfterWord) {
                    d.pauseAfterWord.forEach(function(pauseWord) {
                        if(!pauseWord.done && d.text.substring(currentLetter-pauseWord.word.length, currentLetter) == pauseWord.word) {
                            timer.timeLimit = pauseWord.duration;
                            pauseWord.done = true;
                        }
                    })
                }

                if(currentLetter == d.text.length) {
                    d.resolveTime = this.totalElapsedTime + d.delayAfterEnd;
                }
            } else if(!d.stallInfinite && this.totalElapsedTime >= d.resolveTime){
                d.deferred.resolve();
            }
        }})
    };

    this.cleanUp = function() {
        globals.currentGame.invalidateTimer(this.textTimer);
        graphicsUtils.removeSomethingFromRenderer(this.realizedText);
        graphicsUtils.removeSomethingFromRenderer(this.realizedActorText);
        graphicsUtils.removeSomethingFromRenderer(this.realizedPicture);
        graphicsUtils.removeSomethingFromRenderer(this.realizedPictureBorder);
        graphicsUtils.removeSomethingFromRenderer(this.backgroundBox);
        this.keypressSound.unload();
    };

    this.initialize = function() {

    };

    this.kill = function() {
        this.killed = true;
    },

    //this stops the text increment timer
    this.leaveText = function() {
      globals.currentGame.invalidateTimer(this.textTimer);
    }
}

var DialogueChain = function DialogueChain(arrayOfDialogues, options) {
    var defaults = {
        dialogSpacing: 30,
        startDelay: 1000,
    };
    this.arrayOfDialogues = arrayOfDialogues;
    $.extend(this, defaults, options);

    this.play = function() {
        var len = arrayOfDialogues.length;
        var deferreds = [];

        for(var i = 0; i < len; i++) {
            arrayOfDialogues[i].deferred = $.Deferred();
        }

        //setup chain
        for(var j = 0; j < len; j++) {
            let currentDia = arrayOfDialogues[j]
            let nextDia = arrayOfDialogues[j+1]

            //lookback to comprehend continuations
            if(nextDia && nextDia.continuation) {
                nextDia.leftSpaceBuffer = currentDia.actorText.length;
            }

            if(j + 1 < len) {
                currentDia.deferred.done(() => {
                  currentDia.leaveText();
                })
                currentDia.deferred.done(arrayOfDialogues[j+1].play.bind(nextDia, {yOffset: this.dialogSpacing * (j+1)}))
            } else {
                if(options.done) {
                    currentDia.deferred.done(options.done);
                }
            }
        }

        //start the chain
        gameUtils.doSomethingAfterDuration(() => {
            arrayOfDialogues[0].play()
        }, this.startDelay);
    },

    this.cleanUp = function() {
        //kill all dialogue objects so they won't play
        this.arrayOfDialogues.forEach((dialogue) => {
            dialogue.kill();
        });
        this.arrayOfDialogues.forEach((dialogue) => {
            dialogue.cleanUp();
        });
    };

    this.initialize = function() {

    };
}

export {Dialogue, DialogueChain}
