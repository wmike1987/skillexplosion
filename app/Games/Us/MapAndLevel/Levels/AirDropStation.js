import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    globals,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';
import Tooltip from '@core/Tooltip.js';
import TileMapper from '@core/TileMapper.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import styles from '@utils/Styles.js';
import MenuBox from '@core/MenuBox.js';
import {
    Doodad
} from '@utils/Doodad.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js';
import {
    ItemClasses
} from '@games/Us/Items/ItemClasses.js';

var entrySound = gameUtils.getSound('enterairdrop1.wav', {
    volume: 0.04,
    rate: 1
});
var airDropClickTokenSound = gameUtils.getSound('clickairdroptoken1.wav', {
    volume: 0.03,
    rate: 1
});
var itemRevealSound = gameUtils.getSound('itemreveal1.wav', {
    volume: 0.08,
    rate: 1
});
var stimulantRevealSound = gameUtils.getSound('itemreveal2.wav', {
    volume: 0.08,
    rate: 1.0
});

var fatigueBenefit = 3;

//Create the air drop base
var commonAirDropStation = Object.create(levelBase);
commonAirDropStation.preNodeInit = function() {
    this.campLikeActive = true;
    this.completeUponEntry = true;
    this.lesserSpin = true;
    this.entrySound = entrySound;
    this.isAirDrop = true;
    this.numberOfChoices = 1;
    this.adrenalinePenalty = this.adrenalinePenalty || 1;
    this._incursTravelFatigue = false;
    this.nodeTitle = "Air Drop Station";
    // this.tooltipDescription = 'Receive supply drop.';
    this.tooltipDescription = ['Complete the prerequisite camp to enable.'];
    this.activeTooltipDescription = ['Enabled, click for options...'];
    this.mode = this.possibleModes.CUSTOM;
    this.noSmokePit = true;
    this.noZones.push({
        center: {
            x: 830,
            y: 400
        },
        radius: 40
    });
    this.noZones.push({
        center: {
            x: 943,
            y: 410
        },
        radius: 40
    });
    this.airDropLocation = gameUtils.getPlayableCenterPlus({
        y: -100
    });
};
commonAirDropStation.fillLevelSceneExtension = function(scene) {
    this.createMapTable(scene, {
        position: {
            x: gameUtils.getCanvasCenter().x + 130,
            y: gameUtils.getCanvasCenter().y - 0
        }
    });

    var h = graphicsUtils.createDisplayObject('X_sign', {
        position: this.airDropLocation,
        where: 'stageNTwo',
        sortYOffset: -1000,
        scale: {
            x: 0.8,
            y: 0.8
        },
    });
    scene.add(h);

    //create some trees
    var numberOfTrees = mathArrayUtils.getRandomIntInclusive(6, 9);
    var trees = [];
    mathArrayUtils.repeatXTimes(() => {
        var tree = SceneryUtils.createTree({
            tint: this.worldSpecs.treeTints[this.tintIndex]
        });
        tree.unique = true;
        trees.push(tree);
    }, numberOfTrees);

    var container = SceneryUtils.decorateTerrain({
        possibleDoodads: trees,
        tileWidth: 250,
        maxNumber: numberOfTrees,
        buffer: 100,
        hz: 0.4,
        where: 'stage',
        r: 1,
        noZones: [{
            center: this.airDropLocation,
            radius: 60
        }]
    });

    scene.add(container);
};

commonAirDropStation.cleanUp = function() {
    globals.currentGame.removeSlaves(this.slaves);
};

