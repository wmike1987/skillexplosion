import utils from '@utils/GameUtils.js'
import * as $ from 'jquery'

//This module represents a tile map. This is produced by the tile mapper
var tileMap = function() {
    this.tiles = [];
};

tileMap.prototype.initialize = function(options) {
    //loop through tiles and add them at the specified location
    $.each(this.tiles, function(i, tile) {
        utils.addSomethingToRenderer(tile, options);
    })

    this.initialized = true;
    // console.info("initialized " + this.tiles.length + " tiles")
};

tileMap.prototype.addTile = function(displayObject) {
    this.tiles.push(displayObject);
};

tileMap.prototype.cleanUp = function() {
    $.each(this.tiles, function(i, tile) {
        utils.removeSomethingFromRenderer(tile);
    })
};

export default tileMap;
