/*
 * Module containing utilities
 */
import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import hs from  '@utils/HS.js'
import * as $ from 'jquery'
import * as h from  'howler'
import styles from '@utils/Styles.js'
import {globals} from '@core/GlobalState.js'

var praiseWords = ["GREAT", "EXCELLENT", "NICE", "WELL DONE", "AWESOME"];

var utils = {

    distanceBetweenBodies: function(bodyA, bodyB) {
        var a = bodyA.position.x - bodyB.position.x;
        var b = bodyA.position.y - bodyB.position.y;
        return Math.sqrt(a*a + b*b);
    },

    distanceBetweenPoints: function(A, B) {
      return (Matter.Vector.magnitude(Matter.Vector.sub(A, B)));
    },

    //Deprecated: replace remaining calls with getAnimationB, then rename that method to getAnimation
    getAnimation: function(baseName, transform, speed, where, playThisManyTimes, rotation, body, numberOfFrames, startFrameNumber, bufferUnderTen) {
        var frames = [];
        var numberOfFrames = numberOfFrames || PIXI.Loader.shared[baseName+'FrameCount'] || 10;
        var startFrame = (startFrameNumber == 0 ? 0 : startFrameNumber || 1);
        for(var i = startFrame; i < startFrame + numberOfFrames; i++) {
            try {
                var j = i;
                if(bufferUnderTen && j < 10)
                    j = "0" + j;
                frames.push(PIXI.Texture.from(baseName+j+'.png'));
            } catch(err) {
                try {
                        frames.push(PIXI.Texture.from(baseName+i+'.jpg'));
                    } catch(err) {
                        break;
                }
            }
        }

        var anim = new PIXI.AnimatedSprite(frames);
        anim.onComplete = function() {
            utils.removeSomethingFromRenderer(anim)
        }.bind(this);
        anim.persists = true;
        anim.setTransform.apply(anim, transform);
        anim.animationSpeed = speed;
        anim.loop = playThisManyTimes < 0;

        if(rotation)
            anim.rotation = rotation;

        if(playThisManyTimes && playThisManyTimes > 0) {
            var origOnComplete = anim.onComplete;
            playThisManyTimes -= 1;
            anim.onComplete = function() {
                if(playThisManyTimes) {
                    anim.gotoAndPlay(0);
                    playThisManyTimes--;
                } else {
                    origOnComplete.call(anim);
                }
            }
        }

        //if body is given, let's apply the same anchor to this animation
        var options = {};
        if(body) {
            options.anchor = {};
            options.anchor.x = body.render.sprite.xOffset;
            options.anchor.y = body.render.sprite.yOffset;
        }

        utils.addSomethingToRenderer(anim, where, options);
        return anim;
    },

    /*
     * options {
     *  (numberOfFrames
     *  startFrameNumber
     *  baseName
     *  bufferUnderTen)
     *  OR
     *  (animationName
     *  spritesheetName)
     *  transform
     *  speed
     *  playThisManyTimes
     *  rotation
     *  body
     *  where
     *  onComplete
     */
    getAnimationB: function(options) {
        var frames = [];
        var anim = null;
        if(options.numberOfFrames) {
            var numberOfFrames = options.numberOfFrames || PIXI.Loader.shared[options.baseName+'FrameCount'] || 10;
            var startFrame = (options.startFrameNumber == 0 ? 0 : options.startFrameNumber || 1);
            for(var i = startFrame; i < startFrame + numberOfFrames; i++) {
                try {
                    var j = i;
                    if(options.bufferUnderTen && j < 10)
                        j = "0" + j;
                    frames.push(PIXI.Texture.from(options.baseName+j+'.png'));
                } catch(err) {
                    try {
                            frames.push(PIXI.Texture.from(options.baseName+i+'.jpg'));
                        } catch(err) {
                            break;
                    }
                }
            }
            anim = new PIXI.AnimatedSprite(frames);
        } else {
            anim = new PIXI.AnimatedSprite(PIXI.Loader.shared.resources[options.spritesheetName].spritesheet.animations[options.animationName]);
        }

        if(options.fadeAway) {
            anim.onComplete = function() { //default onComplete function
                utils.fadeSpriteOverTime(anim, options.fadeTime || 2000);
            }.bind(this);
        } else {
            anim.onComplete = function() { //default onComplete function
                utils.removeSomethingFromRenderer(anim)
            }.bind(this);
        }
        anim.persists = true;
        anim.setTransform.apply(anim, options.transform || [-1000, -1000]);
        anim.animationSpeed = options.speed;
        anim.loop = (options.playThisManyTimes == 'loop') || options.loop;
        anim.playThisManyTimes = options.playThisManyTimes;
        anim.currentPlayCount = options.playThisManyTimes;
        anim.anchor = options.anchor || {x: .5, y: .5};

        if(options.rotation)
            anim.rotation = options.rotation;

        //default on complete allows for multi-play
        if(!anim.loop && anim.currentPlayCount && anim.currentPlayCount > 0) {
            anim.onManyComplete = anim.onComplete; //default to remove the animation
            anim.onComplete = function() { //override onComplete to countdown the specified number of times
                if(anim.currentPlayCount) {
                    //console.info(anim.currentPlayCount);
                    anim.gotoAndPlay(0);
                    anim.currentPlayCount--;
                } else {
                    anim.onManyComplete.call(anim);
                    this.currentPlayCount = this.playThisManyTimes;
                }
            }
        }

        if(options.onComplete) {
            anim.onComplete = options.onComplete;
        }
        if(options.onManyComplete) {
            anim.onManyComplete = options.onManyComplete;
        }

        return anim;
    },

    /*
     * options {
     *  spine: the pixi-spine object
     *  animationName: the animation name
     *  loops: loop or not
     *  times: how many times to play the animation
     *  speed: animation speed
     *  canInterruptSelf: default true
     *
     *  // NOTE: right now we're just using track 0 and this method assumes such
     * }
     */

    getSpineAnimation(options) {
        options = $.extend({canInterruptSelf: true}, options)
        var anim = {spine: options.spine};

        Object.defineProperty(anim, 'visible', {
            set: function(v) {
                options.spine.visible = v;
                // reset lastTime to be null since pixi freezes the delta timing of the pixi-spine object when 'visible' becomes false.
                options.spine.lastTime = null;
            }
        });

        Object.defineProperty(anim, 'alpha', {
            set: function(v) {
                options.spine.alpha = v;
            }
        });

        Object.defineProperty(anim, 'tint', {
            set: function(v) {
                options.spine.tint = v;
            }
        });

        anim.play = function() {
            if(!options.canInterruptSelf && options.spine.currentAnimation == options.animationName) {
                return;
            }

            //This is hard coded to play something on track 1, if multiple
            if(options.mixedAnimation) {
                options.spine.state.clearTrack(1);
                var track = options.spine.state.addAnimation(1, options.animationName, false, 0);
                track.mixDuration = 2.0;
                return;
            }

            //Set the animation name for use in the above test
            options.spine.currentAnimation = options.animationName;

            //Clear track
            options.spine.state.clearTrack(0);
            options.spine.skeleton.setToSetupPose();

            //Set animation speed
            options.spine.state.timeScale = options.speed || 1;

            if(!options.times) {
                options.times = 1;
            }
            //Loop if desired
            if(options.loop) {
                options.spine.state.setAnimation(0, options.animationName, options.loop);
            } else if(options.times) {
                //Otherwise queue the animation so many times
                $.each(new Array(options.times), function() {
                    var entry = options.spine.state.addAnimation(0, options.animationName, false, 0);
                })
            }
        }

        anim.stop = function() {
            options.spine.state.clearTrack(0);
            options.spine.currentAnimation = null;
        }

        options.spine.state.addListener({
            complete: options.completeListener
        });

        return anim;
    },

    //https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors - with some modifications
    shadeBlendConvert: function(p, from, to) {
        if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null; //ErrorCheck
        if(!this.sbcRip)this.sbcRip=function(d){
            var l=d.length,RGB=new Object();
            if(l>9){
                d=d.split(",");
                if(d.length<3||d.length>4)return null;//ErrorCheck
                RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
            }else{
                if(l==8||l==6||l<4)return null; //ErrorCheck
                if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
                d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
            }
            return RGB;}
        var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=this.sbcRip(from),t=this.sbcRip(to);
        if(!f||!t)return null; //ErrorCheck
        if(h)return "rgb("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
        else return (0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2]));
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

        if(sprite.blinkTimer) {
            globals.currentGame.invalidateTimer(sprite.blinkTimer);
            sprite.tint = sprite.originalTint;
        }

        sprite.originalTint = sprite.tint;
        sprite.tint = tint;
        sprite.blinkTimer = {
            name: this.uuidv4(),
            runs: 1,
            timeLimit: speed,
            callback: function() {
                sprite.tint = sprite.originalTint;
            }.bind(this)
        };
        globals.currentGame.addTimer(sprite.blinkTimer);
    },

    addSomethingToRenderer: function(something, where, options) {
        if($.type(where) == 'object') {
            options = where;
            where = options.where;
        }
        options = options || {};

        var displayObject = this.createDisplayObject(something, options);
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
        var alreadyBorn = something == displayObject;

        $.extend(displayObject, options);

        //Default anchor to {.5, .5} if anchor wasn't specified in the options AND
        //if we're not already a real display object. This is so that adding an already
        //created object via addSomethingToRenderer doesn't override the previously set anchor.
        //This means that it's assumed that an already-created object has a relevant anchor.
        if(!options.anchor && !alreadyBorn) {
            displayObject.anchor = {x: .5, y: .5};
        }
        if(options.filter) {
            options.filter.uniforms.mouse = {x: 50, y: 50};
            options.filter.uniforms.resolution = {x: globals.currentGame.canvas.width, y: globals.currentGame.canvas.height};
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

    addOrShowDisplayObject: function(displayObject) {
        if(!displayObject.parent) {
            this.addDisplayObjectToRenderer(displayObject);
        } else {
            displayObject.visible = true;
        }
    },

    makeSpriteSize: function(sprite, size) {
        if(!sprite.texture) return;
        var scaleX = null;
        var scaleY = null;
        if(!size.w && !size.h && size.x && size.y) {
            size.w = size.x;
            size.h = size.y;
        }

        if(size.w) {
            scaleX = size.w/sprite.texture.width;
            scaleY = size.h/sprite.texture.height;
        } else {
            scaleX = size/sprite.texture.width;
        }
        sprite.scale = {x: scaleX, y: scaleY || scaleX};
        return sprite.scale;
    },

    /* If we're attaching a body, don't worry about interpolation. Note: attaching
     * a body to another body only updates the attached body after an engine update, so any
     * manual moves of the master body won't take effect until an afterUpdate is triggered
     *
     * If we're attaching a sprite, hitch onto interpolation
     */
    attachSomethingToBody: function(options) {
        var something, body, offset, somethingId;
        ({something, body, offset, somethingId} = options);

        offset = offset || {x: 0, y: 0};
        var callbackLocation = 'afterRenderWorld';
        if(something.type && something.type == 'body') {
            callbackLocation = 'afterUpdate';
        }
        var tick = globals.currentGame.addTickCallback(function() {
            if(something.type && something.type == 'body') {
                Matter.Body.setPosition(something, Matter.Vector.add(body.position, offset));
            } else {
                something.position = Matter.Vector.add(body.lastDrawPosition || body.position, offset);
            }
        }, false, callbackLocation);
        something.bodyAttachment = tick;
        this.deathPact(body, tick, somethingId);
    },

    detachSomethingFromBody: function(something) {
        globals.currentGame.removeTickCallback(something.bodyAttachment);
    },

    getLagCompensatedVerticesForBody: function(body) {
        if(body.verticesCopy && body.verticesCopy.length >= globals.currentGame.lagCompensation) {
            return body.verticesCopy[body.verticesCopy.length - globals.currentGame.lagCompensation];
        } else {
            return null;
        }
    },

    removeSomethingFromRenderer: function(something, where) {
        //if we just have a display object that has not been added to the renderer, destroy this mf'er
        if(!something.where && !where && !something.myLayer) {
            if(something.destroy && !something._destroyed) {
                something.destroy();
            }
        } else {
            //otherwise remove from stage and destroy
            where = where || something.myLayer || 'stage';
            globals.currentGame.renderer.removeFromPixiStage(something, where);
        }

        //always trigger a destroy
        Matter.Events.trigger(something, "destroy");
    },

    scaleBody: function(body, x, y) {
        Matter.Body.scale(body, x, y);
        body.render.sprite.xScale *= x;
        body.render.sprite.yScale *= y;

        //if we're flipping just by 1 axis, we need to reverse the vertices to maintain clockwise ordering
        if(x*y < 0) {
            $.each(body.parts, function(i, part) {
                part.vertices.reverse();
            });
        }
    },

    bodyRanOffStage: function(body) {
        var buffer = 50;
        if(body.velocity.x < 0 && body.bounds.max.x < -buffer)
            return true;
        if(body.velocity.x > 0 && body.bounds.min.x > this.getPlayableWidth() + buffer)
            return true;
        if(body.velocity.y > 0 && body.bounds.min.y > this.getPlayableHeight() + buffer)
            return true;
        if(body.velocity.y < 0 && body.bounds.max.y < -buffer)
            return true;
    },

    isSpriteBelowStage: function(sprite) {
        var deletePointAdjustment = sprite.anchor.x * sprite.height;
        if(sprite.position.y - deletePointAdjustment > globals.currentGame.canvas.height)
            return true;
        return false;
    },

    getRandomPlacementWithinCanvasBounds: function() {
        var placement = {};
        placement.x = Math.random() * this.getCanvasWidth();
        placement.y = Math.random() * this.getCanvasHeight();
        return placement;
    },

    getRandomPlacementWithinPlayableBounds: function(buffer) {
        if(buffer && !buffer.x) {
            buffer = {x: buffer, y: buffer};
        }
        if(!buffer) buffer = {x: 0, y: 0};
        var placement = {};
        placement.x = buffer.x + (Math.random() * (this.getPlayableWidth() - buffer.x*2));
        placement.y = buffer.y + (Math.random() * (this.getPlayableHeight() - buffer.y*2));
        return placement;
    },

    isPositionWithinPlayableBounds: function(position, buffer) {
        if(buffer && !buffer.x) {
            buffer = {x: buffer, y: buffer};
        }
        if(!buffer) buffer = {x: 0, y: 0};
        if(position.x > 0 + buffer.x && position.x < this.getPlayableWidth() - buffer.x) {
            if(position.y > 0 + buffer.y && position.y < this.getPlayableHeight() - buffer.y) {
                return true;
            }
        }
        return false;
    },

    addRandomVariationToGivenPosition: function(position, randomFactorX, randomFactorY) {
        position.x += (1 - 2*Math.random()) * randomFactorX;
        position.y += (1 - 2*Math.random()) * (randomFactorY || randomFactorX);
        return position;
    },

    createAmbientLights: function(hexColorArray, where, intensity) {
        var numberOfLights = hexColorArray.length;
        var spacing = this.getCanvasWidth()/(numberOfLights*2);
        var lights = [];
        $.each(hexColorArray, function(i, color) {
            var l = this.createDisplayObject("AmbientLight" + (i%3 + 1),
                {position: this.addRandomVariationToGivenPosition({x: ((i+1)*2-1) * spacing, y: this.getCanvasHeight()/2}, 300/numberOfLights, 300), tint: color,
                where: where || 'backgroundOne', alpha: intensity || .25});
            lights.push(l);
        }.bind(this))
        return lights;
    },

    //apply something to bodies by team
    applyToUnitsByTeam: function(teamPredicate, unitPredicate, f) {
        teamPredicate = teamPredicate || function(team) {return true};
        unitPredicate = unitPredicate || function(unit) {return true};
        $.each(globals.currentGame.unitsByTeam, function(i, team) {
            if(teamPredicate(i)) {
                $.each(team, function(i, unit) {
                    if(unitPredicate(unit)) {
                        f(unit);
                    }
                })
            }
        })
    },

    moveUnitOffScreen: function(unit) {
        unit.body.oneFrameOverrideInterpolation = true;
        unit.position = {x: 8000, y: 8000};
        if(unit.selectionBody)
            Matter.Body.setPosition(unit.selectionBody, unit.position);
        if(unit.smallerBody)
            Matter.Body.setPosition(unit.smallerBody, unit.position);
    },

    calculateRandomPlacementForBodyWithinCanvasBounds: function(body, neatly) {
        var placement = {};
        var bodyWidth = (body.bounds.max.x - body.bounds.min.x);
        var XRange = Math.floor(this.getPlayableWidth()/bodyWidth);
        var bodyHeight = (body.bounds.max.y - body.bounds.min.y);
        var YRange = Math.floor(this.getPlayableHeight()/bodyHeight);
        var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
        var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
        if(neatly) {
            var Xtile = this.getIntBetween(0, XRange-1);
            var Ytile = this.getIntBetween(0, YRange-1);
            placement.x = Xtile*bodyWidth + bodyHalfWidth;
            placement.y = Ytile*bodyHeight + bodyHalfHeight;
        } else {
            placement.x = Math.random() * (this.getPlayableWidth() - bodyHalfWidth*2) + bodyHalfWidth;
            placement.y = Math.random() * (this.getPlayableHeight() - bodyHalfHeight*2) + bodyHalfHeight;
        }

        return placement;
    },

    placeBodyWithinCanvasBounds: function(body) {
        //if we've added a unit, call down to its body
        if(body.isUnit) {
            body = body.body;
        }
        var placement = {};
        var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
        var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
        placement.x = Math.random() * (this.getCanvasWidth() - bodyHalfWidth*2) + bodyHalfWidth;
        placement.y = Math.random() * (this.getCanvasHeight() - bodyHalfHeight*2) + bodyHTalfHeight;
        Matter.Body.setPosition(body, placement);
        return placement;
    },

    placeBodyWithinRadiusAroundCanvasCenter: function(body, radius, minRadius) {
        //if we've added a unit, call down to its body
        if(body.isUnit) {
            body = body.body;
        }
        var placement = {};
        var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
        var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
        do {
            canvasCenter = this.getCanvasCenter();
            placement.x = canvasCenter.x-radius + (Math.random() * (radius*2 - bodyHalfWidth*2) + bodyHalfWidth);
            placement.y = canvasCenter.y-radius + (Math.random() * (radius*2 - bodyHalfHeight*2) + bodyHalfHeight);

        } while (placement.y > this.getPlayableHeight() || placement.y < 0 || placement.x > this.getPlayableWidth() || placement.x < 0 ||
            Matter.Vector.magnitude(Matter.Vector.sub(this.getPlayableCenter(), placement)) < (minRadius || 0));
        Matter.Body.setPosition(body, placement);
        return placement;
    },

    placeBodyJustOffscreen: function(body, direction, variation) {
        //if we've added a unit, call down to its body
        if(body.isUnit) {
            body = body.body;
        }
        var placement = {};
        var randomPlacement = this.getRandomPlacementWithinCanvasBounds();
        var offscreenAmount = 50;
        var variation = Math.random() * (variation || offscreenAmount);
        offscreenAmount += variation;
        if(direction == 'random' || !direction) {
            direction = utils.getRandomIntInclusive(1, 4);
        }
        if(direction == 'top' || direction == 1) {
            placement.y = 0 - (offscreenAmount);
            placement.x = randomPlacement.x;
        } else if(direction == 'left' || direction == 2) {
            placement.y = randomPlacement.y;
            placement.x = 0 - offscreenAmount;
        } else if(direction == 'right' || direction == 3) {
            placement.y = randomPlacement.y;
            placement.x = this.getCanvasWidth() + offscreenAmount;
        } else if(direction == 'bottom' || direction == 4) {
            placement.y = this.getPlayableHeight() + offscreenAmount;
            placement.x = randomPlacement.x;
        }
        Matter.Body.setPosition(body, placement);
        return placement;
    },

    offScreenPosition: function() {
        return {x: -9999, y: -9999};
    },

    isoDirectionBetweenPositions: function(v1, v2) {
        var angle = Matter.Vector.angle({x: 0, y: 0}, Matter.Vector.sub(v2, v1));
        var dir = null;
        if(angle >= 0) {
            if(angle < Math.PI/8) {
                dir = 'right';
            } else if(angle < Math.PI*3/8) {
                dir = 'downRight';
            } else if(angle < Math.PI*5/8) {
                dir = 'down';
            } else if(angle < Math.PI*7/8){
                dir = 'downLeft';
            } else {
                dir = 'left';
            }
        } else {
            if(angle > -Math.PI/8) {
                dir = 'right';
            } else if(angle > -Math.PI*3/8) {
                dir = 'upRight';
            } else if(angle > -Math.PI*5/8) {
                dir = 'up';
            } else if(angle > -Math.PI*7/8){
                dir = 'upLeft';
            } else {
                dir = 'left';
            }
        }
        return dir;
    },

    getCanvasCenter: function() {
      return {x: this.getCanvasWidth()/2, y: this.getCanvasHeight()/2};
    },

    getCanvasHeight: function() {
      return globals.currentGame.worldOptions.height + (globals.currentGame.worldOptions.unitPanelHeight || 0);
    },

    getCanvasWidth: function() {
      return globals.currentGame.worldOptions.width;
    },

    getCanvasWH: function() {
      return {x: this.getCanvasWidth(), y: this.getCanvasHeight(), w: this.getCanvasWidth(), h: this.getCanvasHeight()};
    },

    getPlayableCenter: function() {
      return {x: this.getPlayableWidth()/2, y: this.getPlayableHeight()/2};
    },

    getPlayableWH: function() {
      return {x: this.getPlayableWidth(), y: this.getPlayableHeight(), w: this.getPlayableWidth(), h: this.getPlayableHeight()};
    },

    getPlayableWidth: function() {
      return globals.currentGame.worldOptions.width;
    },

    getPlayableHeight: function() {
      return globals.currentGame.worldOptions.height;
    },

    getUnitPanelCenter: function() {
        return {x: this.getCanvasCenter().x, y: this.getPlayableHeight() + globals.currentGame.unitPanelHeight/2};
    },

    getUnitPanelHeight: function() {
        return globals.currentGame.unitPanelHeight;
    },

    getSound: function(name, options) {
        options = options || {};
        options.src = name;
        return new h.Howl(options);
    },

    //1, 4 return an int in (1, 2, 3, 4)
    getRandomIntInclusive: function(low, high) {
        return Math.floor(Math.random() * (high-low+1) + low);
    },

    getRandomElementOfArray: function(array) {
        if(array && array.length > 0) {
            return array[this.getRandomIntInclusive(0, array.length-1)];
        }
    },

    cloneVertices: function(vertices) {
        var newVertices = [];
        $.each(vertices, function(index, vertice) {
            newVertices.push({x: vertice.x, y: vertice.y})
        })
        return newVertices;
    },

    cloneParts: function(parts) {
        var newParts = [];
        $.each(parts, function(index, part) {
            newParts.push({vertices: this.cloneVertices(part.vertices)});
        }.bind(this))
        return newParts;
    },

    clonePosition: function(vector, offset) {
        offset = $.extend({x: 0, y: 0}, offset);
        return {x: vector.x + offset.x, y: vector.y + offset.y};
    },

    addScalarToPosition: function(position, scalar, reverseY) {
        reverseY = reverseY ? -1 : 1;
        return {x: position.x + scalar, y: position.y + scalar*reverseY};
    },

    fadeSprite: function(sprite, rate) {
        sprite.alpha = sprite.alpha || 1.0;
        globals.currentGame.addTimer({name: this.uuidv4(), timeLimit: 16, runs: 1.0/rate, killsSelf: true, callback: function() {
            sprite.alpha -= rate;
        }, totallyDoneCallback: function() {
            utils.removeSomethingFromRenderer(sprite);
        }.bind(this)})
    },

    fadeSpriteOverTime: function(sprite, time, fadeIn) {
        var startingAlpha = sprite.alpha || 1.0;
        var finalAlpha = 0;
        if(fadeIn) {
            finalAlpha = startingAlpha;
            startingAlpha = 0;
            sprite.alpha = 0;
        }
        var runs = time/16;
        var rate = (finalAlpha-startingAlpha)/runs;
        globals.currentGame.addTimer({name: this.uuidv4(), timeLimit: 16, runs: runs, killsSelf: true, callback: function() {
            sprite.alpha += rate;
        }, totallyDoneCallback: function() {
            if(!fadeIn)
                utils.removeSomethingFromRenderer(sprite);
        }.bind(this)})
    },

    floatSprite: function(sprite) {
        sprite.alpha = 1.4;
        globals.currentGame.addTimer({name: this.uuidv4(), timeLimit: 16, runs: 34, killsSelf: true, callback: function() {
            sprite.position.y -= 1;
            sprite.alpha -= 1.4/34;
        }, totallyDoneCallback: function() {
            utils.removeSomethingFromRenderer(sprite, 'foreground');
        }.bind(this)})
    },

    floatText: function(text, position, options) {
        options = options || {};
        if(options.textSize) {
            var newStyle = $.extend({}, styles.style, {fontSize: options.textSize})
        } else {
            newStyle = styles.style;
        }
        var startGameText = utils.addSomethingToRenderer("TEXT:"+text, 'hud', {style: options.style || newStyle, x: this.getCanvasWidth()/2, y: this.getCanvasHeight()/2});
        startGameText.position = position;
        startGameText.alpha = 1.4;
        globals.currentGame.addTimer({name: this.uuidv4(), timeLimit: 32, killsSelf: true, runs: options.runs || 30, callback: function() {
            if(!options.stationary) {
                startGameText.position.y -= 1;
            }
            startGameText.alpha -= 1.4/(options.runs || 34);
        }, totallyDoneCallback: function() {
            utils.removeSomethingFromRenderer(startGameText, 'hud');
            if(options.deferred) options.deferred.resolve()
        }.bind(this)})
    },

    praise: function(options) {
        if(!options) {
            options = {style: styles.praiseStyle}
        } else if (!options.style) {
            options.style = styles.praiseStyle;
        }
        var praiseWord = praiseWords[this.getIntBetween(0, praiseWords.length-1)] + "!";
        this.floatText(praiseWord, options.position || this.getCanvasCenter(), options);
    },

    uuidv4: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    setCursorStyle: function(style, hotspot) {
        if(style.indexOf('server:') > -1) {
            style = style.replace('server:', window.location.origin + '/app/Textures/');
            style = 'url(' + style + ')' + (hotspot ? ' ' + hotspot : '') + ', auto';
        }
        // $('*').css('cursor', style);
    },

    /*
     * options {
     *   where: stage
     *   texture: particle texture
     *   config: particle configuration (see https://pixijs.io/pixi-particles-editor/#)
     * }
     */
    createParticleEmitter: function(options) {
        // Create a new emitter
        var emitter = new PIXI.particles.Emitter(

            // The PIXI.Container to put the emitter in
            // if using blend modes, it's important to put this
            // on top of a bitmap, and not use the root stage Container
            options.where,

            // The collection of particle images to use
            [options.texture || PIXI.Texture.fromImage('../app/Textures/particle.png')],

            // Emitter configuration, edit this to change the look
            // of the emitter
            options.config
        );

        // Calculate the current time
        var elapsed = Date.now();

        // Update function every frame - though it seems we don't need this when doing playOnceAndDestroy()
        emitter.startUpdate = function(){

            // Update the next frame
            requestAnimationFrame(emitter.startUpdate);

            var now = Date.now();

            // The emitter requires the elapsed
            // number of seconds since the last update
            emitter.update((now - elapsed) * 0.001);
            elapsed = now;
        };

        // Start emitting
        emitter.emit = false;

        return emitter;
    },

    /*
     * Keep in mind where this is being called from. Calling this after the tick
     * event will prevent the current frame from decrementing frameCount.
     */
    executeSomethingNextFrame: function(callback, frameCount) {
        var limit = frameCount == null ? 1 : frameCount;
        globals.currentGame.addTimer({
            name: this.uuidv4(),
            killsSelf: true,
            timeLimit: 200,
            gogogo: true,
            tickCallback: function() {
                if(limit > 0) {
                    limit--;
                } else {
                    callback();
                    globals.currentGame.invalidateTimer(this);
                }
            },
        })
    },

    oneTimeCallbackAtTick: function(callback, event) {
        var fun = function() {
            callback();
            globals.currentGame.removeTickCallback(fun);
        }
        globals.currentGame.addTickCallback(fun, false, event);
    },

    doSomethingAfterDuration: function(callback, duration) {
        globals.currentGame.addTimer(
            {
                name: 'task:' + this.uuidv4(),
                timeLimit: duration,
                killsSelf: true,
                totallyDoneCallback: function() {
                    callback();
                }
            }
        )
    },

    signalNewWave: function(wave, deferred) {
        this.floatText("Wave: " + wave, this.getCanvasCenter(), {runs: 100, stationary: true, style: styles.newWaveStyle, deferred: deferred});
    },

    flipCoin: function() {
        return Math.random() > .5;
    },

    rgbToHex: function (red, green, blue) {
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

    //https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    hexToRgb: function(hex) {
        var r = (hex >> 16) & 255;
        var g = (hex >> 8) & 255;
        var b = hex & 255;

        return {
            r: r,
            g: g,
            b: b
        }
    },

    getRandomHexColor: function() {
        return this.rgbToHex(Math.random()*255, Math.random()*255, Math.random()*255);
    },

    //red to green is default
    //options contain start rgb to final rgb
    percentAsHexColor: function(percentage, options) {
        if(!options) {
            options = {};
            options.start = {r: 255, g: 0, b: 0};
            options.final = {r: 0, g: 255, b: 0};
        }

        if(!(typeof options.start == 'object')) {
            options.start = this.hexToRgb(options.start);
        }

        if(!(typeof options.final == 'object')) {
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

    graduallyTint: function(tintable, startColor, finalColor, transitionTime, tintableName, pauseDurationAtEnds) {
        var utils = this;
        var forward = true;
        return globals.currentGame.addTimer({
            name: 'gradualTint' + this.uuidv4(),
            runs: 1,
            timeLimit: transitionTime,
            resetExtension: function() {
                forward = true;
            },
            tickCallback: function() {
                var s = forward ? startColor : finalColor;
                var f = forward ? finalColor : startColor;
                var color = utils.percentAsHexColor(this.percentDone, {start: s, final: f})
                tintable[tintableName || 'tint'] = color;
            },
            totallyDoneCallback: function() {
                var tempForward = !forward;
                if(pauseDurationAtEnds) {
                    globals.currentGame.addTimer({
                        name: 'pause' + utils.getId(),
                        runs: 1,
                        timeLimit: pauseDurationAtEnds,
                        killsSelf: true,
                        totallyDoneCallback: function() {
                            this.reset();
                            forward = tempForward;
                        }.bind(this)
                    })
                } else {
                    this.reset();
                    forward = tempForward;
                }
            }
        })
    },

    shakeSprite: function(sprite, duration) {
        var shakeFrameLength = 32;
        var position = this.clonePosition(sprite.position);
        sprite.independentRender = true; //in case we're on a body
        globals.currentGame.addTimer(
            {
                name: 'shake' + this.uuidv4(),
                timeLimit: shakeFrameLength,
                runs: Math.ceil(duration/shakeFrameLength),
                killsSelf: true,
                callback: function() {
                    sprite.position = {x: position.x + (this.runs%2==0 ? 1.5 : -1.5)*2, y: position.y}
                },
                totallyDoneCallback: function() {
                    sprite.position = position;
                    sprite.independentRender = false;
                }
            }
        )
    },

    flattenObjectToArray: function(object) {
        var array = $.map(object, function(obj, key) {
            return [obj];
        })

        return array;
    },

    //return new position
    addScalarToVectorTowardDestination: function(start, destination, scalar) {
        var subbed = Matter.Vector.sub(destination, start);
        var normed = Matter.Vector.normalise(subbed);
        var scaled = Matter.Vector.mult(normed, scalar);
        return Matter.Vector.add(start, scaled);
    },

    sendBodyToDestinationAtSpeed: function(body, destination, speed, surpassDestination, rotateTowards) {
        //figure out the movement vector
        var velocityVector = Matter.Vector.sub(destination, body.position);
        var velocityScale = speed / Matter.Vector.magnitude(velocityVector);

        if(surpassDestination) {
            Matter.Body.setVelocity(body, Matter.Vector.mult(velocityVector, velocityScale));
        } else {
            if (Matter.Vector.magnitude(velocityVector) < speed)
                Matter.Body.setVelocity(body, velocityVector);
            else
                Matter.Body.setVelocity(body, Matter.Vector.mult(velocityVector, velocityScale));
        }
    },

    //return angle to rotate something facing an original direction, towards a point
    pointInDirection: function(origin, destination, orientation) {
        if(orientation == 'east')
            orientation = {x: origin.x + 1, y: origin.y}
        else if(orientation == 'north')
            orientation = {x: origin.x, y: origin.y + 1}
        else if(orientation == 'west')
            orientation = {x: origin.x - 1, y: origin.y}
        else if(orientation == 'south')
            orientation = {x: origin.x, y: origin.y - 1}

        var originAngle = Matter.Vector.angle(origin, orientation || {x: origin.x, y: origin.y + 1});
        var destAngle = Matter.Vector.angle(origin, {x: destination.x, y: (origin.y + (origin.y-destination.y))});

        return originAngle - destAngle;
    },

    angleBetweenTwoVectors: function(vecA, vecB) {
        return Math.acos((Matter.Vector.dot(vecA, vecB)) / (Matter.Vector.magnitude(vecA) * Matter.Vector.magnitude(vecB)))
    },

    //Death pact currently supports other units, bodies, tick callbacks, timers, and finally functions-to-execute
    //It will also search for an existing slave with the given id and replace it with the incoming slave
    deathPact: function(master, slave, slaveId) {
        if(!master.slaves)
            master.slaves = [];

        var added = false;
        if(slaveId) {
            slave.slaveId = slaveId;
            $.each(master.slaves, function(i, existingSlave) {
                if(existingSlave.slaveId == slaveId) {
                    master.slaves[i] = slave;
                    added = true;
                }
            })
        }
        if(!added)
            master.slaves.push(slave);
    },
};

//aliases
utils.offStage = utils.bodyRanOffStage;
utils.getIntBetween = utils.getRandomIntInclusive;
utils.distanceBetweenUnits = utils.distanceBetweenBodies;
utils.getId = utils.uuidv4;

export default utils;
