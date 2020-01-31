/*
 * This module runs a CommonGame implementation, taking care of the business of setting up the Matter.js world and
 * setting up the pixi renderer. It also ensures assets have been loaded before initiating the game lifecycle
 */

define(['jquery', 'matter-js', 'pixi', 'utils/PixiRenderer', 'utils/FixedStepRunner'], function($, Matter, PIXI, PixiRenderer, FixedStepRunner) {

	var pixiRenderer;
	var engine;
	var latestGameRequest;
	var pendingGame;
	var CommonGameStarter = function(game, options) {

		var defaults = {width: 1200, height: 600, gravity: 1};
		options = $.extend({}, defaults, options);

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
		latestGameRequest = game;

		// set a globally accessible reference to the game object
		currentGame = latestGameRequest;

		latestGameOptions = options;

		//update the "loading..." text as assets are loaded
		if(PIXI.Loader.shared.loaderDeferred.state() == 'pending') {
    		$('#gameTheater').text("Loading");
    		var loadingCallback = PIXI.Loader.shared.onLoad.add(() => {
    		    $('#gameTheater').text($('#gameTheater').text() + '.');
    		}); // called once per loaded/errored file
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
        		engine.world.gravity.y = latestGameOptions.gravity;

				//create our fixed physics step manager
				var fixedStep = new FixedStepRunner({engine: engine});
				fixedStep.start();

				var overrideVelocity = false;
				if(overrideVelocity) {
					//override set velocity in order to normalize the velocity
					Matter.Body.originalSetVelocity = Matter.Body.originalSetVelocity || Matter.Body.setVelocity;
					// Matter.Body.setVelocity = function(body, velocity) {
						//         //normalize to 16.6666 ms per frame
						//         //var normalizedVelocity = Matter.Vector.mult(velocity, (engine.runner.deltaHistory[engine.runner.deltaHistory.length - 1] / (1000/60)));
						//         var normalizedVelocity = Matter.Vector.mult(velocity, (engine.runner.delta / (1000/60)));
						//         Matter.Body.originalSetVelocity(body, normalizedVelocity);
						//     };
				}

        		// Start the renderer: this starts the pixi Application and establishes a callback to update sprites with an associated body (if attached to one)
				// Thus our game loop is established:
				// 1) phsyics step(s)
				// 1a) update sprites if they're attached to a body
				// 2) let pixi draw
        		pixiRenderer = new PixiRenderer(engine, latestGameOptions, latestGameOptions.appendToElement);
        		pixiRenderer.start();

        		//Run through the Common Game Lifecycle. init() --> pregame() ---Deferred.done---> startGame() ---Deferred.done---> endGame()
        		latestGameRequest.init($.extend(latestGameOptions, {world: engine.world,
        			   engine: engine,
        			   canvasEl: pixiRenderer.canvasEl,
        			   canvasWidth: latestGameOptions.width, canvasHeight: latestGameOptions.height,
        			   renderer: pixiRenderer,
        			   background: pixiRenderer.background}));

        		latestGameRequest.preGame();
    		})
		}
	};

	return CommonGameStarter;
})
