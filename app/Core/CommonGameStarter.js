/*
 * This module runs a CommonGame implementation, taking care of the business of setting up the Matter.js world and
 * setting up the pixi renderer. It also ensures assets have been loaded before initiating the game lifecycle
 */
import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import PixiRenderer from '@core/PixiRenderer.js'
import {globals} from '@core/GlobalState.js'
import GameLoop from '@core/GameLoop.js'
import AssetLoader from '@core/AssetLoader.js'

var pixiRenderer;
var engine;
var pendingGame;
var CommonGameStarter = function(game) {

	//kick off asset loading...
	AssetLoader(game.assets);

	var defaults = {interpolate: true, width: 1200, height: 600, unitPanelHeight: 0, gravity: 1, appendToElement: "gameTheater"};
	window.latestGameOptions = $.extend({}, defaults, game.worldOptions);

	//kill engine and renderer
	if(engine)
	    Matter.Runner.stop(engine.runner);

	if(pixiRenderer)
		pixiRenderer.destroy();

	/*
	 * Game requests could be spammed by someone thus throwing all sorts of stuff out of whack
	 * when tackling the asset loading delay. We'll setup just one deferred to execute
	 * when asset loading is done and a flurry of game starts will merely update which game (and options)
	 * were requested
	 */

	// set a globally accessible reference to the game object
	globals.currentGame = game;

	//update the "loading..." text as assets are loaded
	if(PIXI.Loader.shared.loaderDeferred.state() == 'pending') {
		$('#gameTheater').text("Loading");
		var loadingCallback = PIXI.Loader.shared.onLoad.add(() => {
		    $('#gameTheater').text($('#gameTheater').text() + '.');
		}); // called once per loaded/errored filec
	}

	//create one response to asset loading completion
	if(!pendingGame) {
        pendingGame = true;
		PIXI.Loader.shared.loaderDeferred.done(() => {
		    pendingGame = false;
		    if(loadingCallback) {
		        $('#gameTheater').empty();
		        loadingCallback.detach();
		    }

			//create our Matter engine
		    engine = Matter.Engine.create({enableSleeping: false});
    		engine.world.gravity.y = window.latestGameOptions.gravity;

			//create our game loop (default step rate is 60fps) and start the loop
			var gameLoop = new GameLoop({interpolate: window.latestGameOptions.interpolate, engine: engine, isFixed: true});
			gameLoop.start();
			game.gameLoop = gameLoop;

    		// Start the renderer: this starts the pixi Application and establishes a callback to update sprites with an associated body (event triggered by the GameLoop)
    		pixiRenderer = new PixiRenderer(engine, window.latestGameOptions);
    		pixiRenderer.start();

    		//Run through the Common Game Lifecycle. init() --> pregame() ---Deferred.done---> startGame() ---Deferred.done---> endGame()
    		game.init($.extend(window.latestGameOptions, {
				   world: engine.world,
    			   engine: engine,
    			   canvasEl: pixiRenderer.canvasEl,
    			   renderer: pixiRenderer,
    			   background: pixiRenderer.background}));

    		game.preGame();
		})
	}
};

export default CommonGameStarter;
