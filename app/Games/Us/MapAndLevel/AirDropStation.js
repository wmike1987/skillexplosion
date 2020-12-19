import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import levelBase from '@games/Us/MapAndLevel/LevelBase.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'
import TileMapper from '@core/TileMapper.js'
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
airDropSpecialStation.prototype = levelBase;

export {airDropStation, airDropSpecialStation};
