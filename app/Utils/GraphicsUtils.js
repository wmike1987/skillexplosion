/*
 * Module containing graphics utilities
 */
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import hs from '@utils/HS.js';
import * as $ from 'jquery';
import * as h from 'howler';
import styles from '@utils/Styles.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import gleamShader from '@shaders/GleamShader.js';
import seedrandom from 'seedrandom';
import {
    gameUtils
} from '@utils/UtilityMenu.js';
import {
    mathArrayUtils
} from '@utils/MathArrayUtils.js';

var graphicsUtils = {

    getLayer: function(layerName) {
        return globals.currentGame.renderer.layers[layerName];
    },

    addSomethingToRenderer: function(something, where, options) {
        if ($.type(where) == 'object') {
            options = where;
            where = options.where || options.stage;
        }
        options = options || {};

        var displayObject = null;
        if (something instanceof PIXI.DisplayObject) {
            displayObject = something;
            $.extend(displayObject, options);
        } else {
            displayObject = this.createDisplayObject(something, options);
        }

        globals.currentGame.renderer.addToPixiStage(displayObject, where || displayObject.where);
        return displayObject;
    },

    /*
     * This method is prone to creating memory leaks since we'll create a Sprite but not add
     * it to a stage or a body (sometimes) meaning it won't get cleaned up naturally. Be sure
     * to death pact this to something, attach it to a body, or manually destroy.
     */
    createDisplayObject: function(something, options) {
        options = options || {};

        var displayObject = globals.currentGame.renderer.itsMorphinTime(something, options);

        $.extend(displayObject, options);

        //Default anchor to {.5, .5} if anchor wasn't specified in the options AND
        //if we're not already a real display object. This is so that adding an already
        //created object via addSomethingToRenderer doesn't override the previously set anchor.
        //This means that it's assumed that an already-created object has a relevant anchor.
        if (!options.anchor) {
            displayObject.anchor = {
                x: 0.5,
                y: 0.5
            };
        }
        if (options.filter) {
            options.filter.uniforms.mouse = {
                x: 50,
                y: 50
            };
            options.filter.uniforms.resolution = {
                x: globals.currentGame.canvas.width,
                y: globals.currentGame.canvas.height
            };
            displayObject.filters = [options.filter];
        }

        return displayObject;
    },

    addDisplayObjectToRenderer: function(dobj, where) {
        globals.currentGame.renderer.addToPixiStage(dobj, where || dobj.where);
    },

    changeDisplayObjectStage: function(dobj, where) {
        globals.currentGame.renderer.addToPixiStage(dobj, where);
    },

    //We'll add if needed, and always set visible to true since the intention of this method is to show something
    addOrShowDisplayObject: function(displayObject) {
        if (!displayObject.parent) {
            this.addDisplayObjectToRenderer(displayObject);
        }
        displayObject.visible = true;
        Matter.Events.trigger(displayObject, 'addOrShowDisplayObject');
    },

    hideDisplayObject: function(displayObject) {
        displayObject.visible = false;
        Matter.Events.trigger(displayObject, 'hideDisplayObject');
    },

    makeSpriteSize: function(sprite, size) {
        if (!sprite.texture) return;
        var scaleX = null;
        var scaleY = null;
        if (!size.w && !size.h && size.x && size.y) {
            size.w = size.x;
            size.h = size.y;
        }

        if (size.w) {
            scaleX = size.w / sprite.texture.width;
            scaleY = size.h / sprite.texture.height;
        } else {
            scaleX = size / sprite.texture.width;
        }
        sprite.scale = {
            x: scaleX,
            y: scaleY || scaleX
        };
        return sprite.scale;
    },

    getInvertedSpritePosition: function(sprite) {
        var invertedY = gameUtils.getCanvasHeight() - sprite.position.y;
        return {
            x: sprite.position.x,
            y: invertedY
        };
    },

    pointToSomethingWithArrow: function(something, yOffset, arrowScale) {
        if (!something || something._destroyed) {
            return;
        }

        arrowScale = arrowScale || 1.0;
        yOffset = yOffset || 0.0;
        var downArrow = graphicsUtils.addSomethingToRenderer('DownArrow', 'hudOne', {
            scale: {
                x: 1.00 * arrowScale,
                y: 1.00 * arrowScale
            }
        });
        downArrow.sortYOffset = 5000;
        downArrow.position = mathArrayUtils.clonePosition(something.position, {
            y: yOffset - 2.0 - downArrow.height / 2.0
        });
        graphicsUtils.flashSprite({
            sprite: downArrow,
            duration: 200,
            pauseDurationAtEnds: 250,
            times: 999
        });
        return downArrow;
    },

    removeSomethingFromRenderer: function(something, where) {
        if (!something) return;

        //harmless detach, just in case... "harmless"
        gameUtils.detachSomethingFromBody(something);

        //full undeath pact
        gameUtils.fullUndeathPact(something);

        // Two cases
        // 1) we don't have a parent
        //   a) either we were created but not added
        //   b) or we were previously removed, but are being removed again (should be noop -- this is caught by the _destroyed flag)
        if (!something.parent) {
            if (something.destroy && !something._destroyed) {
                something.destroy();
                Matter.Events.trigger(something, 'destroy');
            }
        } else {
            // 2) we are alive and well and want to be destroyed
            where = where || something.myLayer || 'stage';
            globals.currentGame.renderer.removeFromPixiStage(something, where);
            Matter.Events.trigger(something, 'destroy');
        }
    },

    latchDisplayObjectOnto: function(options) {
        options = Object.assign({
            positionUponShow: false,
            positionOffset: {
                x: 0,
                y: 0
            }
        }, options);
        var child = options.child;
        var parent = options.parent;

        gameUtils.matterOnce(parent, 'destroy', () => {
            graphicsUtils.removeSomethingFromRenderer(child);
        });

        Matter.Events.on(parent, 'addOrShowDisplayObject', () => {
            if (options.positionUponShow) {
                child.position = mathArrayUtils.clonePosition(parent.position, options.positionOffset);
            }
            graphicsUtils.addOrShowDisplayObject(child);
        });

        Matter.Events.on(parent, 'hideDisplayObject', () => {
            graphicsUtils.hideDisplayObject(child);
        });
    },

    //https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors - with some modifications
    shadeBlendConvert: function(p, from, to) {
        if (typeof(p) != "number" || p < -1 || p > 1 || typeof(from) != "string" || (from[0] != 'r' && from[0] != '#') || (typeof(to) != "string" && typeof(to) != "undefined")) return null; //ErrorCheck
        if (!this.sbcRip) this.sbcRip = function(d) {
            var l = d.length,
                RGB = new Object();
            if (l > 9) {
                d = d.split(",");
                if (d.length < 3 || d.length > 4) return null; //ErrorCheck
                RGB[0] = i(d[0].slice(4)), RGB[1] = i(d[1]), RGB[2] = i(d[2]), RGB[3] = d[3] ? parseFloat(d[3]) : -1;
            } else {
                if (l == 8 || l == 6 || l < 4) return null; //ErrorCheck
                if (l < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? d[4] + "" + d[4] : ""); //3 digit
                d = i(d.slice(1), 16), RGB[0] = d >> 16 & 255, RGB[1] = d >> 8 & 255, RGB[2] = d & 255, RGB[3] = l == 9 || l == 5 ? r(((d >> 24 & 255) / 255) * 10000) / 10000 : -1;
            }
            return RGB;
        };
        var i = parseInt,
            r = Math.round,
            h = from.length > 9,
            h = typeof(to) == "string" ? to.length > 9 ? true : to == "c" ? !h : false : h,
            b = p < 0,
            p = b ? p * -1 : p,
            to = to && to != "c" ? to : b ? "#000000" : "#FFFFFF",
            f = this.sbcRip(from),
            t = this.sbcRip(to);
        if (!f || !t) return null; //ErrorCheck
        if (h) return "rgb(" + r((t[0] - f[0]) * p + f[0]) + "," + r((t[1] - f[1]) * p + f[1]) + "," + r((t[2] - f[2]) * p + f[2]) + (f[3] < 0 && t[3] < 0 ? ")" : "," + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000 : t[3] < 0 ? f[3] : t[3]) + ")");
        else return (0x100000000 + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 255) : t[3] > -1 ? r(t[3] * 255) : f[3] > -1 ? r(f[3] * 255) : 255) * 0x1000000 + r((t[0] - f[0]) * p + f[0]) * 0x10000 + r((t[1] - f[1]) * p + f[1]) * 0x100 + r((t[2] - f[2]) * p + f[2]));
    },

    /*
     *  options {
     *      sprite
            tint
            speed of tint color in millis
     *   }
     */
    makeSpriteBlinkTint: function(options) {
        var sprite = options.sprite;
        var tint = options.tint;
        var speed = options.speed;

        if (sprite.blinkTimer) {
            globals.currentGame.invalidateTimer(sprite.blinkTimer);
            sprite.tint = sprite.originalTint;
        }

        sprite.originalTint = sprite.tint;
        sprite.tint = tint;
        sprite.blinkTimer = {
            name: mathArrayUtils.getId(),
            runs: 1,
            timeLimit: speed,
            callback: function() {
                sprite.tint = sprite.originalTint;
            }.bind(this)
        };
        globals.currentGame.addTimer(sprite.blinkTimer);
    },

    fadeSprite: function(sprite, rate) {
        sprite.alpha = sprite.alpha || 1.0;
        globals.currentGame.addTimer({
            name: 'fadeSprite:' + mathArrayUtils.getId(),
            timeLimit: 16,
            runs: 1.0 / rate,
            killsSelf: true,
            callback: function() {
                sprite.alpha -= rate;
            },
            totallyDoneCallback: function() {
                graphicsUtils.removeSomethingFromRenderer(sprite);
            }.bind(this)
        });
    },

    fadeSpriteOverTime: function(options) {
        options = Object.assign({
            time: options.duration || 1000,
            fadeIn: false,
            callback: null,
            nokill: false,
            makeVisible: false
        }, options);

        this.fadeSpriteOverTimeLegacy(options.sprite, options.time, options.fadeIn, options.callback, options.nokill, options.makeVisible);
    },

    fadeSpriteOverTimeLegacy: function(sprite, time, fadeIn, callback, nokill, makeVisible) {
        var startingAlpha = sprite.alpha || 1.0;
        var finalAlpha = 0;
        if (fadeIn) {
            finalAlpha = startingAlpha;
            sprite.alpha = 0;
        } else {}
        if (makeVisible) {
            sprite.visible = true;
        }

        var timer = globals.currentGame.addTimer({
            name: 'fadeSpriteOverTime:' + mathArrayUtils.getId(),
            timeLimit: time,
            runs: 1,
            killsSelf: true,
            tickCallback: function() {
                if (fadeIn) {
                    sprite.alpha = this.percentDone * finalAlpha;
                } else {
                    sprite.alpha = startingAlpha - (this.percentDone * startingAlpha);
                }
            },
            totallyDoneCallback: function() {
                if (!fadeIn) {
                    if (!nokill) {
                        graphicsUtils.removeSomethingFromRenderer(sprite);
                    } else {
                        sprite.visible = false;
                    }
                }
                if (callback) {
                    callback();
                }
            }.bind(this)
        });

        var remove = gameUtils.matterOnce(sprite, 'destroy', () => {
            timer.invalidate();
        });

        Matter.Events.on(timer, 'onInvalidate', () => {
            remove.removeHandler();
        });

        return timer;
    },

    //if bottonPause is null, both sides pause according to pauseDuration
    fadeBetweenSprites: function(sprite1, sprite2, duration, pauseDuration, bottomPause) {
        var equalPause = mathArrayUtils.isFalseNotZero(bottomPause);
        pauseDuration = pauseDuration || 0;
        sprite1.alpha = 1;
        sprite2.alpha = 0;
        graphicsUtils.addOrShowDisplayObject(sprite1);
        graphicsUtils.addOrShowDisplayObject(sprite2);
        var forward = true; //from sprite1 --> sprite2
        var pauseAmount = 0;
        var paused = false;
        var timer = globals.currentGame.addTimer({
            name: 'fadebetweensprites:' + mathArrayUtils.getId(),
            gogogo: true,
            tickCallback: function(deltaTime) {
                var amountDone = deltaTime / duration;
                if (paused) {
                    var localPauseDuration = pauseDuration;
                    pauseAmount += deltaTime;
                    if (equalPause) { //if equal pause, who cares
                        //do nothing
                    } else {
                        if (forward) { //at the bottom, wanting to go forward
                            localPauseDuration = bottomPause;
                        } else { //at the top, wanting to go down
                            //do nothing
                        }
                    }
                    if (pauseAmount > localPauseDuration) {
                        pauseAmount = 0;
                        paused = false;
                    } else {
                        return;
                    }
                }
                if (forward) {
                    sprite1.alpha -= amountDone;
                    sprite2.alpha += amountDone;
                    if (sprite2.alpha >= 1.0) {
                        forward = false;
                        paused = true;
                    }
                } else {
                    sprite2.alpha -= amountDone;
                    sprite1.alpha += amountDone;
                    if (sprite1.alpha >= 1.0) {
                        forward = true;
                        paused = true;
                    }
                }
            }
        });
        timer.resetExtension = function() {
            sprite1.alpha = 1;
            sprite2.alpha = 0;
            forward = true;
        };
        return timer;
    },

    floatSprite: function(sprite, options) {
        options = Object.assign({
            direction: 1,
            runs: 34
        }, options);
        if (!sprite.floatYOffset) {
            sprite.floatYOffset = 0;
        }
        sprite.alpha = 1.4;
        var timer = globals.currentGame.addTimer({
            name: 'floatSprite:' + mathArrayUtils.getId(),
            timeLimit: 16,
            runs: options.runs,
            executeOnNuke: true,
            killsSelf: true,
            callback: function() {
                sprite.position.y -= 1 * options.direction;
                sprite.floatYOffset -= 1;
                sprite.alpha -= 1.4 / (options.runs);
            },
            totallyDoneCallback: function() {
                graphicsUtils.removeSomethingFromRenderer(sprite, 'foreground');
            }.bind(this)
        });

        var remove = gameUtils.matterOnce(sprite, 'destroy', () => {
            timer.invalidate();
        });

        Matter.Events.on(timer, 'onInvalidate', () => {
            remove.removeHandler();
        });
    },

    rotateSprite: function(sprite, options) {
        options = Object.assign({
            direction: 1,
            speed: 1
        }, options);

        var rotationTimer = globals.currentGame.addTimer({
            name: 'rotateSprite:' + mathArrayUtils.getId(),
            gogogo: true,
            executeOnNuke: true,
            tickCallback: function(deltaTime) {
                sprite.rotation += deltaTime / 20000 * options.speed;
            }
        });

        var remove = gameUtils.matterOnce(sprite, 'destroy', () => {
            globals.currentGame.invalidateTimer(rotationTimer);
        });

        Matter.Events.on(rotationTimer, 'onInvalidate', () => {
            remove.removeHandler();
        });
    },

    floatText: function(text, position, options) {
        options = options || {};
        var alphaBuffer = 2.0;
        var newStyle;
        if (options.textSize) {
            newStyle = $.extend({}, styles.style, {
                fontSize: options.textSize
            });
        } else {
            newStyle = styles.style;
        }
        var floatedText = graphicsUtils.addSomethingToRenderer("TEX+:" + text, options.where || 'hud', {
            style: options.style || newStyle,
            x: gameUtils.getCanvasWidth() / 2,
            y: gameUtils.getCanvasHeight() / 2
        });
        floatedText.position = position;
        floatedText.alpha = alphaBuffer;
        var timer = globals.currentGame.addTimer({
            name: 'floatText:' + mathArrayUtils.getId(),
            timeLimit: options.duration || 750,
            killsSelf: true,
            runs: 1,
            tickCallback: function(delta) {
                if (!options.stationary) {
                    floatedText.position.y -= (delta * (options.speed / 100 || 0.03));
                }
                floatedText.alpha = alphaBuffer - this.percentDone * alphaBuffer;
            },
            totallyDoneCallback: function() {
                graphicsUtils.removeSomethingFromRenderer(floatedText, options.where || 'hud');
                if (options.deferred) {
                    options.deferred.resolve();
                }
            }.bind(this)
        });

        var remove = gameUtils.matterOnce(floatedText, 'destroy', () => {
            timer.invalidate();
        });

        Matter.Events.on(timer, 'onInvalidate', () => {
            remove.removeHandler();
        });

        return floatedText;
    },

    //https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    hexToRgb: function(hex) {
        var r = (hex >> 16) & 255;
        var g = (hex >> 8) & 255;
        var b = hex & 255;

        return {
            r: r,
            g: g,
            b: b
        };
    },

    getRandomHexColor: function() {
        return this.rgbToHex(Math.random() * 255, Math.random() * 255, Math.random() * 255);
    },

    rgbToHex: function(red, green, blue) {
        var r = Number(Math.floor(red)).toString(16);
        if (r.length < 2) {
            r = "0" + r;
        }

        var g = Number(Math.floor(green)).toString(16);
        if (g.length < 2) {
            g = "0" + g;
        }

        var b = Number(Math.floor(blue)).toString(16);
        if (b.length < 2) {
            b = "0" + b;
        }

        return "0x" + r + g + b;
    },

    //red to green is default
    //options contain start rgb to final rgb
    percentAsHexColor: function(percentage, options) {
        if (!options) {
            options = {};
            options.start = {
                r: 255,
                g: 0,
                b: 0
            };
            options.final = {
                r: 0,
                g: 255,
                b: 0
            };
        }

        if (!(typeof options.start == 'object')) {
            options.start = this.hexToRgb(options.start);
        }

        if (!(typeof options.final == 'object')) {
            options.final = this.hexToRgb(options.final);
        }

        var sr = options.start.r;
        var sg = options.start.g;
        var sb = options.start.b;

        var fr = options.final.r;
        var fg = options.final.g;
        var fb = options.final.b;

        var newR = sr + (fr - sr) * percentage;
        var newG = sg + (fg - sg) * percentage;
        var newB = sb + (fb - sb) * percentage;
        // return this.rgbToHex(percentage >= .5 ? ((1-percentage) * 2 * 255) : 255, percentage <= .5 ? (percentage * 2 * 255) : 255, 0);
        return this.rgbToHex(newR, newG, newB);
    },

    graduallyTint: function(tintable, startColor, finalColor, transitionTime, tintableName, pauseDurationAtEnds, times, onEnd) {
        var utils = this;
        var forward = true;
        var totalRuns = times * 2;
        var timer = globals.currentGame.addTimer({
            name: 'gradualTint:' + mathArrayUtils.getId(),
            runs: 1,
            timeLimit: transitionTime,
            resetExtension: function() {
                forward = true;
            },
            tickCallback: function() {
                var s = forward ? startColor : finalColor;
                var f = forward ? finalColor : startColor;
                var color = graphicsUtils.percentAsHexColor(this.percentDone, {
                    start: s,
                    final: f
                });
                tintable[tintableName || 'tint'] = color;
            },
            totallyDoneCallback: function() {
                var tempForward = !forward;
                if (pauseDurationAtEnds) {
                    globals.currentGame.addTimer({
                        name: 'pause' + mathArrayUtils.getId(),
                        runs: 1,
                        timeLimit: pauseDurationAtEnds,
                        killsSelf: true,
                        totallyDoneCallback: function() {
                            this.reset();
                            forward = tempForward;
                        }.bind(this)
                    });
                } else {
                    this.reset();
                    forward = tempForward;
                }

                if (times) {
                    totalRuns--;
                    if (!totalRuns) {
                        this.invalidate();
                        if (onEnd) {
                            onEnd();
                        }
                    }
                }
            }
        });

        var remove = gameUtils.matterOnce(tintable, 'destroy', () => {
            timer.invalidate();
        });

        Matter.Events.on(timer, 'onInvalidate', () => {
            remove.removeHandler();
        });

        return timer;
    },

    flashSprite: function(options) {
        var sprite;
        if (options.isSprite) {
            sprite = options;
        } else {
            sprite = options.sprite;
        }
        var times = options.times || 4;
        var fromColor = options.fromColor || 0xFFFFFF;
        var toColor = options.toColor || 0xf20000;
        var duration = options.duration || 100;
        var pauseDurationAtEnds = options.pauseDurationAtEnds || 0;
        return this.graduallyTint(sprite, fromColor, toColor, duration, null, pauseDurationAtEnds, times, options.onEnd);
    },

    shakeSprite: function(sprite, duration) {
        var shakeFrameLength = 32;
        var position = mathArrayUtils.clonePosition(sprite.position);
        sprite.independentRender = true; //in case we're on a body
        var timer = globals.currentGame.addTimer({
            name: 'shake' + mathArrayUtils.getId(),
            timeLimit: shakeFrameLength,
            runs: Math.ceil(duration / shakeFrameLength),
            killsSelf: true,
            callback: function() {
                sprite.position = {
                    x: position.x + (this.runs % 2 == 0 ? 1.5 : -1.5) * 2,
                    y: position.y
                };
            },
            totallyDoneCallback: function() {
                sprite.position = position;
                sprite.independentRender = false;
            }
        });

        var remove = gameUtils.matterOnce(sprite, 'destroy', () => {
            timer.invalidate();
        });

        Matter.Events.on(timer, 'onInvalidate', () => {
            remove.removeHandler();
        });

        return timer;
    },

    spinSprite: function(sprite, spins, initialFlipTime, slowDownThreshold, lastTurn, doneCallback) {
        //setup flip animation
        var halfFlipTime = null;
        var flipTime = null;
        var setFlipTime = function(time) {
            flipTime = time;
            halfFlipTime = time / 2;
        };
        setFlipTime(initialFlipTime || 800);
        var totalDone = 0;
        var spinningIn = true;
        var self = this;
        spins = spins || 1;
        var percentDone = 0;
        slowDownThreshold = slowDownThreshold || 0;
        var originalScaleX = sprite.scale.x;
        var frontTint = 0xFFFFFF;
        var backTint = 0x525254;
        var faceShowing = 'front';
        var isSpinning = true;
        var flipTimer = globals.currentGame.addTimer({
            name: 'nodeFlipTimer' + mathArrayUtils.getId(),
            gogogo: true,
            tickCallback: function(deltaTime) {
                //if we're on our last flip, make it slow down during the turn
                if (spins <= slowDownThreshold) {
                    var shelf = (slowDownThreshold - spins) * (1 / slowDownThreshold);
                    var fullPercentageDone = shelf + (spinningIn ? (percentDone / 2) * (1 / slowDownThreshold) : (1 / slowDownThreshold / 2) + (percentDone / 2) * (1 / slowDownThreshold));
                    deltaTime *= Math.max(0.20, 1 - fullPercentageDone);
                }

                totalDone += deltaTime;
                percentDone = totalDone / halfFlipTime;

                if (percentDone >= 1) {
                    percentDone = 0;
                    totalDone = 0;
                    if (!spinningIn) {
                        spins--;
                        if (spins == 0) {
                            if (doneCallback) {
                                doneCallback();
                            }
                            this.invalidate();
                            sprite.scale.x = originalScaleX;
                            isSpinning = false;
                            return;
                        }
                    }
                    spinningIn = !spinningIn;

                    //determine face
                    if (!spinningIn) {
                        if (faceShowing == 'front') {
                            faceShowing = 'back';
                        } else {
                            faceShowing = 'front';
                        }
                    }

                    //set tint based on face
                    if (faceShowing == 'front') {
                        sprite.tint = frontTint;
                    } else {
                        sprite.tint = backTint;
                    }

                    //call last turn if desired
                    if (spins <= 1 && !spinningIn && lastTurn) {
                        lastTurn();
                    }
                }
                if (spinningIn) {
                    sprite.scale.x = originalScaleX - (percentDone * originalScaleX);
                } else {
                    sprite.scale.x = percentDone * originalScaleX;
                }
            }
        });

        var remove = gameUtils.matterOnce(sprite, 'destroy', () => {
            flipTimer.invalidate();
        });

        Matter.Events.on(flipTimer, 'onInvalidate', () => {
            remove.removeHandler();
        });
    },

    addShadowToSprite: function(options) {
        options = Object.assign({
            alpha: 1.0,
            offset: {x: 0, y: options.sprite.height/2.0}
        }, options);

        let sprite = options.sprite;
        var shadow = graphicsUtils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stageNTwo', position: mathArrayUtils.clonePosition(sprite.position, options.offset)});
        shadow.alpha = options.alpha;
        if(options.size) {
            graphicsUtils.makeSpriteSize(shadow, options.size);
        } else if(options.scale) {
            shadow.scale = options.scale;
        } else {
            graphicsUtils.makeSpriteSize(shadow, sprite.width);
        }
        graphicsUtils.latchDisplayObjectOnto({child: shadow, parent: sprite});
        mathArrayUtils.roundPositionToWholeNumbers(shadow.position);
    },

    //supports an existing border, calling this again will resize the border
    addBorderToSprite: function(options) {
        options = Object.assign({
            tint: 0xFFFFFF,
            thickness: 2,
            alpha: 0.45,
        }, options);
        let sprite = options.sprite;

        var border = options.existingBorder;
        if (!border) {
            border = graphicsUtils.addSomethingToRenderer('TintableSquare', {
                where: options.where || sprite.where,
                alpha: options.alpha,
            });
            border.borderOptions = options;
            border.sortYOffset = -1;
            border.isBorder = true;
            border.tint = options.tint;
            border.visible = sprite.parent && sprite.visible;

            graphicsUtils.latchDisplayObjectOnto({child: border, parent: sprite, positionUponShow: true});

            sprite.addedBorder = border;
        }
        graphicsUtils.makeSpriteSize(border, {
            x: sprite.width + options.thickness * 2,
            y: sprite.height + options.thickness * 2
        });
        border.position = sprite.position;

        return border;
    },

    resizeBorder: function(borderedSprite) {
        this.addBorderToSprite(Object.assign({
            existingBorder: borderedSprite.addedBorder
        }, borderedSprite.addedBorder.borderOptions));
    },

    addGleamToSprite: function(options) {
        options = Object.assign({
            runs: 1,
            duration: 750,
            leanAmount: 10.0,
            gleamWidth: 35.0,
            power: 1.0,
            alphaIncluded: false,
            red: 1.0,
            green: 1.0,
            blue: 1.0,
        }, options);

        var power, sprite, duration, pauseDuration, runs, leanAmount, gleamWidth, alphaIncluded, red, green, blue;
        ({
            power,
            alphaIncluded,
            sprite,
            duration,
            pauseDuration,
            runs,
            leanAmount,
            gleamWidth,
            red,
            green,
            blue
        } = options);

        //remove previous gleam
        if (sprite.removeGleam) {
            sprite.removeGleam();
        }

        var gShader = new PIXI.Filter(null, gleamShader, {
            progress: 0.0,
            spriteSize: {
                x: sprite.width,
                y: sprite.height
            },
            spritePosition: graphicsUtils.getInvertedSpritePosition(sprite),
            leanAmount: leanAmount,
            gleamWidth: gleamWidth,
            alphaIncluded: alphaIncluded,
            power: power,
            red: red,
            green: green,
            blue: blue
        });
        sprite.filters = [gShader];
        pauseDuration = pauseDuration || 0;

        sprite.gleamTimer = globals.currentGame.addTimer({
            name: 'gleamTimer' + mathArrayUtils.getId(),
            runs: 1,
            timeLimit: duration || 1000,
            tickCallback: function() {
                gShader.uniforms.progress = this.percentDone;
                gShader.uniforms.spritePosition = graphicsUtils.getInvertedSpritePosition(sprite);
            },
            totallyDoneCallback: function() {
                if (pauseDuration) {
                    globals.currentGame.addTimer({
                        name: 'gleamPauseTimer' + mathArrayUtils.getId(),
                        runs: 1,
                        killsSelf: true,
                        timeLimit: pauseDuration,
                        totallyDoneCallback: function() {
                            sprite.gleamTimer.reset();
                        }
                    });
                } else {
                    sprite.removeGleam();
                }
            }
        });

        sprite.removeGleam = function() {
            if (sprite.filters) {
                mathArrayUtils.removeObjectFromArray(gShader, sprite.filters);
            }
            sprite.gleamTimer.invalidate();
        };

        var remove = gameUtils.matterOnce(sprite, 'destroy', () => {
            sprite.gleamTimer.invalidate();
        });

        Matter.Events.on(sprite.gleamTimer, 'onInvalidate', () => {
            remove.removeHandler();
        });
    },
};

export {
    graphicsUtils
};
