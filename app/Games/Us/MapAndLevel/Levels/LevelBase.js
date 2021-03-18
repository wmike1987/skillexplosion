import * as $ from 'jquery'
import * as Matter from 'matter-js'
import {globals} from '@core/Fundamental/GlobalState.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import TileMapper from '@core/TileMapper.js'
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js'

var levelBase = {
    resetLevel: function() {
        this.enemySets.forEach(set => {
            set.fulfilled = false;
        })
    },
    enterLevel: function(node) {
        Matter.Events.trigger(globals.currentGame, 'InitCurrentLevel', {node: node});
    },
    getEntrySound: function() {
        return this.entrySound;
    },
    enemySets: [],
    onCreate: function(type, worldSpecs, options) {
        options = options || {};
        this.type = type;
        this.worldSpecs = Object.assign({}, worldSpecs);
        this.tileTint = mathArrayUtils.getRandomElementOfArray(worldSpecs.acceptableTileTints);
        this.entrySound = worldSpecs.entrySound;
        if(options.levelId) {
            this.levelId = options.levelId;
        }
    },
    createTerrain: function(scene) {
        var tileMap = TileMapper.produceTileMap({possibleTextures: this.worldSpecs.getLevelTiles(), tileWidth: this.worldSpecs.tileSize, tileTint: this.tileTint});
        scene.add(tileMap);

        if(this.worldSpecs.levelTileExtension) {
            this.worldSpecs.levelTileExtension(scene, this.tileTint);
        }

        if(this.createTerrainExtension) {
            this.createTerrainExtension(scene);
        }
    },
    createMapNode: function(options) {
        return new MapNode(options);
    }
}

export default levelBase;