commonAirDropStation.createMapNode = function(options) {
    var self = this;
    var mapNode = new MapNode({
        levelDetails: this,
        mapRef: options.mapRef,
        // tokenSize: 50,
        // largeTokenSize: 60,
        indicatorOffset: {
            x: -22,
            y: -22
        },
        init: function() {
            this.prereqs = [];

            //choose close battle nodes to be the prerequisites
            var count = 0;
            var prereqDistanceLimit = 200;
            do {
                if (count > 3) {
                    count = 0;
                    prereqDistanceLimit += 20;
                }
                var node = mathArrayUtils.getRandomElementOfArray(this.mapRef.graph);
                if (node.canBePrereq() &&
                    node.levelDetails.isBattleLevel() &&
                    !node.chosenAsPrereq &&
                    ((!this.levelDetails.bridge && this.levelDetails.outer == node.levelDetails.outer) || (this.levelDetails.bridge && (this.levelDetails.outer != node.levelDetails.outer))) &&
                    mathArrayUtils.distanceBetweenPoints(options.position, node.position) < prereqDistanceLimit) {
                    node.chosenAsPrereq = true;
                    node.master = this;
                    this.prereqs.push(node);
                }
                count++;
            } while (this.prereqs.length < this.levelDetails.prereqCount);
        },
        hoverCallback: function() {
            this.prereqs.forEach((node) => {
                node.focusNode();
            });
            return true;
        },
        unhoverCallback: function() {
            this.prereqs.forEach((node) => {
                node.unfocusNode();
            });
            return true;
        },
        travelPredicate: function() {
            var allowed = false;
            return this.prereqs.every((pr) => {
                return pr.isCompleted;
            });
        },
        mouseDownPreBehavior: function(map) {
            let mapNode = this;
            if(map.outingNodes.length > 0) {
                map.clearOuting();
                return {
                    cancelSubsequentOperations: true
                }
            } else if (!this.myMenu) {
                //determine available options
                let adrenaline = globals.currentGame.map.adrenaline;
                let menuOptions = [];
                
                if(adrenaline >= 2) {
                    menuOptions.push({
                        text: '3 choices, -2 adrenaline',
                        action: () => {
                            self.adrenalinePenalty = 2;
                            self.numberOfChoices = 3;
                            this.onMouseDownBehavior({
                                systemTriggered: true
                            });
                        },
                    });
                }

                if(adrenaline >= 1) {
                    menuOptions.push({
                        text: '2 choices, -1 adrenaline',
                        action: () => {
                            self.adrenalinePenalty = 1;
                            self.numberOfChoices = 2;
                            this.onMouseDownBehavior({
                                systemTriggered: true
                            });
                        },
                    });
                }

                menuOptions.push({
                    text: '1 choice, no adrenaline penalty',
                    action: () => {
                        self.adrenalinePenalty = 0;
                        self.numberOfChoices = 1;
                        this.onMouseDownBehavior({
                            systemTriggered: true
                        });
                    },
                });

                this.myMenu = new MenuBox({
                    onShow: () => {
                        mapNode.displayObject.tooltipObj.hide();
                        mapNode.displayObject.tooltipObj.disable();
                    },
                    onHideOrDestroy: () => {
                        mapNode.displayObject.tooltipObj.enable();
                        this.myMenu = null;
                    },
                    title: "Select an option",
                    menuOptions: menuOptions,
                });
                this.myMenu.display(mousePosition);
                return {
                    cancelSubsequentOperations: true
                }
            } else if(this.myMenu) {
                return {
                    cancelSubsequentOperations: true
                }
            }
        },
        onMapHide: function() {
            if(this.myMenu) {
                this.myMenu.destroy();
            }
        },
        mouseDownCallback: function() {
            this.flashNode();
            this.displayObject.tooltipObj.disable();
            this.displayObject.tooltipObj.hide();
            airDropClickTokenSound.play();
            return false;
        },
        manualTokens: function() {
            var regularToken = graphicsUtils.createDisplayObject(this.levelDetails.regularTokenName, {
                where: 'hudNTwo'
            });
            var specialToken = graphicsUtils.createDisplayObject(this.levelDetails.specialTokenName, {
                where: 'hudNTwo'
            });
            this.regularToken = regularToken;
            this.specialToken = specialToken;

            var mapEventFunction = function() {
                if (this.isCompleted) {
                    // this.deactivateToken();
                } else {
                    if (this.travelPredicate()) {
                        //indicate we're available if this is the first time we available and alter to the active tooltip
                        if (!this.indicatedAvailable) {

                            this.indicatedAvailable = true;
                            gameUtils.doSomethingAfterDuration(() => {
                                globals.currentGame.soundPool.noticeme.play();
                                graphicsUtils.shakeSprite(this.regularToken, 800);
                                graphicsUtils.shakeSprite(this.specialToken, 800);
                            }, globals.currentGame.map.outingInProgress ? 1000 : 300);

                            this.establishTooltip(self.activeTooltipDescription);
                        }


                        regularToken.visible = true;
                        specialToken.visible = true;
                        if (!this.gleamTimer) {
                            this.gleamTimer = graphicsUtils.fadeBetweenSprites(regularToken, specialToken, 900, 1800, 250);
                            Matter.Events.on(regularToken, 'destroy', () => {
                                this.gleamTimer.invalidate();
                            });
                        }
                    } else {
                        regularToken.visible = true;
                        specialToken.visible = false;
                    }
                }
            }.bind(this);
            Matter.Events.on(this.mapRef, 'showMap', mapEventFunction);
            gameUtils.deathPact(self, () => {
                Matter.Events.off(this.mapRef, 'showMap', mapEventFunction);
            });
            return [regularToken, specialToken];
        },
        deactivateToken: function() {
            this.regularToken.visible = true;
            this.specialToken.visible = false;
            this.regularToken.alpha = 0.5;
            this.specialToken.alpha = 0.0;
            this.regularToken.tint = 0x002404;
            this.gleamTimer.invalidate();
        }
    });

    return mapNode;
};

