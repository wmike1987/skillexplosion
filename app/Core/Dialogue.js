import * as Matter from 'matter-js'
import * as $ from 'jquery'
import utils from '@utils/GameUtils.js'
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
        textBeginPosition: {x: 50, y: 50},
        titleBeginPosition: {x: null, y: 40},
        letterSpeed: 80,
        delayAfterEnd: 1000,
        pauseAtPeriod: true,
        // blinkLastLetter: true,
        blinksThenDone: 3,
        style: styles.dialogueStyle,
        actorStyle: styles.dialogueActorStyle,
        titleStyle: styles.dialogueTitleStyle,
        pictureDelay: 0,
        pictureStyle: pictureStyles.FADE_IN,
        picturePosition: {x: utils.getPlayableWidth()*3/4, y: utils.getCanvasHeight()/2}
    }
    $.extend(this, defaults, options);

    //setup text vars
    this.actorText = this.actor ? this.actor + ": " : "";
    var spaceBuffer = "";
    for(var c = 0; c < this.actorText.length; c++) {
        spaceBuffer += " ";
    }
    this.text = spaceBuffer + this.text;

    this.keypressSound = utils.getSound('keypress1.wav', {volume: .3, rate: 1});

    this.play = function(options) {
        options = options || {};
        if(this.title) {
            this.realizedText = utils.createDisplayObject("TEXT: ", {position: this.titleBeginPosition, style: this.titleStyle, where: "hudText", anchor: {x: .5, y: .5}});
            this.realizedText.position.y += (options.yOffset || 0);
            this.realizedText.position.x = (utils.getPlayableWidth()/2);
        } else {
            this.realizedText = utils.createDisplayObject("TEXT: ", {position: this.textBeginPosition, style: this.style, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedText.position.y += (options.yOffset || 0);

            this.realizedActorText = utils.createDisplayObject("TEXT: ", {position: this.textBeginPosition, style: this.actorStyle, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedActorText.position.y += (options.yOffset || 0);
        }
        this.realizedText.resolution = 2;

        if(this.picture) {
          this.realizedPicture = utils.createDisplayObject(this.picture, {alpha: 0, position: this.picturePosition, where: "hudText"});
        }

        var currentLetter = 0;
        var picRealized = false;
        var d = this;
        var currentBlink = 0;
        this.textTimer = globals.currentGame.addTimer({name: 'dialogTap', gogogo: true, timeLimit: this.letterSpeed,
        callback: function() {
            var fadeOverLetters = d.text.length*3/4;

            //fade in picture - let's fade in over the first 5 letters
            if(d.pictureDelay <= this.totalElapsedTime && d.realizedPicture) {
                utils.addOrShowDisplayObject(d.realizedPicture);
                if(d.realizedPicture.alpha < 1.0) {
                  d.realizedPicture.alpha += 1/fadeOverLetters;
                }
            }

            utils.addOrShowDisplayObject(d.realizedText);
            if(currentLetter < d.text.length) {
                d.realizedText.text = d.text.substring(0, ++currentLetter);
                d.keypressSound.play();
                for(var i = currentLetter; i < d.text.length; i++) {
                    d.realizedText.text += " ";
                }

                if(d.realizedActorText && currentLetter < d.actorText.length) {
                    utils.addOrShowDisplayObject(d.realizedActorText);
                    d.realizedActorText.text = d.actorText.substring(0, currentLetter);
                }

                //pause at periods
                if(d.pauseAtPeriod && d.text.substring(currentLetter-1, currentLetter) == '.' && d.text.substring(currentLetter, currentLetter+1) == ' ') {
                    this.timeLimit = d.letterSpeed * 5;
                } else {
                    this.timeLimit = d.letterSpeed;
                }

                if(currentLetter == d.text.length) {
                    d.resolveTime = this.totalElapsedTime + d.delayAfterEnd;
                }
            // } else if(d.blinkLastLetter && currentBlink < d.blinksThenDone){
            //     this.timeLimit = d.letterSpeed * 5;
            //     if(currentBlink % 2 == 0) {
            //         d.realizedText.text = d.text.substring(0, currentLetter-1)
            //         currentBlink++;
            //     } else {
            //         d.realizedText.text = d.text.substring(0, currentLetter)
            //         currentBlink++;
            //     }
        } else if(!d.stallInfinite && this.totalElapsedTime >= d.resolveTime){
                d.deferred.resolve();
            }
        }})
    };

    this.cleanUp = function() {
        globals.currentGame.invalidateTimer(this.textTimer);
        utils.removeSomethingFromRenderer(this.realizedText);
        utils.removeSomethingFromRenderer(this.realizedActorText);
        utils.removeSomethingFromRenderer(this.realizedPicture);
    };

    this.initialize = function() {

    };

    this.leaveText = function() {
      globals.currentGame.invalidateTimer(this.textTimer);
      utils.removeSomethingFromRenderer(this.realizedPicture);
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
        utils.doSomethingAfterDuration(() => {
            arrayOfDialogues[0].play()
        }, this.startDelay);
    }

    this.cleanUp = function() {
        this.arrayOfDialogues.forEach((dialogue) => {
            dialogue.cleanUp();
        });
    };

    this.initialize = function() {

    };
}

export {Dialogue, DialogueChain}
