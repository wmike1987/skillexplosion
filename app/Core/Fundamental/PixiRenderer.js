/*
 * Customer pixi renderer, coupled to matter.js - Author: wmike1987
 */
import * as PIXI from 'pixi.js';
import * as PIXI_UTILS from '@pixi/utils';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    PIXIHooks,
    StatsJSAdapter
} from 'gstats';
import Stats from 'stats.js';

//main renderer module
var renderer = function(engine, options) {
    options = options || {};
    var appendToElement = options.appendToElement || document.body;

    this.engine = engine;

    //create stages (these don't handle sorting, see the laying group below)
    this.stages = {
        background: new PIXI.Container(),
        backgroundOne: new PIXI.Container(),
        stageNTwo: new PIXI.Container(),
        stageNOne: new PIXI.Container(),
        stage: new PIXI.Container(),
        stageOne: new PIXI.Container(),
        stageTwo: new PIXI.Container(),
        stageThree: new PIXI.Container(),
        stageTrees: new PIXI.Container(),
        foreground: new PIXI.Container(),
        foregroundOne: new PIXI.Container(),
        hudNTwo: new PIXI.Container(),
        hudNOne: new PIXI.Container(),
        hud: new PIXI.Container(),
        hudOne: new PIXI.Container(),
        hudTwo: new PIXI.Container(),
        hudThree: new PIXI.Container(),
        hudText: new PIXI.Container(),
        hudTextOne: new PIXI.Container(),
        transitionLayer: new PIXI.Container()
    };

    //texture name to atlas cache
    this.texAtlCache = {};

    //bitmap font cache
    this.bitmapFontCache = {};

    //create the layering groups
    var i = 0;
    this.layerGroups = {};
    $.each(this.stages, function(key, stage) {
        stage.stageName = key;
        this.layerGroups[key] = new PIXI.display.Group(i, !options.noZSorting);
        this.layerGroups[key].on('sort', (sprite) => {
            sprite.zOrder = sprite.y + (sprite.sortYOffset || 0);
        });
        i += 1;
    }.bind(this));

    //create the display stage
    this.stage = new PIXI.display.Stage();

    //Add the stages, and create a layer for the associated group as well. The layer API is very confusing...
    this.layers = {};
    $.each(this.layerGroups, function(key, layerGroup) {
        this.layers[key] = new PIXI.display.Layer(layerGroup);
        this.stage.addChild(this.layers[key]);
        this.stage.addChild(this.stages[key]);
    }.bind(this));

    this.setBackground = function(imagePath, options) {
        var background = this.itsMorphinTime(imagePath);

        background.filters = [];
        if (options.backgroundFilter) {
            background.filters = [options.backgroundFilter];
            options.backgroundFilter.uniforms.mouse = {
                x: -50.0,
                y: -50.0
            };
            options.backgroundFilter.uniforms.resolution = {
                x: this.pixiApp.screen.width,
                y: this.pixiApp.screen.height
            };
        }

        background.isBackground = true;
        background.scale.x = options.scale.x;
        background.scale.y = options.scale.y;

        if (options.bloat) {
            background.scale.x = options.scale.x + 0.1;
            background.scale.y = options.scale.y + 0.1;
            background.position.x = -5;
            background.position.y = -5;
        }
        this.addToPixiStage(background, 'background');
        this.background = background;
    };

    this.pause = function() {
        this.paused = true;
        this.pixiApp.stop();
    };

    this.resume = function() {
        this.paused = false;
        this.pixiApp.ticker.lastTime = performance.now();
        this.pixiApp.start();
    };

    this.renderWorld = function(engine, tickEvent) {
        var bodies = Matter.Composite.allBodies(engine.world);

        bodies.forEach(function(body) {
            var drawPosition = null;
            if (tickEvent.interpolate && !body.oneFrameOverrideInterpolation && !body.dontInterpolate) {
                drawPosition = interpolatePosition(body, tickEvent.percentOfNextFrame);
            } else {
                body.oneFrameOverrideInterpolation = false;
                drawPosition = body.position;
            }
            body.lastDrawPosition = drawPosition;

            //prevent spinning if specified
            if (body.zeroOutAngularVelocity)
                body.zeroOutAngularVelocity();

            if (!body.renderChildren) {
                body.renderChildren = [];
            }
            if (!body.renderlings) {
                body.renderlings = {};
            }

            //backwards compatibility
            if (body.render.sprite.texture) {
                body.renderChildren.push({
                    isLegacy: true,
                    data: body.render.sprite.texture,
                    offset: {
                        x: body.render.sprite.xOffset,
                        y: body.render.sprite.yOffset
                    },
                    tint: body.render.sprite.tint,
                    scale: {
                        x: body.render.sprite.xScale || 1,
                        y: body.render.sprite.yScale || 1
                    }
                });
                body.render.sprite.texture = null;
            }
            //loop through body's renderChildren to transform them into sprites. Ignores previously realized children.
            $.each(body.renderChildren, function(index, child) {
                this.realizeChild(body, child);
            }.bind(this));

            //loop through fully fledged sprites and latch them to the body's coordinates
            $.each(body.renderlings, function(property, sprite) {
                if (sprite.preferredBody && body != sprite.preferredBody) {
                    return;
                }

                if (sprite.independentRender) {
                    return;
                }

                if (body.softRemove) {
                    sprite.visible = false;
                    return;
                }

                sprite.position.x = drawPosition.x + sprite.offset.x;
                sprite.position.y = drawPosition.y + sprite.offset.y;

                //handle rotation
                if (sprite.behaviorSpecs && sprite.behaviorSpecs.rotate == 'continuous') {
                    sprite.rotation += 0.00075 * tickEvent.frameDelta;
                } else if (sprite.behaviorSpecs && sprite.behaviorSpecs.rotate == 'none') {
                    //do nothing
                } else if (sprite.behaviorSpecs && sprite.behaviorSpecs.rotate == 'random') {
                    if (sprite.behaviorSpecs.rotatePredicate && sprite.behaviorSpecs.rotatePredicate.apply(body.unit || body))
                        sprite.rotation = Math.random();
                } else if (sprite.behaviorSpecs && sprite.behaviorSpecs.rotate != null) {
                    //basic case of setting the rotate
                    sprite.rotation = sprite.behaviorSpecs.rotate;
                } else if (sprite.behaviorSpecs && sprite.behaviorSpecs.rotateFunction) {
                    sprite.behaviorSpecs.rotateFunction(sprite);
                } else {
                    sprite.rotation = body.angle + (sprite.initialRotate || 0);
                }
            });

            //if all else fails, draw wire frame if specified
            if (body.render.drawWire || body.renderChildren.length == 0 || body.drawWire) {
                if (body.noWire) return;
                this.drawWireFrame(body);
                return;
            }

        }.bind(this));
    };

    //interpolate position of Matter bodies
    var interpolatePosition = function(body, percentage) {
        var previousPosition = body.previousPosition || body.positionPrev;
        var currentPosition = body.position;

        var intPos = Matter.Vector.add(previousPosition, Matter.Vector.mult(Matter.Vector.sub(currentPosition, previousPosition), percentage));
        body.interpolatedPosition = intPos;
        // if(body.dontInterpolate) return body.position;
        return intPos;
    };

    /*
     * Function to be called by a consumer. Starts the renderer.
     */
    this.start = function() {

        //Init pixi and it's game loop, important to note that this loop happens after ours (ensuring renderWorld is called prior to this frame's rendering).
        //Also note that we're using the shared ticker, so upon starting our pixi app, we need to kill the shared ticker so that it starts up in the correct order
        //(otherwise it would have remained at the location that the original ticker started at)
        PIXI.Ticker._shared.destroy();
        PIXI.Ticker._shared = null;

        this.pixiApp = new PIXI.Application({
            sharedTicker: true,
            width: options.width,
            height: options.height + options.unitPanelHeight,
            backgroundAlpha: 0,
            antialias: true
        });
        // PIXI.settings.ROUND_PIXELS = true;
        this.canvasEl = this.pixiApp.renderer.view;

        var worldWidth = 1400;
        var worldHeight = 800;
        this.resizeFunction = function(event) {
            // var parent = $('#gameTheater')[0];
            // var styles = getComputedStyle(parent);
            // var w = parseInt(styles.getPropertyValue("width"), 10);
            // var h = parseInt(styles.getPropertyValue("padding-bottom"), 10);
            //
            // this.canvasEl.width = w;
            // this.canvasEl.height = h;
            // this.pixiApp.width = w;
            // this.pixiApp.height = h;
            //
            // this.pixiApp.renderer.resize(w, h);
            //
            // this.stage.scale.x = w / worldWidth;
            // this.stage.scale.y = h / worldHeight;
        }.bind(this);
        window.addEventListener('resize', this.resizeFunction);
        window.dispatchEvent(new Event('resize'));

        //destroy the accessibility plugin which was/is causing a div to appear and affects the browser's scroll bar
        this.pixiApp.renderer.plugins.accessibility.destroy();

        //add-on gstats (ctrl + shift + f to show)
        // var pixiHooks = new PIXIHooks(this.pixiApp);
        // window.Stats = Stats;
        // this.stats = new StatsJSAdapter(pixiHooks, window.stats);
        // document.body.appendChild(this.stats.stats.dom || this.stats.stats.domElement);
        // this.pixiApp.ticker.add(this.stats.update.bind(this.stats));
        // this.stats.stats.dom.style.visibility = 'hidden';

        //setup pixi interaction
        this.interaction = this.pixiApp.renderer.plugins.interaction;
        this.interaction.moveWhenInside = true;
        $(this.canvasEl).on('contextmenu', function(event) {
            return false;
        }); //disable right click menu on the canvas object
        this.stages.background.interactive = true;
        this.interactiveObject = this.stages.background;

        //set the pixiApp stage to be the display.Stage obj
        this.pixiApp.stage = this.stage;

        //add pixi canvas to dom
        appendToElement = '#' + appendToElement;
        $(appendToElement).append(this.pixiApp.renderer.view);

        //set background - probably shouldn't be handling this in the pixi renderer
        if (options.background)
            this.setBackground(options.background.image, {
                scale: {
                    x: options.background.scale.x,
                    y: options.background.scale.y
                },
                bloat: options.background.bloat,
                backgroundFilter: options.backgroundFilter
            });

        Matter.Events.on(this.engine.world, 'afterAdd', function(event) {
            if (Array.isArray(event.object)) {
                $.each(event.object, function(index, body) {
                    this.realizeBody(body);
                }.bind(this));
            } else {
                this.realizeBody(event.object);
            }
        }.bind(this));

        //setup engine listener to afterRemove
        Matter.Events.on(this.engine.world, 'afterRemove', function(event) {
            this.removeFromPixiStage(event.object[0]);
        }.bind(this));

        //update sprites after Matter.Runner tick
        Matter.Events.on(this.engine.runner, 'renderWorld', function(event) {
            this.renderWorld(this.engine, event);
        }.bind(this));

        //keep a pool of our resources
        this.texturePool = {};
        Matter.Events.on(globals.currentGame, 'assetsLoaded', function(event) {
            mathArrayUtils.operateOnObjectByKey(event.resources, function(key, value) {
                this.texturePool[key] = value;
            }.bind(this));
        }.bind(this));
    };

    //when a body is added to the matter world, initialize its renderlings
    this.realizeBody = function(body) {
        if (!body.renderChildren) return;
        $.each(body.renderChildren, function(index, child) {
            this.realizeChild(body, child);
        }.bind(this));
    }.bind(this);

    this.realizeChild = function(body, child) {
            if (child.isRealized) return;
            var newSprite = this.itsMorphinTime(child.data, child.options);
            if (!body.renderlings)
                body.renderlings = {};
            if (!child.id) child.id = Object.keys(body.renderlings).length;
            body.renderlings[child.id] = newSprite;

            //apply child options to sprite
            if (child.initialRotate == 'random') {
                newSprite.rotation = Math.random() * 5;
                newSprite.initialRotate = newSprite.rotation;
            }

            newSprite.offset = {
                x: 0,
                y: 0
            };

            if (child.offset) {
                newSprite.offset.x = child.offset.x;
                newSprite.offset.y = child.offset.y;
            }

            if (body.position) {
                newSprite.position.x = body.position.x + newSprite.offset.x;
                newSprite.position.y = body.position.y + newSprite.offset.y;
            }

            if (child.anchor) {
                newSprite.anchor.x = child.anchor.x;
                newSprite.anchor.y = child.anchor.y;
            } else if (newSprite.anchor) { //default to center of sprite is centered
                newSprite.anchor.x = 0.5;
                newSprite.anchor.y = 0.5;
            }
            if (child.scale) {
                newSprite.scale.x = child.scale.x;
                newSprite.scale.y = child.scale.y;
            }
            if (child.filter) {
                if ($.isArray(child.filter)) {
                    newSprite.filters = child.filter;
                } else {
                    if (child.filter.backgroundFilter) {
                        this.background.filters.push(child.filter);
                        newSprite.backgroundFilter = child.filter;
                    } else {
                        newSprite.filters = [child.filter];
                    }
                }
            }
            if (child.color && child.pluginName) {
                newSprite.pluginName = child.pluginName;
                newSprite.color = child.color;
            }
            if (child.alpha || child.alpha === 0.0) {
                newSprite.alpha = child.alpha;
            }
            if (child.gameFilter) {
                this.pixiApp.stage.filters = [child.gameFilter];
            }
            if (child.skew) {
                newSprite.skew = child.skew;
            }
            if (child.avoidIsoMgr) {
                newSprite.avoidIsoMgr = true;
            }
            if (child.sortYOffset) {
                newSprite.sortYOffset = child.sortYOffset;
            }

            //store original child specs
            newSprite.behaviorSpecs = {};
            $.extend(newSprite.behaviorSpecs, child);

            if (child.tint != null)
                newSprite.tint = child.tint;
            if (child.visible != null)
                newSprite.visible = child.visible;

            this.addToPixiStage(newSprite, child.stage || child.myLayer);

            if (child.isLegacy)
                body.renderling = newSprite;

            child.isRealized = true;
            return newSprite;
        };

        //accepts a matter body or just a pixi obj. Also works for a Unit object whose body renderlings-accessor gets the units renderlings.
        this.removeFromPixiStage = function(something, where) {
            something = something.renderlings ? Object.keys(something.renderlings).map(function(key) {
                return something.renderlings[key];
            }) : [something];
            $.each(something, function(i, obj) {
                if (obj.backgroundFilter) {
                    mathArrayUtils.removeObjectFromArray(obj.backgroundFilter, this.background.filters);
                }
                this.removeAndDestroyChild(this.stages[where || obj.myLayer || 'stage'], obj);
            }.bind(this));
        };

    this.addToPixiStage = function(something, where) {
        where = where || 'stage';
        something.myLayer = where;
        something.where = where;
        this.stages[where].addChild(something);
        something.parentGroup = this.layerGroups[where];
    };

    //Method meant to unify creating a sprite based on various input
    this.itsMorphinTime = function(something, options) {

        //If we're already a texture...
        if (something.baseTexture) {
            return new PIXI.Sprite(something);
        }

        //If user specified a string, locate the intended texture and turn it into a sprite
        if (typeof something === 'string') {

            //Text
            var textPlusId = 'TEXT:';
            if (something.indexOf(textPlusId) >= 0) {
                var t = new PIXI.Text(something.substring(something.indexOf(textPlusId) + 5), options.style);
                t.resolution = 1;
                return t;
            }

            //BitmapText
            var bitmapTextId = 'TEX+:';
            if (something.indexOf(bitmapTextId) >= 0) {
                var name = options.style.name;
                if (!this.bitmapFontCache[name]) {
                    // var t0 = performance.now();
                    this.bitmapFontCache[name] = PIXI.BitmapFont.from(name, options.style, {
                        resolution: 2,
                        chars: PIXI.BitmapFont.ASCII
                    });
                    // var t1 = performance.now();
                    // console.log("Call to bitmap.from for " + name + "took" + (t1 - t0) + " milliseconds.");
                }

                var newBMText = new PIXI.BitmapText(something.substring(something.indexOf(bitmapTextId) + 5), {
                    fontName: name
                });

                newBMText.roundPixels = true;

                return newBMText;
            }

            //Attempt to load from preloaded texture or spine asset
            if (this.texturePool[something]) {
                if (this.texturePool[something].texture) {
                    let ret = new PIXI.Sprite(this.texturePool[something].texture);
                    ret.creationTextureName = something;
                    return ret;
                } else {
                    let ret = new PIXI.spine.Spine(this.texturePool[something].spineData);
                    return ret;
                }
            } else { //Check for textures inside a texture atlas
                var foundAtlasTexture;
                $.each(this.texturePool, function(key, value) {
                    if (this.texAtlCache[something]) {
                        foundAtlasTexture = new PIXI.Sprite(this.texAtlCache[something]);
                        return false;
                    }

                    var foundTextureKey = null;
                    if (value.extension == 'json') {
                        if (something.indexOf('.png') < 0)
                            var pngSomething = something + '.png';
                        var jpgSomething = something + '.jpg';
                        if (value.textures && value.textures[something]) {
                            foundAtlasTexture = new PIXI.Sprite(value.textures[something]);
                            foundTextureKey = something;
                        } else if (value.textures && value.textures[pngSomething]) {
                            foundAtlasTexture = new PIXI.Sprite(value.textures[pngSomething]);
                            foundTextureKey = pngSomething;
                        } else if (value.textures && value.textures[jpgSomething]) {
                            foundAtlasTexture = new PIXI.Sprite(value.textures[jpgSomething]);
                            foundTextureKey = jpgSomething;
                        }
                    } else {
                        return;
                    }
                    if (foundAtlasTexture) {
                        if (!this.texAtlCache[something]) {
                            this.texAtlCache[something] = value.textures[foundTextureKey];
                        }
                        return false;
                    }
                }.bind(this));
                if (foundAtlasTexture) {
                    foundAtlasTexture.creationTextureName = something;
                    return foundAtlasTexture;
                }
            }

            //Lastly, just try and load a png from the Textures dir
            if (something.indexOf('.png') < 0) {
                something = something + '.png';
            }

            if (something.indexOf('/') < 0) {
                var texture = './Textures/' + something;
                return new PIXI.Sprite.from(texture);
            } else {
                return new PIXI.Sprite.from(something);
            }
        }

        return something;
    };

    //This is used to clear the pixi app while keeping the app alive. Here, we remove and destroy unwanted children but keep the stages (pixi containers)
    this.clear = function(noMercy, savePersistables) {
        if (noMercy) { //no mercy
            $.each(this.stages, function(key, value) {
                var i = this.stages[key].children.length;
                while (i--) {
                    //even though we're decrementing here, cleaning up pixi particles can remove more than one child at a time
                    //so getChildAt could fail. If it does, let's just move on
                    try {
                        this.removeAndDestroyChild(this.stages[key], this.stages[key].getChildAt(i));
                    } catch (err) {
                        //caught a child doesn't exist, which we just want to swallow and move on
                    }
                }
            }.bind(this));
            $(this.canvasEl).off('contextmenu');
        } else { //have mercy on background and on persistables if wanted
            $.each(this.stages, function(key, value) {
                if (key == "background") return;
                var i = this.stages[key].children.length;
                while (i--) {
                    //even though we're decrementing here, cleaning up pixi particles can remove more than one child at a time
                    //so getChildAt could fail. If it does, let's just move on
                    try {
                        if ((savePersistables && this.stages[key].getChildAt(i).persists)) {
                            continue;
                        }
                        this.removeAndDestroyChild(this.stages[key], this.stages[key].getChildAt(i));
                    } catch (err) {
                        //caught a child doesn't exist, which we just want to swallow and move on
                    }
                }
            }.bind(this));
        }
    };

    //helper method for removing the child from its parent and calling the destroy method on the object being removed
    this.removeAndDestroyChild = function(stage, child) {
        stage.removeChild(child);
        if (child.constructor === PIXI.particles.Emitter) {
            child.emitter.destroy();
        }
        if (child.constructor === PIXI.particles.Particle) {
            child.emitter.destroy();
            // child.destroy();
        } else if (child.destroy && !child._destroyed) {
            Matter.Events.trigger(child, 'destroy', {});
            child.destroy(); //i'm unsure if I need to check for a destroy method first
            // this.frequencyDestroyer.destroy(child);
        } else if (child._destroyed) {
            // console.info("removing object that's already been destroyed")
        }
    };

    //destroy the whole pixi app
    this.destroy = function() {
        if (this.pixiApp) {
            this.pixiApp.destroy(true, true);
        }

        //destroy texture cache
        PIXI_UTILS.destroyTextureCache();

        window.removeEventListener('resize', this.resizeFunction);
    };

    this.drawWireFrame = function(body) {
        if (!body.graphics)
            body.graphics = new PIXI.Graphics();

        var graphics = body.graphics;
        graphics.clear();

        graphics.beginFill(0xf1c40f);
        if (body.parts.length > 1) {
            $.each(body.parts, function(i, part) {
                //var graphics = new PIXI.Graphics();
                var vertices = [];
                if (i == 0) return;
                $.each(part.vertices, function(i, value) {
                    vertices.push(value.x);
                    vertices.push(value.y);
                });
                graphics.drawPolygon(vertices);
            }.bind(this));
        } else {
            //var graphics = new PIXI.Graphics();
            var vertices = [];
            $.each(body.vertices, function(i, value) {
                vertices.push(value.x);
                vertices.push(value.y);
            });
            graphics.drawPolygon(vertices);
        }
        graphics.endFill();
        this.addToPixiStage(graphics, 'hud');
    };
};

export default renderer;