var airDropStation = function(options) {
    this.type = 'airDropStations';
    this.regularTokenName = options.regularTokenName || 'AirDropToken';
    this.specialTokenName = options.specialTokenName || 'AirDropTokenGleam';
    this.prereqCount = options.prereqCount || 1;
    this.tileSize = 225.0;
    this.itemClass = options.itemClass;
    this.itemType = options.itemType;
    this.customIntroDialog = options.customIntroDialog;
    this.delayLastDialogDuration = options.delayLastDialogDuration;
    this.pauseAfterWord = options.pauseAfterWord || {
        word: "noword...",
        duration: 0
    };

    this.onLevelPlayable = function(scene) {
        var game = globals.currentGame;

        gameUtils.playAsMusic(game.soundPool.airdropVamp);

        //move units to center
        game.setUnit(game.shane, {
            position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), game.offscreenStartLocation),
            moveToCenter: true
        });
        game.setUnit(game.ursula, {
            position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), game.offscreenStartLocation),
            moveToCenter: true
        });

        //create the selection mechanism
        var selection = Object.create(selectionMechanism);
        selection.level = this;

        gameUtils.doSomethingAfterDuration(() => {
            if(this.adrenalinePenalty > 0) {
                globals.currentGame.toastMessage({
                    message: '-' + this.adrenalinePenalty + ' adrenaline',
                    state: 'negative',
                    style: styles.adrenalineTextLarge
                });
            }
        }, 1000);

        //subtract fatigue
        mathArrayUtils.repeatXTimes(() => {
            globals.currentGame.map.removeAdrenalineBlock();
        }, this.adrenalinePenalty);

        //begin dialogue
        var title = new Dialogue({
            blinkLastLetter: false,
            title: true,
            text: "Radio Transmission",
            delayAfterEnd: 500,
            letterSpeed: 30
        });
        var a1 = new Dialogue({
            actor: "MacMurray",
            text: this.customIntroDialog || "Air drop is en route. What do you need?",
            pauseAfterWord: this.pauseAfterWord,
            backgroundBox: true,
            letterSpeed: 30
        });

        var self = this;
        a1.onFullyShown = () => {
            gameUtils.doSomethingAfterDuration(() => {
                selection.presentChoices({
                    numberOfChoices: self.numberOfChoices,
                    itemClass: self.itemClass,
                    itemType: self.itemType,
                    uniqueItem: self.uniqueItem,
                    onChoice: () => {
                        chain.cleanUp();
                    }
                });
                stimulantRevealSound.play();
            }, 750);
        };

        var chain = new DialogueChain([title, a1], {
            startDelay: 2200
        });
        scene.add(chain);
        chain.play();
    };
};
airDropStation.prototype = commonAirDropStation;

