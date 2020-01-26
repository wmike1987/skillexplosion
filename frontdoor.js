requirejs.config({
    baseUrl: 'lib',

    paths: {
        app: '../app',
        games: '../app/Games',
        mixins: '../app/Mixins',
        utils: '../app/Utils',
        units: '../app/Units',
        shaders: '../app/Shaders',
    	pixi: "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.2.0/pixi", //4.8.6 last stable
	    jquery: "https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min",
	    howler: "https://cdnjs.cloudflare.com/ajax/libs/howler/2.0.4/howler.min",
	    'matter-js': "matter/matter-timing",
	    matterCollisionPlugin: "https://cdn.jsdelivr.net/npm/matter-collision-events@0.1.7/build/matter-collision-events",
	    particles: "pixi-particles/pixi-particles",
		'pixi-filters': "pixi-filters/pixi-filters",
        'pixi-spine': "pixi-spine/pixi-spine",
        'pixi-layers': "pixi-layers/pixi-layers"
    },
    shim: {
        "pixi": {
            exports: "PIXI"
        }
    }
});

//load the collision plugin
require(['matter-js', 'matterCollisionPlugin'], function(Matter, MatterCollisionPlugin) {
    Matter.use('matter-collision-events');
});

activateTextOne = false; //bool for animation
colorChoices = ['#ffffff', '#307fff', '#d91cff', '#008e8e', '#5d8729', '#d17b47', '#e377ff', '#57ff35'];
lastColor = 0;
function animateTitle() {
    //play sick animation
	var newChoice = Math.floor(Math.random() * colorChoices.length);
	while(newChoice == lastColor) {
	    newChoice = Math.floor(Math.random() * colorChoices.length);
	}
    var color = colorChoices[newChoice]
    lastColor = newChoice;
	if(activateTextOne) {
	    $('#textone').attr('stroke', color);
        $('#textone').attr('class', 'textColorAppear');
        $('#texttwo').attr('class', 'textColorDisappear');
	} else {
	    $('#texttwo').attr('stroke', color);
	    $('#texttwo').attr('class', 'textColorAppear');
        $('#textone').attr('class', 'textColorDisappear');
	}
	activateTextOne = !activateTextOne;
};

requirejs(['jquery'], function($) {
    $( document ).ready(function() {

        //show game menu, hidden until we can actually do something
        $('.gameMenu').removeClass('hidden');

        //callback when game name is clicked
    	var previousGame;
    	var loadGameIntoTheater = function(gameName) {

    	    //immedately display at least something since we may still be loading things if user clicked a game really quickly
	        $('#gameTheater').text("Loading...");

	        //load game
    	    require(['utils/CommonGameStarter', 'games/'+gameName, 'jquery', 'utils/HS'], function(GameStarter, game, $, hs) {

    	    	//destroy previous game
    	    	if(previousGame) previousGame.nuke({noMercy: true});
    	        $('#gameTheater').empty();

    	        //specify game theater as the place to situate the canvas
    	    	game.worldOptions.appendToElement = 'gameTheater';

    	    	//instantiate brand new game
    	    	var newGameInstance = previousGame = Object.create(game);

    	    	//manage game instructions
    	    	$('#gameInstructions').empty();
                $('#gameInstructions').removeClass('shadow');
                $('#gameInstructions').removeClass('hideBullets');
                $('#howToPlay').removeClass('makeUpForBorder');
	            if(game.instructions) {
	                $('#gameInstructions').addClass('shadow');
	                $('#gameInstructions').append("<div id='howToPlay'>" + "How To Play" + "</div>");
	                $('#howToPlay').click(function() {
	                    $('#gameInstructions').toggleClass('shadow');
	                    $('#gameInstructions').toggleClass('hideBullets');
	                    $('#howToPlay').toggleClass('makeUpForBorder');
	                });
	                $.each(game.instructions, function(index, instruction) {
                        $('#gameInstructions').append("<div class='instructionBullet'>&bull;&nbsp;" + instruction + "</div>");
	                })
	            }

    	    	//debugging option
    	    	if(false)
    		    	newGameInstance.victoryCondition = {type: 'timed', limit: 5};

    		    //call the game starter to initiate pixi, matter engine, and the game lifecycle. This also handles
    		    //not starting a game until resources have been loaded. I may revisit this part of the game starter.
    	    	GameStarter(newGameInstance, game.worldOptions);

    	    	//populate highscore table
    	    	hs.refreshHighScoreTable(game.gameName);
    	    })
    	};

    	$('.game').each(function(i, obj) {
    	    $(obj).click(function(event) {
    	    	loadGameIntoTheater($(obj).attr('gameName'));
    	    });
    	});

    	$('.devgame').each(function(i, obj) {
    	    $(obj).click(function(event) {
    	    	loadGameIntoTheater('dev' + $(obj).attr('gameName'));
    	    });
    	});


    	//auto load game based on url hash
    	if(window.location.hash) {
    	    loadGameIntoTheater(gameDict[window.location.hash.substring(1)]);
    	}
    });
});

