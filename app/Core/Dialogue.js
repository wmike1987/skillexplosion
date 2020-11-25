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
 *   blinkLastLetter
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
        actorLetterSpeed: 40,
        letterSpeed: 80,
        delayAfterEnd: 1500,
        pauseAtPeriod: true,
        // blinkLastLetter: true,
        blinksThenDone: 3,
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

    //setup text vars
    this.actorText = this.actor ? this.actor + ": " : "";
    var spaceBuffer = "";
    for(var c = 0; c < this.actorText.length; c++) {
        spaceBuffer += " ";
    }
    this.text = spaceBuffer + this.text;

    this.keypressSound = gameUtils.getSound('keypress1.wav', {volume: .3, rate: 1});

    this.play = function(options) {
        if(this.killed) return;
        
        options = options || {};
        if(this.title) {
            this.realizedText = graphicsUtils.createDisplayObject("TEXT:"+this.text, {position: this.titleBeginPosition, style: this.titleStyle, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedText.position.y += (options.yOffset || 0);
            this.realizedText.position.x = (gameUtils.getPlayableWidth()/2-this.realizedText.width/2);
        } else {
            this.realizedText = graphicsUtils.createDisplayObject("TEXT: ", {position: this.textBeginPosition, style: this.style, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedText.position.y += (options.yOffset || 0);

            this.realizedActorText = graphicsUtils.createDisplayObject("TEXT: ", {position: this.textBeginPosition, style: this.actorStyle, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedActorText.position.y += (options.yOffset || 0);
        }
        this.realizedText.resolution = 2;

        if(this.picture) {
          this.realizedPicture = graphicsUtils.createDisplayObject(this.picture, {alpha: 0, position: this.picturePosition, where: "hudText"});
          this.realizedPictureBorder = graphicsUtils.createDisplayObject("CinemaBorder", {alpha: 0, position: this.picturePosition, where: "hudText"});
          this.realizedPictureBorder.tint = 0x919191;
        }

        var currentLetter = 0;
        var picRealized = false;
        var d = this;
        var currentBlink = 0;
        this.textTimer = globals.currentGame.addTimer({name: 'dialogTap', gogogo: true, timeLimit: this.actorLetterSpeed,
        callback: function() {
            var fadeOverLetters = 5;

            if(d.pictureWordTrigger && d.text.substring(currentLetter, currentLetter+d.pictureWordTrigger.length) == d.pictureWordTrigger) {
                d.pictureTriggeredFromWord = true;
            }

            //fade in picture
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