var selectionMechanism = {
    _chooseRandomItems: function() {
        this.presentedChoices = ItemUtils.getRandomItemsFromClass({
            itemClass: this.itemClass,
            itemType: this.itemType,
            amount: this.numberOfChoices,
            uniqueItem: this.uniqueItem,
        });
    },

    _displayChoices: function() {
        var length = this.presentedChoices.length;
        var spacing = gameUtils.getPlayableWidth() / 10;
        var subtractionAmount = spacing / 2 * (length - 1) - 0.5;
        var j = 0;

        this.items = [];
        this.presentedChoices.forEach((choice) => {
            var itemDef = $.Deferred();
            ItemUtils.createItemObj({
                gamePrefix: 'Us',
                itemName: choice,
                position: gameUtils.getPlayableCenter(),
                dontAddToItemSystem: true,
                itemDeferred: itemDef
            });
            itemDef.done(function(item) {
                this.items.push(item);

                //show item icon
                graphicsUtils.addDisplayObjectToRenderer(item.icon);
                graphicsUtils.mouseOverOutTint({sprite: item.icon});
                graphicsUtils.makeSpriteSize(item.icon, 36);
                item.icon.position = mathArrayUtils.clonePosition(gameUtils.getPlayableCenter(), {
                    x: j * spacing - subtractionAmount,
                    y: -100
                });
                graphicsUtils.addBorderToSprite({
                    sprite: item.icon,
                    thickness: 2,
                    tint: item.borderTint || 0xffffff
                });

                var itemTitleHelper = item.name;
                //indicate ursula/shane only items in title
                if (item.type == 'Marine') {
                    itemTitleHelper += ' (Shane only)';
                } else if (item.type == 'Medic') {
                    itemTitleHelper += ' (Ursula only)';
                }

                Tooltip.makeTooltippable(item.icon, Object.assign({}, item.originalTooltipObj, {
                    systemMessage: 'Click to receive from air drop.',
                    title: itemTitleHelper
                }));
                j++;

                //mouse down listener
                var f = function(event) {
                    this._makeSelection(item);
                }.bind(this);
                item.icon.on('mousedown', f);
                item.removeAirDrop = function() {
                    item.icon.off('mousedown', f);
                };
            }.bind(this));
        });

        //show choice border
        this.panel = graphicsUtils.addSomethingToRenderer("PanelWithBorder", {
            where: 'hud',
            scale: {
                x: 0.8,
                y: 0.8
            },
            alpha: 0.75,
            position: mathArrayUtils.clonePosition(gameUtils.getPlayableCenter(), {
                y: -100
            })
        });
        graphicsUtils.addGleamToSprite({
            power: 0.1,
            sprite: this.panel,
            leanAmount: 125,
            gleamWidth: 150,
            duration: 750,
            alphaIncluded: true
        });
    },

    _makeSelection: function(item) {
        //register item with the system, and drop item
        // globals.currentGame.itemSystem.registerItem(item);
        // item.drop(item.icon.position);
        item.icon.tooltipObj.hide();
        globals.currentGame.soundPool.positiveSound3.play();

        graphicsUtils.flashSprite({
            sprite: item.icon.addedBorder,
            times: 4,
            duration: 50,
            onEnd: () => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: this.panel,
                    duration: 250
                });

                //restore original tooltip
                // Tooltip.makeTooltippable(item.icon, item.originalTooltipObj);

                //hide all icons, remove the click handlers, then destory the non-chosen items
                this.items.forEach((i) => {
                    i.removeAirDrop();
                    graphicsUtils.fadeSpriteOverTime({
                        sprite: i.icon,
                        duration: 250
                    });

                    gameUtils.doSomethingAfterDuration(() => {
                        i.destroy();
                    }, 250);
                });

                this.onChoice();

                globals.currentGame.flyover(() => {
                    globals.currentGame.dustAndItemBox({
                        location: this.level.airDropLocation,
                        item: [item.itemName],
                        special: true,
                        autoDestroyBox: false
                    });
                    this.level.mapTableActive = true;
                });
            }
        });

    },

    presentChoices: function(options) {
        this.itemClass = options.itemClass;
        this.itemType = options.itemType;
        this.onChoice = options.onChoice;
        this.uniqueItem = options.uniqueItem;
        this.numberOfChoices = options.numberOfChoices;

        this._chooseRandomItems();

        this._displayChoices();
    },
};

export {
    airDropStation
};
