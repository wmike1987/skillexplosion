import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import utils from '@utils/GameUtils.js'
import {globals} from '@core/GlobalState.js'

/*
 * This module represents a scene.
 * A scene is simply a collection of game objects that are grouped together because they exist together
 *
 *
 */

var Scene = function() {
    this.id = utils.uuidv4();
    this.objects = [];
    this.isScene = true;
};

Scene.prototype.initializeScene = function(objOrArray) {
    $.each(this.objects, function(i, obj) {
        if(obj.initialize && !obj.initialized) {
            obj.initialize();
        } else {
            utils.addSomethingToRenderer(obj);
        }
    })
    Matter.Events.trigger(this, 'initialize');
};

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
            utils.removeSomethingFromRenderer(obj);
        }
    })
    if(this._clearExtension) {
        this._clearExtension();
    }
    this.objects = [];
};

/*
 * options: {
 *  newScene: scene to transition to
 *  transitionLength: millis
 *
 * }
 */
Scene.prototype.transitionToScene = function(options) {
    var newScene = null;
    var transitionLength = 1000;
    if(options.isScene) {
        newScene = options;
    } else {
        newScene = options.newScene;
        transitionLength = options.transitionLength || transitionLength;
    }

    this.tint = utils.addSomethingToRenderer('TintableSquare', 'hudText');
    this.tint.position = utils.getCanvasCenter();
    this.tint.tint = 0x000000;
    this.tint.alpha = 0;
    utils.makeSpriteSize(this.tint, utils.getCanvasWH());
    var tintDuration = 50;
    var tintRuns = transitionLength/tintDuration;

    //experiment with filter transitions
    //this.renderer.stage
    // var renderer = PIXI.autoDetectRenderer();
    // var transitionImage = PIXI.RenderTexture.create(utils.getCanvasWidth(), utils.getCanvasHeight());
    // renderer.render(globals.currentGame.renderer.stage, transitionImage);
    //
    // utils.addSomethingToRenderer(transitionImage, {where: 'hud', scale: {x: 1, y: 1}});



    globals.currentGame.addTimer({name: 'tint' + this.id, runs: tintRuns, timeLimit: tintDuration, killsSelf: true, callback: function() {
        this.tint.alpha += 1/tintRuns;
        if(this.tint.alpha > 1) {
            this.tint.alpha = 1;
        }
    }.bind(this), totallyDoneCallback: function() {
        Matter.Events.trigger(this, 'clear');
        this.clear();
        newScene.initializeScene();
        globals.currentGame.addTimer({name: 'untint' + this.id, runs: tintRuns, timeLimit: tintDuration, killsSelf: true, callback: function() {
            this.tint.alpha -= 1/tintRuns;
            if(this.tint.alpha < 0) {
                this.tint.alpha = 0;
            }
        }.bind(this)})
    }.bind(this)});
};

export default Scene;
