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
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js'

var entrySound = gameUtils.getSound('enterairdrop1.wav', {volume: .04, rate: 1});
var airDropClickTokenSound = gameUtils.getSound('clickairdroptoken1.wav', {volume: .03, rate: 1});

//Create the air drop base
var commonAirDropStation = Object.create(levelBase);
commonAirDropStation.fillLevelScene = function(scene) {
    var tileMap = TileMapper.produceTileMap({possibleTextures: this.worldSpecs.getLevelTiles(), tileWidth: this.worldSpecs.tileSize, tileTint: this.tileTint});
    scene.add(tileMap);

    this.initExtension = function() {
        this.campLikeActive = true;
    }

    if(this.worldSpecs.levelTileExtension) {
        this.worldSpecs.levelTileExtension(scene, this.tileTint);
    }

    this.createMapTable();
};
commonAirDropStation.createMapNode = function(options) {
    var mapNode = new MapNode({levelDetails: options.levelDetails, mapRef: options.mapRef, tokenSize: 50, largeTokenSize: 60,
        init: function() {
            this.prereqs = [];

            //choose close battle nodes to be the prerequisites
            var count = 0;
            var prereqDistanceLimit = 200;
            do {
                if(count > 30) {
                    count = 0;
                    prereqDistanceLimit += 100;
                }
                var node = mathArrayUtils.getRandomElementOfArray(this.mapRef.graph);
                if(node.canBePrereq() && node.isBattleNode && !node.chosenAsPrereq && mathArrayUtils.distanceBetweenPoints(options.position, node.position) < prereqDistanceLimit) {
                    node.chosenAsPrereq = true;
                    node.master = this;
                    this.prereqs.push(node);
                }
                count++;
            } while(this.prereqs.length < this.levelDetails.prereqCount)
        },
        hoverCallback: function() {
            this.prereqs.forEach((node) => {
                node.focusNode();
            })
            return true;
        },
        unhoverCallback: function() {
            this.prereqs.forEach((node) => {
                node.unfocusNode();
            })
            return true;
        },
        travelPredicate: function() {
            var allowed = false;
            return this.prereqs.every((pr) => {
                return pr.isCompleted;
            })
        },
        mouseDownCallback: function() {
            this.flashNode();
            this.displayObject.tooltipObj.disable();
            this.displayObject.tooltipObj.hide();
            airDropClickTokenSound.play();
            return false;
        },
        manualTokens: function() {
            var regularToken = graphicsUtils.createDisplayObject(this.levelDetails.regularTokenName, {where: 'hudNTwo'});
            var specialToken = graphicsUtils.createDisplayObject(this.levelDetails.specialTokenName, {where: 'hudNTwo'});
            this.regularToken = regularToken;
            this.specialToken = specialToken;
            Matter.Events.on(this.mapRef, 'showMap', function() {
                if(this.isCompleted) {
                    this.deactivateToken();
                } else {
                    if(this.travelPredicate()) {
                        regularToken.visible = true;
                        specialToken.visible = true;
                        if(!this.gleamTimer) {
                            this.gleamTimer = graphicsUtils.fadeBetweenSprites(regularToken, specialToken, 500, 900, 0);
                            Matter.Events.on(regularToken, 'destroy', () => {
                                this.gleamTimer.invalidate();
                            })
                        }
                    } else {
                        regularToken.visible = true;
                        specialToken.visible = false;
                    }
                }
            }.bind(this))
            return [regularToken, specialToken];
        },
        deactivateToken: function() {
            this.regularToken.visible = true;
            this.specialToken.visible = false;
            this.regularToken.alpha = .5;
            this.regularToken.tint = 0x002404;
            this.gleamTimer.invalidate();
        }
    });

    return mapNode;
}

var airDropStation = function(options) {
    this.type = 'airDropStations';
    this.regularTokenName = 'AirDropToken';
    this.specialTokenName = 'AirDropTokenGleam';
    this.prereqCount = 1;
    options.entrySound = entrySound;
    this.enterLevel = function(node) {
        Matter.Events.trigger(globals.currentGame, 'InitCustomLevel', {level: node.levelDetails});
    };

    this.onEnterLevel = function(scene) {
        var game = globals.currentGame;
        game.setUnit(game.shane, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), game.offscreenStartLocation), moveToCenter: true});
        game.setUnit(game.ursula, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), game.offscreenStartLocation), moveToCenter: true});
        this.startAirDrop(scene);
    },

    this.tileSize = 225;

    this.startAirDrop = function(scene) {
        this.entrySound.play();
        var selection = Object.create(selectionMechanism);
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Radio Transmission", delayAfterEnd: 2000})
        var a1 = new Dialogue({actor: "MacMurray", text: "Stimulant drop is en route. What do you need?", backgroundBox: true, letterSpeed: 50});
        var self = this;
        var chain = new DialogueChain([title, a1], {startDelay: 200, done: function() {
            selection.presentChoices({numberOfChoices: 3, possibleChoices: ['SlipperySoup', 'StoutShot', 'Painkiller', 'LifeExtract', 'CoarseBrine', 'ChemicalConcentrate', 'AwarenessTonic']});
            chain.cleanUp();
            self.mapTableActive = true;

        }});
        scene.add(chain);
        chain.play();
    }
}
airDropStation.prototype = commonAirDropStation;

var airDropSpecialStation = function(options) {
    this.type = 'airDropSpecialStations';
    this.regularTokenName = 'AirDropSpecialToken';
    this.specialTokenName = 'AirDropSpecialTokenGleam'
    this.prereqCount = 3;
    options.entrySound = entrySound;
    this.enterLevel = function(node) {
        Matter.Events.trigger(globals.currentGame, 'InitAirDrop', {node: node});
    };
    this.tileSize = 225;

    this.startAirDrop = function(scene) {
        this.entrySound.play();
        var selection = Object.create(selectionMechanism);
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Radio Transmission", delayAfterEnd: 2000})
        var a1 = new Dialogue({actor: "MacMurray", text: "Technology is en route. What do you need?", backgroundBox: true, letterSpeed: 50});
        var self = this;
        var chain = new DialogueChain([title, a1], {startDelay: 200, done: function() {
            selection.presentChoices({numberOfChoices: 3, possibleChoices: ['TechnologyKey', 'SereneStar', 'SteadySyringe', 'GleamingCanteen']});
            chain.cleanUp();
            self.mapTableActive = true;
        }});
        scene.add(chain);
        chain.play();
    }
}
airDropSpecialStation.prototype = commonAirDropStation;

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
                Tooltip.makeTooltippable(item.icon, Object.assign({}, item.originalTooltipObj, {systemMessage: 'Click to receive from air drop.'}));
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
