import * as $ from 'jquery'
import * as Matter from 'matter-js'
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import TileMapper from '@core/TileMapper.js'
import Doodad from '@utils/Doodad.js'
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

    init: function(type, worldSpecs, options) {
        options = options || {};
        this.type = type;
        this.campLikeActive = false;
        this.worldSpecs = Object.assign({}, worldSpecs);
        this.tileTint = options.tint || mathArrayUtils.getRandomElementOfArray(worldSpecs.acceptableTileTints);
        this.entrySound = worldSpecs.entrySound;
        if(options.levelId) {
            this.levelId = options.levelId;
        }
        if(this.initExtension) {
            this.initExtension();
        }

    },

    fillLevelScene: function(scene) {
        var tileMap = TileMapper.produceTileMap({possibleTextures: this.worldSpecs.getLevelTiles(), tileWidth: this.worldSpecs.tileSize, tileTint: this.tileTint});
        scene.add(tileMap);

        if(this.worldSpecs.levelTileExtension) {
            this.worldSpecs.levelTileExtension(scene, this.tileTint);
        }

        if(this.fillLevelSceneExtension) {
            this.fillLevelSceneExtension(scene);
        }
    },

    createMapNode: function(options) {
        return new MapNode(options);
    },

    createMapTable: function(scene, options) {
        options = options || {};

        var mapTableSprite = graphicsUtils.createDisplayObject('mapbox');
        var mapTable = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 30, texture: [mapTableSprite], stage: 'stage',
        scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 0}, sortYOffset: 0,
        shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.0, y: 1.0}, shadowOffset: {x: 0, y: 18},
        position: options.position || {x: gameUtils.getCanvasCenter().x-130, y: gameUtils.getPlayableHeight()-190}})
        scene.add(mapTable);

        var mapHoverTick = globals.currentGame.addTickCallback(function(event) {
            if(!this.mapTableActive) return;
            if(Matter.Vertices.contains(mapTable.body.vertices, mousePosition)) {
                mapTableSprite.tint = 0xff33cc;
            } else {
                mapTableSprite.tint = 0xFFFFFF;
            }
        }.bind(this));

        var self = this;
        //Establish map click listeners
        var mapClickListener = globals.currentGame.addPriorityMouseDownEvent(function(event) {
            if(!self.mapTableActive) return;
            var canvasPoint = {x: 0, y: 0};
            gameUtils.pixiPositionToPoint(canvasPoint, event);

            if(Matter.Vertices.contains(mapTable.body.vertices, canvasPoint) && !this.mapActive && self.campLikeActive) {
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

        scene.addCleanUpTask(() => {
            globals.currentGame.removePriorityMouseDownEvent(mapClickListener);
            globals.currentGame.removeTickCallback(mapHoverTick);
            $('body').off('keydown.map');
        })
    }
}

export default levelBase;
