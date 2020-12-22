import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js'
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'
import Tooltip from '@core/Tooltip.js'
import TileMapper from '@core/TileMapper.js'
import ItemUtils from '@core/Unit/ItemUtils.js'
import Doodad from '@utils/Doodad.js'
import {Dialogue, DialogueChain} from '@core/Dialogue.js'

var airDropStation = function(options) {
    this.type = 'airDropStations';
    this.prereqCount = 2;
    this.onCreate(options)
    this.enterNode = function(node) {
        Matter.Events.trigger(globals.currentGame, 'InitAirDrop', {node: node});
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
        var selection = Object.create(selectionMechanism);
        selection.presentChoices({numberOfChoices: 3, possibleChoices: ['TechnologyKey', 'SereneStar', 'SteadySyringe', 'GleamingCanteen']});
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Radio Transmission", delayAfterEnd: 2000})
        var a1 = new Dialogue({actor: "MacMurray", text: "Stimulant drop is en route. What do you need?", backgroundBox: true, letterSpeed: 100});
        var chain = new DialogueChain([title, a1], {startDelay: 200, done: function() {
        }});
        scene.add(chain);
        chain.play();
    }
}
airDropStation.prototype = levelBase;

var airDropSpecialStation = function(options) {
    this.type = 'airDropSpecialStations';
    this.prereqCount = 3;
    this.onCreate(options)
    this.enterNode = function(node) {
        Matter.Events.trigger(globals.currentGame, 'InitAirDrop', {node: node});
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
        var selection = Object.create(selectionMechanism);
        selection.presentChoices({numberOfChoices: 3, possibleChoices: ['TechnologyKey', 'SereneStar', 'SteadySyringe', 'GleamingCanteen']});
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Radio Transmission", delayAfterEnd: 2000})
        var a1 = new Dialogue({actor: "MacMurray", text: "Technology is en route. What do you need?", backgroundBox: true, letterSpeed: 100});
        var chain = new DialogueChain([title, a1], {startDelay: 200, done: function() {
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
            var choice = mathArrayUtils.getRandomElementOfArray(this.possibleChoices);
            mathArrayUtils.removeObjectFromArray(choice, this.possibleChoices);
            this.presentedChoices.push(choice);
        }
    },

    _displayChoices: function() {
        var length = this.presentedChoices.length;
        var spacing = gameUtils.getPlayableWidth()/10;
        var subtractionAmount = spacing/2 * (length-1);
        var j = 0;

        this.items = [];
        this.presentedChoices.forEach((choice) => {
            var itemDef = $.Deferred();
            ItemUtils.createItemObj({gamePrefix: 'Us', itemName: choice, position: gameUtils.getPlayableCenter(), dontAddToItemSystem: true, itemDeferred: itemDef});
            itemDef.done(function(item) {
                this.items.push(item);

                //show item icon
                graphicsUtils.addDisplayObjectToRenderer(item.icon);
                item.icon.position = mathArrayUtils.clonePosition(gameUtils.getPlayableCenter(), {x: j*spacing - subtractionAmount, y: -100});
                Tooltip.makeTooltippable(item.icon, Object.assign(item.originalTooltipObj, {systemMessage: 'Click to receive from air drop.'}));
                j++;

                //mouse down listener
                var f = function(event) {
                    this._makeSelection(item);
                }.bind(this);
                item.icon.on('mousedown', f)
                item.removeAirDrop = function() {
                    item.icon.off('mousedown', f);
                }
            }.bind(this))
        })
    },

    _makeSelection: function(item) {
        //register item with the system, and drop item
        globals.currentGame.itemSystem.registerItem(item);
        item.drop(item.icon.position);
        item.icon.tooltipObj.hide();

        //restore original tooltip
        Tooltip.makeTooltippable(item.icon, item.originalTooltipObj);

        //hide all icons, remove the click handlers, then destory the non-chosen items
        this.items.forEach((i) => {
            i.icon.visible = false;
            i.removeAirDrop();
            if(i != item) {
                i.destroy();
            }
        })
    },

    presentChoices: function(options) {
        this.numberOfChoices = options.numberOfChoices;
        this.possibleChoices = options.possibleChoices;

        this._chooseRandomItems();

        this._displayChoices();
    },
};

export {airDropStation, airDropSpecialStation};
