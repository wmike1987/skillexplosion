import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import dissolveShader from '@shaders/DissolveShader.js'

/*
 * This module represents a scene.
 * A scene is simply a collection of game objects that are grouped together because they exist together
 */

var Scene = function() {
    this.id = mathArrayUtils.uuidv4();
    this.objects = [];
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
    })
    Matter.Events.trigger(this, 'initialize');
};

Scene.prototype.hide = function() {
    this.objects.forEach((obj) => {
        if(!obj.hideImmune) {
            obj.visible = false;
        }
    })
}

Scene.prototype.addBlackBackground = function(where) {
    var background = graphicsUtils.createDisplayObject('TintableSquare', {where: where || 'hudTwo', anchor: {x: 0, y: 0}});
    background.tint = 0x000000;
    graphicsUtils.makeSpriteSize(background, gameUtils.getCanvasWH());
    background.hideImmune = true;
    this.add(background);
}

Scene.prototype.add = function(objOrArray) {
    if(!$.isArray(objOrArray)) {
        objOrArray = [objOrArray];
    }
    $.merge(this.objects, objOrArray);
};

Scene.prototype.clear = function() {
    $.each(this.objects, function(i, obj) {
        if(obj.cleanUp) {
            obj.cleanUp();
        } else {
            graphicsUtils.removeSomethingFromRenderer(obj);
        }
    })
    if(this._clearExtension) {
        this._clearExtension();
    }
    this.objects = [];
};

var SceneModes = {
    BLACK: 'BLACK',
    FADE_AWAY: 'FADE_AWAY',
}

/*
 * options: {
 *  newScene: scene to transition to
 *  transitionLength: millis
 * }
 * Or just options == the new scene
 */
Scene.prototype.transitionToScene = function(options) {
    var newScene = null;
    var transitionLength = 800;
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
        var currentGame = globals.currentGame;
        const renderTexture = new PIXI.RenderTexture.create(gameUtils.getCanvasWidth(), gameUtils.getCanvasHeight());
        const transitionSprite = new PIXI.Sprite(renderTexture);
        var rStage = options.renderStage ? globals.currentGame.renderer.layers[options.renderStage] : globals.currentGame.renderer.pixiApp.stage;
        var renderer = globals.currentGame.renderer.pixiApp.renderer;
        renderer.render(rStage, renderTexture)
        graphicsUtils.addSomethingToRenderer(transitionSprite, "transitionLayer");

        inRuns = 1;
        iterTime = 32
        runs = transitionLength/iterTime;
        var dShader = new PIXI.Filter(null, dissolveShader, {
            a: Math.random()*10 + 10,
            b: 10,
            c: 555555,
            progress: 1.0,
            screenSize: gameUtils.getPlayableWH(),
            gridSize: 8,
        });
        globals.currentGame.renderer.layers.transitionLayer.filters = [dShader];

        fadeIn = function() {};
        fadeOut = function() {
            dShader.uniforms.progress -= 1/(transitionLength/iterTime);
        }

        cleanUp = function() {
            graphicsUtils.removeSomethingFromRenderer(transitionSprite);
            globals.currentGame.renderer.layers.transitionLayer.filters = [];
        }
    }

    globals.currentGame.addTimer({name: 'sceneIn' + this.id, runs: inRuns || runs, timeLimit: iterTime, killsSelf: true, callback: function() {
        fadeIn();
    }.bind(this), totallyDoneCallback: function() {
        Matter.Events.trigger(this, 'clear');
        this.clear();
        newScene.initializeScene();
        globals.currentGame.addTimer({name: 'sceneOut' + this.id, runs: runs, timeLimit: iterTime, killsSelf: true, callback: function() {
            fadeOut();
        }.bind(this), totallyDoneCallback: function() {
            cleanUp();
        }.bind(this)})
    }.bind(this)});
};

export default Scene;
