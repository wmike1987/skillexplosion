/*
 * This module runs a CommonGame implementation, taking care of the business of setting up the Matter.js world and
 * setting up the pixi renderer. It also ensures assets have been loaded before initiating the game lifecycle
 */
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import PixiRenderer from '@core/Fundamental/PixiRenderer.js';
import {
    globals,
    keyStates
} from '@core/Fundamental/GlobalState.js';
import GameLoop from '@core/Fundamental/GameLoop.js';
import StyleLoader from '@core/Fundamental/StyleLoader.js';

var pixiRenderer;
var engine;
var pendingGame;
var CommonGameStarter = function(game) {

    //default world options
    var defaultWorldOptions = {
        interpolate: true,
        width: 1200,
        height: 600,
        unitPanelHeight: 0,
        gravity: 1,
        appendToElement: "gameTheater"
    };
    var latestGameWorldOptions = $.extend({}, defaultWorldOptions, game.worldOptions);

    /*****************************
     * Destroy previous components
     *****************************/

    //kill previous engine
    if (engine)
        Matter.Runner.stop(engine.runner);

    //kill previous renderer
    if (pixiRenderer)
        pixiRenderer.destroy();

    $('#gameTheater').empty();

    /********************************
     * Create the new game components
     ********************************/
    //set the global current game
    globals.currentGame = game;
    keyStates.initializeListeners();
    window.currentGame = globals.currentGame;

    //create the Matter engine
    engine = Matter.Engine.create({
        enableSleeping: false
    });
    engine.world.gravity.y = latestGameWorldOptions.gravity;

    //create our game loop (default step rate is 60fps) and start the loop
    var gameLoop = new GameLoop({
        interpolate: latestGameWorldOptions.interpolate,
        engine: engine,
        isFixed: true
    });
    gameLoop.start();

    // Start the renderer: this starts the pixi Application and establishes a callback to update sprites with an associated body (event triggered by the GameLoop)
    pixiRenderer = new PixiRenderer(engine, latestGameWorldOptions);
    pixiRenderer.start();

    //initialize the game with the new components
    game.commonGameInitialization(Object.assign({
        world: engine.world,
        engine: engine,
        gameLoop: gameLoop,
        canvasEl: pixiRenderer.canvasEl,
        renderer: pixiRenderer,
        background: pixiRenderer.background
    }, latestGameWorldOptions));

    //show game loading screen
    var ret = game.showLoadingScreen();
	let splashScreenDeferred = ret.splashScreenDeferred;
	let progressFunction = ret.loaderProgressFunction;

	//once our loading screen is visible, begin loading all assets
    splashScreenDeferred.done(() => {
        let loader = game.loadAssets();
        let loaderDef = loader.loaderDeferred;

        //update the "loading..." text as assets are loaded
        if (loaderDef.state() == 'pending') {
            var loadingCallback = loader.onLoad.add(() => {
                progressFunction(loader);
            });
        }

        //create one response to asset loading completion
        if (!pendingGame) {
            pendingGame = true;
            loaderDef.done(() => {
                //now load specific styles
                StyleLoader.load([]);

                pendingGame = false;
                if (loadingCallback) {
                    loadingCallback.detach();
                }

                //pause the renderer when the game loop is paused
                gameLoop.onPause(function() {
                    pixiRenderer.pause();
                });

                gameLoop.onResume(function() {
                    pixiRenderer.resume();
                });

                //Run through the Common Game Lifecycle. postAssetLoadInit() --> pregame() ---Deferred.done---> startGame() ---Deferred.done---> endGame()
                game.postAssetLoadInit();

                game.preGame();
            });
        }
    });
};

export default CommonGameStarter;
