import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import EnemySetSpecifier from '@games/Us/MapAndLevel/EnemySetSpecifier.js'
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js'
import {airDropStation, airDropSpecialStation} from '@games/Us/MapAndLevel/Levels/AirDropStation.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import TileMapper from '@core/TileMapper.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'

var levelSpecifier = {
    create: function(type, options) {
        var TypeMapping = levelTypeMappings[type];
        return new TypeMapping(options);
    }
}

//Level types
var singles = function(options) {
    this.type = 'singles';
    this.onCreate(options)
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

var hardened = function(options) {
    this.type = 'hardened';
    this.onCreate(options)
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
hardened.prototype = levelBase;

var doubles = function(options) {
    this.type = 'doubles';
    this.onCreate(options)
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
    this.type = 'mobs';
    this.onCreate(options)
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
    this.type = 'camp';
    this.onCreate(options)
    this.enterNode = function() {
        Matter.Events.trigger(globals.currentGame, 'GoToCamp', {node: this});
    }
}
camp.prototype = levelBase;

var levelTypeMappings = {
    singles: singles,
    hardened: hardened,
    camp: camp,
    doubles: doubles,
    mobs: mobs,
    airDropStations: airDropStation,
    airDropSpecialStations: airDropSpecialStation,
}

export {levelSpecifier};