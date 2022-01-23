import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {globals} from '@core/Fundamental/GlobalState.js';
import dissolveShader from '@shaders/DissolveShader.js';
import circleDissolveShader from '@shaders/CircleDissolveShader.js';
import sideSwipeShader from '@shaders/SideSwipeShader.js';

/*
 * This module represents a scene.
 * A scene is simply a collection of game objects that are grouped together because they exist together
 */
var Scene = function() {
    this.id = mathArrayUtils.uuidv4();
    this.objects = [];
    this.cleanUpTasks = [];
    this.isScene = true;
    this.initialized = false;
    globals.currentGame.upcomingScene = this;
};

var _exectuteObject = function(obj) {
    if(obj.initialize && !obj.initialized) {
        obj.initialize();
    } else if(typeof obj == 'function'){
        obj();
    } else {
        graphicsUtils.addSomethingToRenderer(obj);
    }
};

Scene.prototype.initializeScene = function(objOrArray) {
    $.each(this.objects, function(i, obj) {
        _exectuteObject(obj);
    });

    this.initialized = true;
    Matter.Events.trigger(this, 'initialize');
};

Scene.prototype.hide = function() {
    this.objects.forEach((obj) => {
        if(!obj.hideImmune) {
            obj.visible = false;
        }
    });
};

Scene.prototype.addBlackBackground = function(options) {
    options = options || {};
    var background = graphicsUtils.createDisplayObject('TintableSquare', {where: options.where || 'hudTwo', anchor: {x: 0, y: 0}});
    background.tint = 0x000000;

    background.alpha = options.alpha || 1;
    if(options.fadeDuration) {
        graphicsUtils.fadeSpriteOverTime({fadeIn: true, sprite: background, time: options.fadeDuration, noKill: true, makeVisible: true});
    }
    graphicsUtils.makeSpriteSize(background, gameUtils.getCanvasWH());
    background.hideImmune = true;
    this.add(background);
};

Scene.prototype.add = function(objOrArray) {
    //allow for adding whole scenes to scenes here
    if(objOrArray.isScene) {
        objOrArray = objOrArray.objects;
    }

    //convert to array
    if(!$.isArray(objOrArray)) {
        objOrArray = [objOrArray];
    }

    $.merge(this.objects, objOrArray);

    //if our scene is already in play, execute the added object(s)
    if(this.initialized) {
        var arry = mathArrayUtils.convertToArray(objOrArray);
        arry.forEach((item) => {
            _exectuteObject(item);
        });
    }
};

Scene.prototype.addCleanUpTask = function(f) {
    this.cleanUpTasks.push(f);
};

Scene.prototype.clear = function() {
    $.each(this.objects, function(i, obj) {
        if(obj.cleanUp) {
            obj.cleanUp();
        } else {
            graphicsUtils.removeSomethingFromRenderer(obj);
        }
    });

    $.each(this.cleanUpTasks, function(i, obj) {
        obj();
    });

    if(this._clearExtension) {
        this._clearExtension();
    }
    this.objects = [];
    this.cleanUpTasks = [];
    //Since this fadeTimer callback on the newScene has its context as the current scene
    //there was a chain of scenes held together by the bound 'this'. Aka a memory leak.
    this.fadeTimer = null;
};

//search through objects and scene containers to get a list of no zones
Scene.prototype.getNoZones = function(options) {
    options = options || {};
    var noZones = [];

    this.objects.forEach((obj) => {
        if(obj.getNoZone) {
            let noZ = obj.getNoZone();
            if(noZ) {
                noZones.push(noZ);
            }
        } else if(obj.isSceneContainer) {
            obj.list.forEach((subObj) => {
                if(subObj.getNoZone) {
                    let noZ = subObj.getNoZone();
                    if(noZ) {
                        noZones.push(noZ);
                    }
                }
            });
        }
    });

    return noZones;
};


var SceneModes = {
    BLACK: 'BLACK',
    FADE_AWAY: 'FADE_AWAY',
    SIDE: 'SIDE',
};

/*
 * options: {
 *  newScene: scene to transition to
 *  transitionLength: millis
 * }
 * Or just options == the new scene
 */
