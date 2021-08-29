import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
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
};

Scene.prototype.initializeScene = function(objOrArray) {
    $.each(this.objects, function(i, obj) {
        if(obj.initialize && !obj.initialized) {
            obj.initialize();
        } else if(typeof obj == 'function'){
            obj();
        } else {
            graphicsUtils.addSomethingToRenderer(obj);
        }
    });
    Matter.Events.trigger(this, 'initialize');
};

Scene.prototype.hide = function() {
    this.objects.forEach((obj) => {
        if(!obj.hideImmune) {
            obj.visible = false;
        }
    });
};

Scene.prototype.addBlackBackground = function(where) {
    var background = graphicsUtils.createDisplayObject('TintableSquare', {where: where || 'hudTwo', anchor: {x: 0, y: 0}});
    background.tint = 0x000000;
    graphicsUtils.makeSpriteSize(background, gameUtils.getCanvasWH());
    background.hideImmune = true;
    this.add(background);
};

Scene.prototype.add = function(objOrArray) {
    if(!$.isArray(objOrArray)) {
        objOrArray = [objOrArray];
    }
    $.merge(this.objects, objOrArray);
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
        const renderTexture = new PIXI.RenderTexture.create({width: gameUtils.getCanvasWidth(), height: gameUtils.getCanvasHeight()});
        const transitionSprite = new PIXI.Sprite(renderTexture);
        let rStage = options.renderStage ? globals.currentGame.renderer.layers[options.renderStage] : globals.currentGame.renderer.pixiApp.stage;
        let renderer = globals.currentGame.renderer.pixiApp.renderer;

        renderer.render(rStage, renderTexture, false, null, true);

        graphicsUtils.addSomethingToRenderer(transitionSprite, "transitionLayer");

        inRuns = 1;
        iterTime = 32;
        runs = transitionLength/iterTime;

        let dShader = new PIXI.Filter(null, circleDissolveShader, {
            a: Math.random()*10 + 10,
            b: 10,
            c: 555555,
            progress: 1.0,
            screenSize: gameUtils.getPlayableWH(),
            centerPoint: options.centerPoint || gameUtils.getCanvasCenter(),
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

        inRuns = 1;
        iterTime = 32;
        runs = transitionLength/iterTime;

        var dShader = new PIXI.Filter(null, sideSwipeShader, {
            progress: 0.0,
            screenSize: gameUtils.getPlayableWH(),
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

export default Scene;
