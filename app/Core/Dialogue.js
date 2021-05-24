import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import styles from '@utils/Styles.js';
import {globals, keyStates} from '@core/Fundamental/GlobalState.js';

var pictureStyles = {
    FADE_IN: "FADE_IN"
};

/*
 * options {
 *   actor
 *   text
 *   textBeginPosition
 *   letterSpeed
 *   pauseAtPeriods
 *   style
 *   picture
 *   pictureDelay
 *   pictureStyle
 *   picturePosition
 * }
 */
var Dialogue = function Dialogue(options) {
    var defaults = {
        text: '',
        actorText: '',
        textBeginPosition: {x: 50, y: 75},
        titleBeginPosition: {x: null, y: 40},
        backgroundBox: false,
        actorLetterSpeed: 40,
        letterSpeed: 80,
        delayAfterEnd: 1500,
        pauseAtPeriods: true,
        pauseAtCommas: true,
        leftSpaceBuffer: 0,
        actorIdleTime: 0,
        style: options.isTask ? styles.taskDialogue : (options.isInfo ? styles.infoDialogue : styles.dialogueStyle),
        actionStyle: styles.actionStyle,
        actorStyle: styles.dialogueActorStyle,
        titleStyle: styles.dialogueTitleStyle,
        pictureDelay: 0,
        pictureStyle: pictureStyles.FADE_IN,
        picturePosition: {x: gameUtils.getPlayableWidth()*4/5, y: gameUtils.getCanvasHeight()/2},
        pictureFadeSpeed: 5, //this is measured in letters since we approach opache per callback of the text timer
        picutreOffset: {x: 0, y: 0},
    };
    $.extend(this, defaults, options);

    if(this.interrupt) {
        this.letterSpeed = 30;
    }

    if(this.pauseAfterWord && !Array.isArray(this.pauseAfterWord)) {
        this.pauseAfterWord = [this.pauseAfterWord];
    }

    this.keypressSound = gameUtils.getSound('keypress1.wav', {volume: 0.25, rate: 1});

    //pre-configure task settings
    if(this.isTask) {
        this.actor = "Task";
        this.actorTint = 0x159500;
        this.delayAfterEnd = 0;
        this.letterSpeed = 30;
        this.fadeOutAfterDone = true;
    } else if(this.isInfo) {
        this.actor = "Info";
        this.actorTint = 0xffffff;
        this.letterSpeed = 30;
    }

    //Establish actor text at creation time since it's used in continuations
    this.actorText = this.actor ? this.actor + ": " : "";

    //Upon play, we'll have a bit more info from having built the chain, so we need to setup things in here too
    this.play = function(options) {
        if(this.killed || this.preventAutoStart) return;

        if(this.isTask) {
            this.preventAutoEnd = !this.isContinuing;
            this.completeTask = function() {
                if(!this.isContinuing) {
                    this.speedUp();
                    this.fullyShownCallback = () => {
                        this.realizedActorText.text = "";
                        this.realizedText.text = "Excellent";
                        graphicsUtils.makeSpriteSize(this.backgroundBox, {x: this.realizedText.width, y: this.realizedText.height});
                        graphicsUtils.flashSprite({sprite: this.realizedText, duration: 40, pauseDurationAtEnds: 40, times: 4, toColor: 0x23afeb, onEnd: () => {
                            this.realizedText.tint = 0x23afeb;
                        }});
                    };
                }
            };
        }

        options = options || {};

        //Create the left space buffer (either explicitly defined or the actor text width)
        var spaceBuffer = "";
        if(this.leftSpaceBuffer) {
            for(let c = 0; c < this.leftSpaceBuffer; c++) {
                spaceBuffer += " ";
            }
        } else {
            for(let c = 0; c < this.actorText.length; c++) {
                spaceBuffer += " ";
            }
        }

        //Realize text
        if(this.title) {
            this.realizedText = graphicsUtils.createDisplayObject("TEX+:"+this.text, {position: this.titleBeginPosition, style: this.titleStyle, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedText.position.y += (options.yOffset || 0);
            this.realizedText.position.x = (gameUtils.getPlayableWidth()/2-this.realizedText.width/2);
            this.fullTextWidth = this.realizedText.width;
            this.fullTextHeight = this.realizedText.height;
        } else /*we are a main piece of text*/{
            this.text = spaceBuffer + this.text;
            this.realizedText = graphicsUtils.createDisplayObject("TEX+:"+this.text, {position: this.textBeginPosition, style: this.style, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedText.position.y += (options.yOffset || 0);
            this.fullTextWidth = this.realizedText.width;
            this.fullTextHeight = this.realizedText.height;
            this.realizedActorText = graphicsUtils.createDisplayObject("TEX+:", {position: this.textBeginPosition, style: this.actorStyle, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedActorText.position.y += (options.yOffset || 0);
            if(this.actorTint) {
                this.realizedActorText.tint = this.actorTint;
            }
        }

        //create action text if specified
        if(this.actionText) {
            if(this.text.trim() == '') {
                this.delayAfterEnd = 300;
            }
            this.actionText.word = spaceBuffer + this.actionText.word;
            this.actionTextState = {started: false, done: false};
            this.realizedActionText = graphicsUtils.createDisplayObject("TEX+:"+this.actionText.word, {position: this.textBeginPosition, style: this.actionStyle, where: "hudText", anchor: {x: 0, y: 0}});
            this.realizedActionText.alpha = 0;
            this.realizedActionText.position.y += (options.yOffset || 0);
            this.fullActionTextWidth = this.realizedActionText.width;
            this.fullActionTextHeight = this.realizedActionText.height;
        }
        this.realizedText.resolution = 2;

        if(this.picture) {
            var picPosition = mathArrayUtils.clonePosition(this.picturePosition, this.pictureOffset);
            this.realizedPicture = graphicsUtils.createDisplayObject(this.picture, {alpha: 0, position: picPosition, where: "hudText"});
            this.realizedPictureBorder = graphicsUtils.createDisplayObject("CinemaBorder", {alpha: 0, position: picPosition, where: "hudText"});
            graphicsUtils.makeSpriteSize(this.realizedPictureBorder, {x: this.realizedPicture.width, y: this.realizedPicture.height});
            if(this.pictureSize) {
                graphicsUtils.makeSpriteSize(this.realizedPictureBorder, this.pictureSize);
            }
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
        var generalTriggering = false;
        d.dialogueStarted = false;
        this.textTimer = globals.currentGame.addTimer({name: 'dialogTap'+mathArrayUtils.getId(), gogogo: true, timeLimit: this.actorLetterSpeed,
        callback: function() {
            if(d.paused) return;

            if(!d.dialogueStarted) {
                d.dialogueStarted = true;
                if(d.onStart) {
                    d.onStart();
                }
            }
            if(d.pictureWordTrigger && d.text.substring(currentLetter, currentLetter+d.pictureWordTrigger.length) == d.pictureWordTrigger) {
                d.pictureTriggeredFromWord = true;
            }

            if(!generalTriggering && d.generalWordTriggerCallback) {
                if(d.generalWordTrigger) {
                    if(d.text.substring(currentLetter, currentLetter+d.generalWordTrigger.length) == d.generalWordTrigger) {
                        generalTriggering = true;
                        d.generalWordTriggerCallback();
                    }
                } else {
                    generalTriggering = true;
                    d.generalWordTriggerCallback();
                }
            }

            //speed change
            if(d.speedChangeAfterWord && d.text.substring(currentLetter-d.speedChangeAfterWord.word.length, currentLetter) == d.speedChangeAfterWord.word) {
                d.letterSpeed = d.speedChangeAfterWord.speed;
            }

            //fade in picture
            if((d.pictureDelay <= this.totalElapsedTime && d.realizedPicture && !d.pictureWordTrigger) ||
                d.pictureTriggeredFromWord ||
               (d.realizedPicture && d.skipped))
            {
                graphicsUtils.addOrShowDisplayObject(d.realizedPicture);
                graphicsUtils.addOrShowDisplayObject(d.realizedPictureBorder);
                if(d.realizedPicture.alpha < 1.0) {
                  d.realizedPicture.alpha += 1/d.pictureFadeSpeed;
                  d.realizedPictureBorder.alpha += 1/d.pictureFadeSpeed;
                  if(d.skipped) {
                      d.realizedPicture.alpha = 1;
                      d.realizedPictureBorder.alpha = 1;
                  }
                }
            }

            graphicsUtils.addOrShowDisplayObject(d.realizedText);
            if(currentLetter < d.text.length) {
                var actorTextDone = currentLetter == d.actorText.length-1;
                //if our actor is fulfilled, let's see if our actor needs to idle before continuing to the dialogue
                if(d.realizedActorText && d.actorIdleTime && actorTextDone) {
                    if(!d.actorIdlingBegan) {
                        d.actorIdleBeats = d.actorIdleTime*2;
                        d.actorIdlingBegan = true;
                    }
                    var thinkingText = ' .';
                    if(d.actorIdleBeats % 2 == 0) {
                        thinkingText = '';
                        d.actorIdleTime--;
                    }

                    d.actorIdleBeats--;
                    d.realizedText.text = d.text.substring(0, currentLetter) + thinkingText;
                    this.timeLimit = d.actorIdleSpeed || d.letterSpeed;
                    return;
                }

                //let's play our action word if our actor is done
                //handle action text (action text will occur first and then disappear over time, releasing the dialogue text upon totally fading)
                if(actorTextDone && d.actionTextState && !d.actionTextState.done) {
                    if(!d.actionTextState.started) {
                        d.actionTextState.started = true;

                        //default is to fade in then back out
                        var fadingIn = true;
                        var runs = 2;
                        var duration = d.actionText.actionDuration ? d.actionText.actionDuration/2 : 2000;
                        var top = 1.5;

                        if(d.actionText.fadeOutOnly) {
                            d.realizedActionText.alpha = 1.0;
                            runs = 1;
                            duration = d.actionText.actionDuration;
                            fadingIn = false;
                            top = 1.0;
                        }

                        var minAlpha = 0;
                        if(d.actionText.leaveTrace) {
                            minAlpha = 0.2;
                        }
                        d.actionTextTimer = globals.currentGame.addTimer({name: 'dialogueActionFade:' + mathArrayUtils.getId(), runs: runs, killsSelf: true, timeLimit: duration,
                            tickCallback: function(delta) {
                                if(fadingIn) {
                                    d.realizedActionText.alpha = this.percentDone * top;
                                } else {
                                    d.realizedActionText.alpha = Math.max(minAlpha, top-(this.percentDone*top));
                                }
                            },
                            callback: function() {
                                fadingIn = !fadingIn;
                            },
                            totallyDoneCallback: function() {
                                d.realizedActionText.alpha = minAlpha;
                                d.actionTextState.done = true;
                            }
                        });
                        graphicsUtils.addOrShowDisplayObject(d.realizedActionText);
                    }
                    return;
                }

                //process text
                //first check if we have left space buffer, which we'll immediately satisfy
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
                    if(d.text.substring(currentLetter, currentLetter+1) != '') {
                        if(!d.skipSound) {
                            d.keypressSound.play();
                        }
                    }
                    this.timeLimit = d.letterSpeed;
                    d.currentLetterSpeed = d.letterSpeed;
                }

                //pause at periods/commas, this includes 'end periods' even in ellipses.
                if(d.pauseAtPeriods && d.text.substring(currentLetter-1, currentLetter) == '.' && d.text.substring(currentLetter, currentLetter+1) == ' ') {
                    this.timeLimit = d.letterSpeed * 5;
                } else if(d.pauseAtCommas && d.text.substring(currentLetter-1, currentLetter) == ',' && d.text.substring(currentLetter, currentLetter+1) == ' ') {
                    this.timeLimit = d.letterSpeed * 3;
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
                    });
                }

                if(currentLetter == d.text.length) {
                    d.resolveTime = this.totalElapsedTime + d.delayAfterEnd;
                    if(d.skipped) {
                        d.resolveTime = 0; //this basically voids any delayAfterEnd
                    }
                }
            } else if(this.totalElapsedTime >= d.resolveTime){
                if(d.fullyShownCallback && !d.alreadyTriggeredFullyShown) {
                    d.alreadyTriggeredFullyShown = true;
                    d.fullyShownCallback();
                }
                if(d.next && d.next.preventAutoStart) {
                    return;
                }
                if(d.preventAutoEnd) {
                    return;
                }
                if(d.fadeOutAfterDone && !d.isContinuing) {
                    d.realizedText.alpha = 0.5;
                    d.realizedActorText.alpha = 0.5;
                    d.backgroundBox.alpha = 0.5;
                }
                d.deferred.resolve();
            }
        }});
    };

    this.cleanUp = function() {
        globals.currentGame.invalidateTimer(this.textTimer);
        graphicsUtils.removeSomethingFromRenderer(this.realizedText);
        graphicsUtils.removeSomethingFromRenderer(this.realizedActorText);
        graphicsUtils.removeSomethingFromRenderer(this.realizedPicture);
        graphicsUtils.removeSomethingFromRenderer(this.realizedPictureBorder);
        graphicsUtils.removeSomethingFromRenderer(this.backgroundBox);
        graphicsUtils.removeSomethingFromRenderer(this.realizedActionText);
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
  };

    this.speedUp = function(doneCallback) {
        if(!this.dialogueStarted) return;
        this.skipped = true;
        this.resolveTime = 0;
        this.textTimer.skipToEnd = true;
        if(this.actionTextTimer) {
            this.actionTextTimer.skipToEnd = true;
        }
        this.skipSound = true;
    };
};

var DialogueChain = function DialogueChain(arrayOfDialogues, options) {
    var defaults = {
        dialogSpacing: 30,
        startDelay: 1000,
    };

    this.id = mathArrayUtils.getId();
    this.arrayOfDialogues = arrayOfDialogues;
    $.extend(this, defaults, options);

    this.play = function() {
        var len = arrayOfDialogues.length;
        var deferreds = [];

        for(var i = 0; i < len; i++) {
            arrayOfDialogues[i].deferred = $.Deferred();
        }

        //setup chain
        var currentBreak = 0;
        for(var j = 0; j < len; j++) {
            let currentIndex = j;
            let nextIndex = j+1;
            let currentDia = arrayOfDialogues[j];
            let nextDia = arrayOfDialogues[nextIndex];

            currentDia.next = nextDia;

            //lookback to comprehend continuations
            if(nextDia && nextDia.continuation) {
                currentDia.isContinuing = true;
                nextDia.leftSpaceBuffer = currentDia.actorText.length;
            }

            if(j + 1 < len) {
                currentDia.deferred.done(() => {
                currentDia.leaveText();
                });

                //if our current dialogue is a break, set current break
                if(currentDia.newBreak) {
                    currentBreak = currentIndex;
                }

                //determine the location of the next dialogue
                let yOffset = this.dialogSpacing * (j - currentBreak + 1);

                currentDia.deferred.done(() => {
                    if(nextDia.newBreak) {
                        //if the next dialogue is breaking, determine the location
                        yOffset = this.dialogSpacing * (0);

                        //when we play a next, breaking dialogue, cleanup previous dialogues
                        this.arrayOfDialogues.forEach((dialogue, index) => {
                            if(index < nextIndex) {
                                dialogue.cleanUp();
                            }
                        });
                    }
                    nextDia.play({yOffset: yOffset});
                });
                currentDia.deferred.done(function() {
                    this.currentDia = nextDia;
                }.bind(this));
            } else {
                if(this.done) {
                    this.isDone = true;
                    currentDia.deferred.done(this.done);
                }
            }
        }

        //start the chain
        this.currentDia = arrayOfDialogues[0];
        gameUtils.doSomethingAfterDuration(() => {
            arrayOfDialogues[0].play();
        }, this.startDelay);

        //escape to speed up current line
        $('body').on('keydown.' + 'speedUpChain:' + this.id, function(event) {
            var key = event.key.toLowerCase();
            if(key == 'escape') {
                if(this.currentDia) {
                    if(this.escapeExtension) {
                        this.escapeExtension();
                    }
                    this.currentDia.speedUp();
                }
            }
        }.bind(this));
    },

    this.pause = function() {
        this.currentDia.paused = true;
    },

    this.cleanUp = function() {
        //kill all dialogue objects so they won't play
        this.arrayOfDialogues.forEach((dialogue) => {
            dialogue.kill();
        });
        this.arrayOfDialogues.forEach((dialogue) => {
            dialogue.cleanUp();
        });

        if(!this.isDone && this.done) {
            this.done();
        }

        $('body').off('keydown.' + 'speedUpChain:' + this.id);
        $('body').off('keydown.' + 'escapeChain:' + this.id);
    };

    this.initialize = function() {

    };
};

export {Dialogue, DialogueChain};