requirejs(['jquery', 'pixi'], function($, PIXI) {

    window.PIXI = PIXI;

    //Register pixi spine plugin, the pixi-spine lib adds itself to the PIXI namespace, wish there were a better way to do this
    //but this is essentially taken from https://github.com/pixijs/pixi-spine/
    //Same with pixi-layers
    require(['pixi-spine', 'pixi-layers'], function(spine, pixiLayers) {
        	var loader = PIXI.Loader.shared;
        	loader.loaderDeferred = $.Deferred();

        	//backgrounds
        	loader.add('pelicanSheet', 'app/Textures/PelicanSheetLess.json');
        	loader.add('backgroundSheet', 'app/Textures/BackgroundSheet.json');
        	loader.add('backgroundSheet2', 'app/Textures/BackgroundSheet2.json');
        	loader.add('ChalkboardSheet', 'app/Textures/ChalkboardSheet.json');
        	loader.add('rainyBackgroundAndMarbles', 'app/Textures/RainyBackgroundAndMarbles.json');
        	loader.add('GrayBackground', 'app/Textures/GrayBackground.png');
        	loader.add('GrassTiles', 'app/Textures/GrassTiles.json');

        	//animations
        	loader.add('BlueTargetDeath', 'app/Textures/BlueTargetDeath.json');
        	loader.ssBlueDeathFrameCount = 6;

        	loader.add('blueCollapse', 'app/Textures/blueCollapse.json');
        	loader.blueCollapseFrameCount = 6;

        	loader.add('raindropflash', 'app/Textures/DropletFlash.json');
        	loader.raindropflashFrameCount = 3;

        	loader.add('gauntlet', 'app/Textures/Gauntlet.json');
        	loader.DiamondFlashFrameCount = 4;
        	loader.SquareWithBorderDeathFrameCount = 5;

        	//death animations
        	loader.add('deathAnimations', 'app/Textures/DeathAnimations.json');

        	//odds and ends
        	loader.add('unitMisc', 'app/Textures/UnitMisc.json');
        	loader.add('iso1', 'app/Textures/IsometricSheet1.json');
            loader.add('iso2', 'app/Textures/IsoSheet2.json');
        	loader.add('raindrop2', 'app/Textures/Raindrop2.png');
        	loader.add('alpha', 'app/Textures/alpha.png');
        	loader.add('glassShards', 'app/Textures/glassShards.png');
        	loader.add('snowflakeSheet', 'app/Textures/SnowflakeSheet.json');
        	loader.add('dullLandscape', 'app/Textures/DullLandscapeLess.jpg');

            //foliage
        	loader.add('foliage1', 'app/Textures/FoliagePack1.json');
        	loader.add('foliage2', 'app/Textures/avtrees.json');

            //spine assets
            loader.add('marineN', 'app/SpineAssets/Marine Exports/MarineN/N.json');
            loader.add('marineNW', 'app/SpineAssets/Marine Exports/MarineNW/NW.json');
            loader.add('marineS', 'app/SpineAssets/Marine Exports/MarineS/S.json');
            loader.add('marineSW', 'app/SpineAssets/Marine Exports/MarineSW/SW.json');
            loader.add('marineW', 'app/SpineAssets/Marine Exports/MarineW/W.json');

            loader.add('medicN', 'app/SpineAssets/Medic Exports/MedicN/N.json');
            loader.add('medicNW', 'app/SpineAssets/Medic Exports/MedicNW/NW.json');
            loader.add('medicS', 'app/SpineAssets/Medic Exports/MedicS/S.json');
            loader.add('medicSW', 'app/SpineAssets/Medic Exports/MedicSW/SW.json');
            loader.add('medicW', 'app/SpineAssets/Medic Exports/MedicW/W.json');

            loader.load();
            loader.once('complete', function() {
                loader.loaderDeferred.resolve();
            });
    })
});

//setup mute button
muted = false;
require(['jquery', 'howler'], function($, h) {
    var unmutedIcon = "&#128266;";
    var mutedIcon = "&#128263;";
    $('#muteButton').html(unmutedIcon);
    $('#muteButton').on('click', function() {
	muted = !muted;
	$(this).html(muted ? mutedIcon : unmutedIcon);
	h.Howler.mute(muted);
    });
});
