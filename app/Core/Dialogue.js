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
        letterSpeed: 10,
        pauseAtPeriod: true,
        blinkLastLetter: true,
        blinksThenDone: 3,
        style: styles.dialogueStyle,
        pictureDelay: 0,
        pictureStyle: pictureStyles.FADE_IN,
        picturePosition: utils.getPlayableWidth()*3/4
    }
    $.extend(this, options, defaults);
    this.text = (this.actor ? this.actor + ": " : "") + this.text;

    this.keypressSound = utils.getSound('keypress1.wav', {volume: .3, rate: 1});

    this.play = function(options) {
        options = options || {};
        var currentLetter = 0;
        this.realizedText = utils.createDisplayObject("TEXT: ", {position: this.textBeginPosition, style: this.style, where: "hudText", anchor: {x: 0, y: 0}});
        this.realizedText.position.y += (options.yOffset || 0);
        this.realizedText.resolution = 2;
        //this.realizedPicture = utils.createDisplayObject("TEXT:", {position: position, where: "hudText", anchor: {x: 0, y: 0}});
        var picRealized = false;
        var d = this;
        var currentBlink = 0;
        this.textTimer = globals.currentGame.addTimer({name: 'dialogTap', gogogo: true, timeLimit: this.letterSpeed,
        callback: function() {
            utils.addOrShowDisplayObject(d.realizedText);
            if(currentLetter < d.text.length) {
                d.realizedText.text = d.text.substring(0, ++currentLetter);
                d.keypressSound.play();
                for(var i = currentLetter; i < d.text.length; i++) {
                    d.realizedText.text += " ";
                }

                //pause at periods
                if(d.pauseAtPeriod && d.text.substring(currentLetter-1, currentLetter) == '.' && d.text.substring(currentLetter, currentLetter+1) == ' ') {
                    this.timeLimit = d.letterSpeed * 5;
                } else {
                    this.timeLimit = d.letterSpeed;
                }
            } else if(d.blinkLastLetter && currentBlink < d.blinksThenDone){
                this.timeLimit = d.letterSpeed * 5;
                if(currentBlink % 2 == 0) {
                    d.realizedText.text = d.text.substring(0, currentLetter-1)
                    currentBlink++;
                } else {
                    d.realizedText.text = d.text.substring(0, currentLetter)
                    currentBlink++;
                }
            } else if(!d.stallInfinite){
                d.deferred.resolve();
            }

            if(d.pictureDelay >= this.timeElapsed && !picRealized) {
                //fade in picture
            }
        }})
    };

    this.cleanUp = function() {
        globals.currentGame.invalidateTimer(this.textTimer);
        utils.removeSomethingFromRenderer(this.realizedText);
    };

    this.initialize = function() {

    };
}

var DialogueChain = function DialogueChain(arrayOfDialogues, options) {
    var defaults = {
        dialogSpacing: 30,
    };
    this.arrayOfDialogues = arrayOfDialogues;
    $.extend(this, options, defaults);

    this.play = function() {
        var len = arrayOfDialogues.length;
        var deferreds = [];

        for(var i = 0; i < len; i++) {
            arrayOfDialogues[i].deferred = $.Deferred();
        }

        //setup chain
        for(var j = 0; j < len; j++) {
            var currentDia = arrayOfDialogues[j]
            var nextDia = arrayOfDialogues[j+1]
            if(j + 1 < len) {
                currentDia.deferred.done(arrayOfDialogues[j+1].play.bind(nextDia, {yOffset: this.dialogSpacing * (j+1)}))
            } else {
                if(options.done) {
                    currentDia.deferred.done(options.done);
                }
            }
        }

        //start the chain
        arrayOfDialogues[0].play()
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
