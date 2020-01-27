/*
 * Module containing utilities
 */
define(['matter-js', 'pixi', 'jquery', 'utils/HS', 'howler', 'particles', 'utils/Styles'], function(Matter, PIXI, $, hs, h, particles, styles) {

    var praiseWords = ["GREAT", "EXCELLENT", "NICE", "WELL DONE", "AWESOME"];

    var utils = {

        distanceBetweenBodies: function(bodyA, bodyB) {
            var a = bodyA.position.x - bodyB.position.x;
            var b = bodyA.position.y - bodyB.position.y;
            return Math.sqrt(a*a + b*b);
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


            anim.onComplete = function() { //default onComplete function
                utils.removeSomethingFromRenderer(anim)
            }.bind(this);
            anim.persists = true;
            anim.setTransform.apply(anim, options.transform || [-1000, -1000]);
            anim.animationSpeed = options.speed;
            anim.loop = options.playThisManyTimes == 'loop';
            anim.playThisManyTimes = options.playThisManyTimes;
            anim.currentPlayCount = options.playThisManyTimes;

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

            //if body is given, let's apply the same anchor to this animation
            var rendOptions = {};
            if(options.body) {
                rendOptions.anchor = {};
                rendOptions.anchor.x = options.body.render.sprite.xOffset;
                rendOptions.anchor.y = options.body.render.sprite.yOffset;
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
            var anim = {};

            Object.defineProperty(anim, 'visible', {
                set: function(v) {
                    options.spine.visible = v;
                }
            });

            anim.play = function() {
                if(!options.canInterruptSelf && options.spine.currentAnimation == options.animationName) {
                    return;
                }

                //Set the animation name for use in the above test
                options.spine.currentAnimation = options.animationName;

                //Clear track and reset lastTime to be null since pixi freezes the delta timing of the pixi-spine
                //object when 'visible' becomes false.
                options.spine.state.clearTrack(0);
                options.spine.lastTime = null;
                options.spine.skeleton.setToSetupPose()

                //Set animation speed
                options.spine.state.timeScale = options.speed || 1;

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
         * Renderer utils
         */
        addSomethingToRenderer: function(something, where, options) {
            if($.type(where) == 'object') {
                options = where;
                where = options.where;
            }
            options = options || {};

            something = currentGame.renderer.itsMorphinTime(something, options);
            if(options.position) {
                options.x = options.position.x;
                options.y = options.position.y;
            }

            if(options.filter) {
                options.filter.uniforms.mouse = {x: 50, y: 50};
                options.filter.uniforms.resolution = {x: currentGame.canvas.width, y: currentGame.canvas.height};
                something.filters = [options.filter];
            }
            if(options.height)
                something.height = options.height;
            if(options.width)
                something.width = options.width;
            if(options.x)
                something.position.x = options.x;
            if(options.y)
                something.position.y = options.y;
            if(options.scale)
                something.scale = options.scale;
            if(options.anchor) {
                something.anchor = options.anchor;
            } else {
                something.anchor = {x: .5, y: .5};
            }
            if(options.tint)
                something.tint = options.tint;
            if(options.rotation)
                something.rotation = options.rotation;
            if(options.sortYOffset)
                something.sortYOffset = options.sortYOffset;
            if(options.alpha != undefined)
                something.alpha = options.alpha;

            //add options to escape without adding it to the renderer
            if(options.dontAdd) return something;

            currentGame.renderer.addToPixiStage(something, where);
            return something;
        },

        createDisplayObject: function(something, options) {
            return this.addSomethingToRenderer(something, $.extend(options, {dontAdd: true}))
        },

        removeSomethingFromRenderer: function(something, where) {
            where = where || something.myLayer || 'stage';
            currentGame.renderer.removeFromPixiStage(something, where);
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
            if(body.velocity.x < 0 && body.bounds.max.x < 0)
                return true;
            if(body.velocity.x > 0 && body.bounds.min.x > currentGame.canvasEl.getBoundingClientRect().width)
                return true;
            if(body.velocity.y > 0 && body.bounds.min.y > currentGame.canvasEl.getBoundingClientRect().height)
                return true;
            if(body.velocity.y < 0 && body.bounds.max.y < 0)
                return true;
        },

        isSpriteBelowStage: function(sprite) {
            var deletePointAdjustment = sprite.anchor.x * sprite.height;
            if(sprite.position.y - deletePointAdjustment > currentGame.canvas.height)
                return true;
            return false;
        },

        getRandomPlacementWithinCanvasBounds: function() {
            var placement = {};
            placement.x = Math.random() * currentGame.canvasEl.getBoundingClientRect().width;
            placement.y = Math.random() * currentGame.canvasEl.getBoundingClientRect().height;
            return placement;
        },

        addRandomVariationToGivenPosition: function(position, randomFactorX, randomFactorY) {
            position.x += (1 - 2*Math.random()) * randomFactorX;
            position.y += (1 - 2*Math.random()) * (randomFactorY || randomFactorX);
            return position;
        },

        addAmbientLightsToBackground: function(hexColorArray, where, intensity) {
            var numberOfLights = hexColorArray.length;
            var spacing = this.getCanvasWidth()/(numberOfLights*2);
            $.each(hexColorArray, function(i, color) {
                this.addSomethingToRenderer("AmbientLight" + (i%3 + 1), where || 'backgroundOne',
                    {position: this.addRandomVariationToGivenPosition({x: ((i+1)*2-1) * spacing, y: this.getCanvasHeight()/2}, 300/numberOfLights, 300), tint: color, alpha: intensity || .25});
            }.bind(this))
        },

        //apply something to bodies by team
        applyToBodiesByTeam: function(teamPredicate, bodyPredicate, f) {
            teamPredicate = teamPredicate || function(team) {return true};
            bodyPredicate = bodyPredicate || function(body) {return true};
            $.each(currentGame.bodiesByTeam, function(i, team) {
                if(teamPredicate(i)) {
                    $.each(team, function(i, body) {
                        if(bodyPredicate(body)) {
                            f(body);
                        }
                    })
                }
            })
        },

        calculateRandomPlacementForBodyWithinCanvasBounds: function(body, neatly) {
            var placement = {};
            var bodyWidth = (body.bounds.max.x - body.bounds.min.x);
            var XRange = Math.floor(this.getCanvasWidth()/bodyWidth);
            var bodyHeight = (body.bounds.max.y - body.bounds.min.y);
            var YRange = Math.floor(this.getCanvasHeight()/bodyHeight);
            var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
            var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
            if(neatly) {
                var Xtile = this.getIntBetween(0, XRange-1);
                var Ytile = this.getIntBetween(0, YRange-1);
                placement.x = Xtile*bodyWidth + bodyHalfWidth;
                placement.y = Ytile*bodyHeight + bodyHalfHeight;
            } else {
                placement.x = Math.random() * (currentGame.canvasEl.getBoundingClientRect().width - bodyHalfWidth*2) + bodyHalfWidth;
                placement.y = Math.random() * (currentGame.canvasEl.getBoundingClientRect().height - bodyHalfHeight*2) + bodyHalfHeight;
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
            placement.x = Math.random() * (currentGame.canvasEl.getBoundingClientRect().width - bodyHalfWidth*2) + bodyHalfWidth;
            placement.y = Math.random() * (currentGame.canvasEl.getBoundingClientRect().height - bodyHalfHeight*2) + bodyHTalfHeight;
            Matter.Body.setPosition(body, placement);
            return placement;
        },

        placeBodyWithinRadiusAroundCanvasCenter: function(body, radius) {
            //if we've added a unit, call down to its body
            if(body.isUnit) {
                body = body.body;
            }
            var placement = {};
            var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
            var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
            canvasCenter = this.getCanvasCenter();
            placement.x = canvasCenter.x-radius + (Math.random() * (radius*2 - bodyHalfWidth*2) + bodyHalfWidth);
            placement.y = canvasCenter.y-radius + (Math.random() * (radius*2 - bodyHalfHeight*2) + bodyHalfHeight);
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
          return {x: currentGame.canvasEl.getBoundingClientRect().width/2, y: currentGame.canvasEl.getBoundingClientRect().height/2};
        },

        getCanvasHeight: function() {
          return currentGame.canvasEl.getBoundingClientRect().height;
        },

        getCanvasWidth: function() {
          return currentGame.canvasEl.getBoundingClientRect().width;
        },

        getCanvasWH: function() {
          return {x: this.getCanvasWidth(), y: this.getCanvasHeight()};
        },

        getSound: function(name, options) {
            options = options || {};
            options.src = '/app/Sounds/' + name;
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

        floatSprite: function(sprite) {
            sprite.alpha = 1.4;
            currentGame.addTimer({name: this.uuidv4(), timeLimit: 16, runs: 34, callback: function() {
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
            var startGameText = utils.addSomethingToRenderer("TEXT:"+text, 'hud', {style: options.style || newStyle, x: this.canvas.width/2, y: this.canvas.height/2});
            startGameText.position = position;
            startGameText.alpha = 1.4;
            currentGame.addTimer({name: this.uuidv4(), timeLimit: 32, runs: options.runs || 30, callback: function() {
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

        setCursorStyle: function(style) {
            $('*').css('cursor', style);
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

        //method to normalize setting a matter js body
        setVelocity: function(body, velocity) {
            //normalize to 16.6666 ms per frame
            var normalizedVelocity = (currentGame.engine.delta / (1000/60)) * velocity;
            Matter.Body.setVelocity(body, normalizedVelocity);
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
            var originAngle = Matter.Vector.angle(origin, orientation || {x: origin.x, y: origin.y + 1});
            var destAngle = Matter.Vector.angle(origin, {x: destination.x, y: (origin.y + (origin.y-destination.y))});

            return originAngle - destAngle;
        },

        angleBetweenTwoVectors: function(vecA, vecB) {
            return Math.acos((Matter.Vector.dot(vecA, vecB)) / (Matter.Vector.magnitude(vecA) * Matter.Vector.magnitude(vecB)))
        },

        //death pact currently supports other units, bodies, tick callbacks, timers, and finally functions to execute
        //it will also search for an existing slave with the given id and replace it with the incoming slave
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

    return utils;
})
