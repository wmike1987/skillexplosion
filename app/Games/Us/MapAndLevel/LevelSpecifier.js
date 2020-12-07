import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import EnemySetSpecifier from '@games/Us/MapAndLevel/EnemySetSpecifier.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import TileMapper from '@core/TileMapper.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'

var levelSpecifier = {
    create: function(type, options) {
        var TypeMapping = levelTypeMappings[type];
        return new TypeMapping(options);
    }
}

var levelBase = {
    resetLevel: function() {
        this.enemySets.forEach(set => {
            set.fulfilled = false;
        })
    },
    enemySets: [],
    onCreate: function(options) {
        this.tileTint = mathArrayUtils.getRandomElementOfArray(options.acceptableTileTints);
    }
}

var singles = function(options) {
    this.onCreate(options)
    this.type = 'singles',
    this.enterNode = function() {
        Matter.Events.trigger(globals.currentGame, 'InitLevel', {node: this});
    };
    this.tileSize = 225;
    this.createTerrain = function(scene) {
        var tileMap = TileMapper.produceTileMap({possibleTextures: options.getLevelTiles(), tileWidth: options.tileSize, tileTint: this.tileTint});
        scene.add(tileMap);

        if(options.levelTileExtension) {
            options.levelTileExtension(scene, this.tileTint);
        }
    };
    this.enemySets = EnemySetSpecifier.create({type: this.type, possibleEnemies: options.enemySets});
}
singles.prototype = levelBase;

var doubles = function(options) {
    this.onCreate(options)
    this.type = 'doubles',
    this.enterNode = function() {
        Matter.Events.trigger(globals.currentGame, 'InitLevel', {node: this});
    };
    this.tileSize = 225;
    this.createTerrain = function(scene) {
        var tileMap = TileMapper.produceTileMap({possibleTextures: options.getLevelTiles(), tileWidth: options.tileSize, tileTint: this.tileTint});
        scene.add(tileMap);

        if(options.levelTileExtension) {
            options.levelTileExtension(scene, this.tileTint);
        }
    };
    this.enemySets = EnemySetSpecifier.create({type: this.type, possibleEnemies: options.enemySets});
}
doubles.prototype = levelBase;

var mobs = function(options) {
    this.onCreate(options)
    this.type = 'mobs',
    this.enterNode = function() {
        Matter.Events.trigger(globals.currentGame, 'InitLevel', {node: this});
    };
    this.tileSize = 225;
    this.createTerrain = function(scene) {
        var tileMap = TileMapper.produceTileMap({possibleTextures: options.getLevelTiles(), tileWidth: options.tileSize, tileTint: this.tileTint});
        scene.add(tileMap);

        if(options.levelTileExtension) {
            options.levelTileExtension(scene, this.tileTint);
        }
    };
    this.enemySets = EnemySetSpecifier.create({type: this.type, possibleEnemies: options.enemySets});
}
mobs.prototype = levelBase;

var camp = function(options) {
    this.onCreate(options)
    this.type = 'camp',
    this.enterNode = function() {
        Matter.Events.trigger(globals.currentGame, 'GoToCamp', {node: this});
    }
}
camp.prototype = levelBase;

var airDropStations = function(options) {
    this.onCreate(options)
    this.type = 'airDropStations',
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
}
airDropStations.prototype = levelBase;

var levelTypeMappings = {
    singles: singles,
    camp: camp,
    doubles: doubles,
    mobs: mobs,
    airDropStations: airDropStations,
}

export default levelSpecifier;
