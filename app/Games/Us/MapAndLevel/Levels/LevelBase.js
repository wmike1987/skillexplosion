import * as $ from 'jquery'
import * as Matter from 'matter-js'
import {globals} from '@core/Fundamental/GlobalState.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import TileMapper from '@core/TileMapper.js'
import MapLevelNode from '@games/Us/MapAndLevel/Map/MapNode.js'

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
    onCreate: function(options) {
        this.levelOptions = Object.assign({}, options);
        this.tileTint = mathArrayUtils.getRandomElementOfArray(options.acceptableTileTints);
        this.entrySound = options.entrySound;
    },
    createTerrain: function(scene) {
        var tileMap = TileMapper.produceTileMap({possibleTextures: this.levelOptions.getLevelTiles(), tileWidth: this.levelOptions.tileSize, tileTint: this.tileTint});
        scene.add(tileMap);

        if(this.levelOptions.levelTileExtension) {
            this.levelOptions.levelTileExtension(scene, this.tileTint);
        }
    },
    createMapNode: function(options) {
        return new MapLevelNode(options);
    }
}

export default levelBase;
