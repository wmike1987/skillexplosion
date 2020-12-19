import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js'
import levelBase from '@games/Us/MapAndLevel/LevelBase.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'
import TileMapper from '@core/TileMapper.js'
import ItemUtils from '@core/Unit/ItemUtils.js'
import Doodad from '@utils/Doodad.js'
import {Dialogue, DialogueChain} from '@core/Dialogue.js'

var airDropStation = function(options) {
    this.type = 'airDropStations';
    this.prereqCount = 2;
    this.onCreate(options)
    this.enterNode = function() {
        Matter.Events.trigger(globals.currentGame, 'InitAirDrop', {node: this});
    };
    this.tileSize = 225;
    this.createTerrain = function(scene) {
        var tileMap = TileMapper.produceTileMap({possibleTextures: options.getLevelTiles(), tileWidth: options.tileSize, tileTint: this.tileTint});
        scene.add(tileMap);

        if(options.levelTileExtension) {
            options.levelTileExtension(scene, this.tileTint);
        }
    };
    this.createTrees = function(scene) {
        var treeOptions = {};
        treeOptions.start = {x: 0, y: 0};
        treeOptions.width = 300;
        treeOptions.height = gameUtils.getPlayableHeight()+50;
        treeOptions.density = .3;
        treeOptions.possibleTrees = options.possibleTrees;
        scene.add(SceneryUtils.fillAreaWithTrees(treeOptions))

        treeOptions.start = {x: gameUtils.getPlayableWidth()-200, y: 0};
        scene.add(SceneryUtils.fillAreaWithTrees(treeOptions));
    }

    this.startAirDrop = function() {
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Radio Transmission...", delayAfterEnd: 2000})
        var a1 = new Dialogue({actor: "MacMurray", text: "Shane, Ursula... Send me your equipment needs..."});
        var chain = new DialogueChain([title, a1], {startDelay: 2000, done: function() {

        }});
        chain.play();
    }
}
airDropStation.prototype = levelBase;

var airDropSpecialStation = function(options) {
    this.type = 'airDropSpecialStations';
    this.prereqCount = 3;
    this.onCreate(options)
    this.enterNode = function() {
        Matter.Events.trigger(globals.currentGame, 'InitAirDrop', {node: this});
    };
    this.tileSize = 225;
    this.createTerrain = function(scene) {
        var tileMap = TileMapper.produceTileMap({possibleTextures: options.getLevelTiles(), tileWidth: options.tileSize, tileTint: this.tileTint});
        scene.add(tileMap);

        if(options.levelTileExtension) {
            options.levelTileExtension(scene, this.tileTint);
        }

        //Add map
        var mapTableSprite = graphicsUtils.createDisplayObject('mapbox');
        var mapTable = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 30, texture: [mapTableSprite], stage: 'stage',
        scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 0}, sortYOffset: 0,
        shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.0, y: 1.0}, shadowOffset: {x: 0, y: 18},
        position: {x: gameUtils.getCanvasCenter().x-130, y: gameUtils.getPlayableHeight()-190}})
        scene.add(mapTable);

        var mapHoverTick = globals.currentGame.addTickCallback(function(event) {
            if(Matter.Vertices.contains(mapTable.body.vertices, mousePosition)) {
                mapTableSprite.tint = 0xff33cc;
            } else {
                mapTableSprite.tint = 0xFFFFFF;
            }
        }.bind(this));

        var self = this;
        //Establish map click listeners
        var mapClickListener = globals.currentGame.addPriorityMouseDownEvent(function(event) {
            var canvasPoint = {x: 0, y: 0};
            gameUtils.pixiPositionToPoint(canvasPoint, event);

            if(Matter.Vertices.contains(mapTable.body.vertices, canvasPoint) && !this.mapActive && this.campLikeActive) {
                this.unitSystem.pause();
                this.map.show();
                this.mapActive = true;
            }
        }.bind(globals.currentGame));

        scene.add(function() {
            $('body').on('keydown.map', function( event ) {
                var key = event.key.toLowerCase();
                if(key == 'escape' && this.mapActive) {
                    this.closeMap();
                }
            }.bind(globals.currentGame))
        })
    };

    this.createTrees = function(scene) {
        var treeOptions = {};
        treeOptions.start = {x: 0, y: 0};
        treeOptions.width = 300;
        treeOptions.height = gameUtils.getPlayableHeight()+50;
        treeOptions.density = .3;
        treeOptions.possibleTrees = options.possibleTrees;
        scene.add(SceneryUtils.fillAreaWithTrees(treeOptions))

        treeOptions.start = {x: gameUtils.getPlayableWidth()-200, y: 0};
        scene.add(SceneryUtils.fillAreaWithTrees(treeOptions));
    }

    this.startAirDrop = function(scene) {
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Radio Transmission...", delayAfterEnd: 2000})
        var a1 = new Dialogue({actor: "MacMurray", text: "Shane, Ursula... air drop is en route. What do you need?"});
        var chain = new DialogueChain([title, a1], {startDelay: 1500, done: function() {
            var selection = Object.create(selectionMechanism);
            selection.presentChoices({numberOfChoices: 1, possibleChoices: ['TechnologyKey']});
        }});
        scene.add(chain);
        chain.play();
    }
}
airDropSpecialStation.prototype = levelBase;

var selectionMechanism = {
    _chooseRandomItems: function() {
        this.presentedChoices = [];
        for(var x = 0; x < this.numberOfChoices; x++) {
            var choice = mathArrayUtils.getRandomElementOfArray(this.possibleChoices)
            mathArrayUtils.removeObjectFromArray(choice, this.possibleChoices);
            this.presentedChoices.push(choice);
        }
    },

    _displayChoices: function() {
        this.presentedChoices.forEach((choice) => {

        })
    },

    presentChoices: function(options) {
        this.numberOfChoices = options.numberOfChoices;
        this.possibleChoices = options.possibleChoices;

        this._chooseRandomItems();

        this.presentedChoices.forEach((itemName) => {
            ItemUtils.dropItemAtPosition({gamePrefix: 'Us', name: itemName, position: gameUtils.getPlayableCenter()});
        })

    },
};

export {airDropStation, airDropSpecialStation};
