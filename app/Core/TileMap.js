import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import * as $ from 'jquery';

//This module represents a tile map. This is produced by the tile mapper
var tileMap = function(options) {
    this.tiles = [];
    this.seed = options.seed;
};

tileMap.prototype.initialize = function(options) {
    //loop through tiles and add them at the specified location
    $.each(this.tiles, function(i, tile) {
        graphicsUtils.addSomethingToRenderer(tile, options);
    });

    this.initialized = true;
    // console.info("initialized " + this.tiles.length + " tiles")
};

tileMap.prototype.addTile = function(displayObject) {
    this.tiles.push(displayObject);
};

tileMap.prototype.cleanUp = function() {
    $.each(this.tiles, function(i, tile) {
        graphicsUtils.removeSomethingFromRenderer(tile);
    });
};

tileMap.prototype.debugger = function(options) {
    if(options.tint) {
        $.each(this.tiles, function(i, tile) {
            tile.tint = options.tint;
        });
    }
};

export default tileMap;