Scene.prototype.transitionToScene = function(options) {
    var newScene = null;
    var transitionLength = 1200;
    var mode = SceneModes.FADE_AWAY;
    if(options.isScene) {
        newScene = options;
    } else {
        newScene = options.newScene;
        transitionLength = options.transitionLength || transitionLength;
        mode = options.mode || mode;
    }

    globals.currentGame.currentScene = newScene;

    //define transition vars
    var iterTime;
    var fadeIn = null;
    var fadeOut = null;
    var cleanUp = null;
    var inRuns = null;
    var runs = null;
    if(mode == SceneModes.BLACK) {
        var tintDO = graphicsUtils.createDisplayObject('TintableSquare', {where: 'transitionLayer'});
        graphicsUtils.addSomethingToRenderer(tintDO);
        tintDO.position = gameUtils.getCanvasCenter();
        tintDO.tint = 0x000000;
        tintDO.alpha = 0;
        graphicsUtils.makeSpriteSize(tintDO, gameUtils.getCanvasWH());
        iterTime = 32;
        runs = transitionLength/iterTime;
        fadeIn = function() {
            tintDO.alpha += (1 / (transitionLength/iterTime));
        };
        fadeOut = function() {
            tintDO.alpha -= (1 / (transitionLength/iterTime));
        };
        cleanUp = function() {
            graphicsUtils.removeSomethingFromRenderer(tintDO);
        };
    } else if(mode == SceneModes.FADE_AWAY) {
        let currentGame = globals.currentGame;
        const renderTexture = new PIXI.RenderTexture.create({width: gameUtils.getRealCanvasWidth(), height: gameUtils.getRealCanvasHeight()});
        const transitionSprite = new PIXI.Sprite(renderTexture);
        let rStage = options.renderStage ? globals.currentGame.renderer.layers[options.renderStage] : globals.currentGame.renderer.pixiApp.stage;
        let renderer = globals.currentGame.renderer.pixiApp.renderer;

        //temporarily set the scale
        renderer.render(rStage, renderTexture, false, null, true);

        graphicsUtils.addSomethingToRenderer(transitionSprite, "transitionLayer");
        transitionSprite.scale.x = 1/globals.currentGame.renderer.screenScaleFactor;
        transitionSprite.scale.y = 1/globals.currentGame.renderer.screenScaleFactor;

        inRuns = 1;
        iterTime = 32;
        runs = transitionLength/iterTime;

        let dShader = new PIXI.Filter(null, circleDissolveShader, {
            a: Math.random()*10 + 10,
            b: 10,
            c: 555555,
            progress: 1.0,
            screenSize: gameUtils.getRealCanvasWH(),
            centerPoint: mathArrayUtils.scalePositionToScreenCoordinates(options.centerPoint) || gameUtils.getRealCanvasCenter(),
            gridSize: 2,
            fadeIn: options.fadeIn
        });
        globals.currentGame.renderer.layers.transitionLayer.filters = [dShader];

        fadeIn = function() {};
        let totalTime = 0;
        fadeOut = function(delta) {
            totalTime += delta;
            dShader.uniforms.progress = 1.0 - (totalTime/transitionLength);
        };

        cleanUp = function() {
            graphicsUtils.removeSomethingFromRenderer(transitionSprite);
            globals.currentGame.renderer.layers.transitionLayer.filters = [];
        };
    } else if(mode == SceneModes.SIDE) {
        let currentGame = globals.currentGame;
        const renderTexture = new PIXI.RenderTexture.create({width: gameUtils.getCanvasWidth(), height: gameUtils.getCanvasHeight()});
        const transitionSprite = new PIXI.Sprite(renderTexture);
        let rStage = options.renderStage ? globals.currentGame.renderer.layers[options.renderStage] : globals.currentGame.renderer.pixiApp.stage;
        let renderer = globals.currentGame.renderer.pixiApp.renderer;

        renderer.render(rStage, renderTexture, false, null, true);

        graphicsUtils.addSomethingToRenderer(transitionSprite, "transitionLayer");
        transitionSprite.scale.x = 1/globals.currentGame.renderer.screenScaleFactor;
        transitionSprite.scale.y = 1/globals.currentGame.renderer.screenScaleFactor;

        inRuns = 1;
        iterTime = 32;
        runs = transitionLength/iterTime;

        var dShader = new PIXI.Filter(null, sideSwipeShader, {
            progress: 0.0,
            screenSize: gameUtils.getRealCanvasWH(),
            leftToRight: options.leftToRight === false ? false : true
        });
        globals.currentGame.renderer.layers.transitionLayer.filters = [dShader];

        fadeIn = function() {};
        let totalTime = 0;
        fadeOut = function(delta) {
            totalTime += delta;
            totalTime += delta;
            dShader.uniforms.progress = totalTime/transitionLength;
        };

        cleanUp = function() {
            graphicsUtils.removeSomethingFromRenderer(transitionSprite);
            globals.currentGame.renderer.layers.transitionLayer.filters = [];
        };
    }

    Matter.Events.trigger(this, 'sceneFadeOutBegin');
    Matter.Events.trigger(newScene, 'sceneFadeInBegin');
    // Matter.Events.trigger(newScene, 'sceneFadeInBegin');
    newScene.fadeTimer = globals.currentGame.addTimer({name: 'sceneIn' + this.id, runs: inRuns || runs, timeLimit: iterTime, killsSelf: true, tickCallback: function(delta) {
        //fade in (this isn't actually used at the moment)
        fadeIn(delta);
    }.bind(this), totallyDoneCallback: function() {
        //when the 'fade in' is done (should be instantly), we will clear this scene, and initialize the next scene (the screen will be 'covered' by the render texture)
        this.clear();
        newScene.initializeScene();

        //start the fade out of the render texture
        globals.currentGame.addTimer({name: 'sceneOut' + this.id, timeLimit: transitionLength, killsSelf: true, tickCallback: function(delta) {
            fadeOut(delta);
        }.bind(this), totallyDoneCallback: function() {
            Matter.Events.trigger(this, 'sceneFadeOutDone');
            Matter.Events.trigger(newScene, 'sceneFadeInDone');
            cleanUp();
        }.bind(this)});
    }.bind(this)});
    Matter.Events.trigger(newScene, 'afterSnapshotRender', {});
};

var SceneContainer = function() {
    this.list = [];
    this.isSceneContainer = true;

    this.addObject = function(obj) {
        this.list.push(obj);
    };

    this.removeObject = function(obj) {
        mathArrayUtils.removeObjectFromArray(obj, this.list);
    };

    this.initialize = function() {
        this.list.forEach(function(obj) {
            _exectuteObject(obj);
            if(obj.sceneInit) {
                obj.sceneInit();
            }
        });
    };

    this.cleanUp = function() {
        this.list.forEach(function(obj) {
            if(obj.cleanUp) {
                obj.cleanUp();
            } else {
                graphicsUtils.removeSomethingFromRenderer(obj);
            }
        });
    };
};

export {Scene, SceneContainer};
