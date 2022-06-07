import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import Tooltip from '@core/Tooltip.js';
import tokenMappings from '@games/Us/MapAndLevel/Map/TokenMappings.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import styles from '@utils/Styles.js';
import {
    ItemClasses
} from '@games/Us/Items/ItemClasses.js';

var hoverTick = gameUtils.getSound('augmenthover.wav', {
    volume: 0.01,
    rate: 1
});
var clickTokenSound2 = gameUtils.getSound('clickbattletoken2.wav', {
    volume: 0.04,
    rate: 0.9
});
var unclickTokenSound = gameUtils.getSound('augmenthover.wav', {
    volume: 0.04,
    rate: 0.7
});

var defaultTokenSize = 40;

//Define node object
var MapLevelNode = function(options) {
    Object.assign(this, options);
    this.type = this.levelDetails.type;
    this.id = mathArrayUtils.getId();
    this.defaultTokenSize = options.tokenSize || this.levelDetails.tokenSize || defaultTokenSize;
    this.enlargedTokenSize = this.defaultTokenSize + 10;
    this.indicatorOffset = options.indicatorOffset || {
        x: -18,
        y: -18
    };

    //Call init() if specified
    if (options.init) {
        options.init.call(this);
    }

    var myNode = this;
    gameUtils.matterOnce(this.levelDetails, 'endLevelActions', function(event) {
        event = event || {};
        myNode.complete();

        if (event.endLevelScene) {
            gameUtils.matterOnce(globals.currentGame.map, 'showMap', () => {
                myNode.playCompleteAnimation(myNode.levelDetails.lesserSpin);
            });
        } else {
            myNode.playCompleteAnimation();
        }
        globals.currentGame.map.lastNode = myNode;
    });

    if (!options.noSpawnGleam) {
        this.removeSpawnAnimator = gameUtils.matterOnce(this.mapRef, 'showMap', this.playSpawnAnimation.bind(this));
        this.allPurposeSpawnAnimator = Matter.Events.on(this.mapRef, 'mapGleam', this.playSpawnAnimation.bind(this));
    }

    if (options.manualTokens) {
        //custom map token
        this.displayObject = graphicsUtils.createDisplayObject('TransparentSquare', {
            where: 'hudNOne',
            scale: {
                x: this.defaultTokenSize,
                y: this.defaultTokenSize
            }
        });
        this.displayObject.interactive = true;
        this.manualTokens = options.manualTokens.call(this);
        this.manualTokens.forEach((token) => {
            token.interactive = true;
        });
    } else {
        //default behavior - find the right token mapping based on level criteria
        var token = 'default';
        if(this.levelDetails.isBossLevel()) {
            token = 'bossToken';
        } else if(this.levelDetails.isAugmented()) {
            if(this.levelDetails.outer) {
                token = 'augmentedHard';
            } else {
                token = 'augmentedBasic';
            }
        } else {
            if(this.levelDetails.outer) {
                token = 'hard';
            }
        }

        var tokenMapping = tokenMappings[this.levelDetails.token || token];
        this.displayObject = graphicsUtils.createDisplayObject(tokenMapping, {
            where: 'hudNTwo',
            scale: {
                x: 1,
                y: 1
            }
        });

        //determine node size
        if(tokenMapping.toLowerCase().includes('hard')) {
            this.defaultTokenSize = 46;
            this.indicatorOffset = options.indicatorOffset || {
                x: -21,
                y: -21
            };
        } else if(tokenMapping.toLowerCase().includes('boss')) {
            this.defaultTokenSize = 52;
            this.indicatorOffset = options.indicatorOffset || {
                x: -23,
                y: -23
            };
        }
        this.enlargedTokenSize = this.defaultTokenSize + 10;

        graphicsUtils.makeSpriteSize(this.displayObject, this.defaultTokenSize);
        this.displayObject.interactive = true;
    }

    //Build informational tooltip
    var enemyDescriptions = [];
    var enemyIcons = [];
    var self = this;

    this.levelDetails.enemySets.forEach(set => {
        if(set.trivial) {
            return;
        }
        enemyDescriptions.push(' x ' + set.spawn.total);

        var defaultBorderTint = 0x252f59;
        let iconObj = {icon: set.icon, borderTint: defaultBorderTint};
        enemyIcons.push(iconObj);

        if(self.levelDetails.isAugmented() && !set.addedProps.immuneToAugment) {
            var tint = self.levelDetails.levelAugments[0].tint || defaultBorderTint;
            if(self.levelDetails.levelAugments.length > 1) {
                tint = 0x3442fe;
            }
            iconObj.borderTint = tint;
        }
    });

    //create the tooltip with a few assumptions
    var supplyDropSystemMessage = null;
    if(this.levelDetails.isSupplyDropEligible) {
        supplyDropSystemMessage = 'Supply Drop: ' + ItemClasses[this.levelDetails.itemClass][this.levelDetails.itemType].description;
    }

    var augmentMessages = this.levelDetails.getAugmentSystemMessages();
    var systemMessageArray = [supplyDropSystemMessage].concat(augmentMessages);

    Tooltip.makeTooltippable(this.displayObject, {
        title: options.tooltipTitle || this.levelDetails.nodeTitle,
        description: options.tooltipDescription || this.levelDetails.tooltipDescription || enemyDescriptions,
        descriptionIcons: enemyIcons,
        briefDelay: true,
        systemMessage: systemMessageArray
    });
    this.displayObject.tooltipObj.tooltipContext = {
        levelDetails: this.levelDetails
    };

    Matter.Events.on(globals.currentGame, 'TravelStarted', () => {
        this.unfocusNode();
    });

    //create the supply drop indicator
    if (this.levelDetails.isSupplyDropEligible) {
        var indicator = graphicsUtils.createDisplayObject(ItemClasses[this.levelDetails.itemClass][this.levelDetails.itemType].mapNodeIndicator, {
            where: 'hudNTwo',
            scale: {
                x: 0.75,
                y: 0.75
            }
        });
        graphicsUtils.addBorderToSprite({
            sprite: indicator,
            tint: 0xcdcdcd,
            thickness: 1
        });
        this.displayObject.iconIndicator = indicator;
        graphicsUtils.latchDisplayObjectOnto({
            child: indicator,
            parent: this.displayObject,
            positionUponShow: true,
            positionOffset: this.indicatorOffset
        });
    }

    //Establish event handlers
    this.displayObject.on('mouseover', function(event) {
        if (!this.mapRef.mouseEventsAllowed) return;

        if (!this.isCompleted) {
            var doDefault = true;
            if (options.hoverCallback) {
                doDefault = options.hoverCallback.call(self);
            }

            if (doDefault) {
                hoverTick.play();
                this.sizeNode(this.enlargedTokenSize);
                this.tintNode();
            }
        }

        //if we're a prerequisite to something, highlight the master
        if (this.chosenAsPrereq && !this.master.isCompleted) {
            this.master.focusNode();
        }
    }.bind(this));

    this.displayObject.on('mouseout', function(event) {
        if (!this.mapRef.mouseEventsAllowed) return;

        if (!this.isCompleted) {
            var doDefault = true;
            if (options.unhoverCallback) {
                doDefault = options.unhoverCallback.call(self);
            }
            if (doDefault) {
                this.sizeNode();
                this.untintNode();
            }
        }
        //if we're a prerequisite to something, unhighlight the master
        if (this.chosenAsPrereq && !this.master.isCompleted) {
            this.master.unfocusNode();
        }
    }.bind(this));

    this.onMouseDownBehavior = function(mouseDownOptions) {
        mouseDownOptions = mouseDownOptions || {};

        if (!this.mapRef.clicksAllowed) {
            return;
        }
        if (!this.mapRef.mouseEventsAllowed && !mouseDownOptions.systemTriggered) return;

        if (!self.isCompleted) {
            var canTravel = true;
            if (options.travelPredicate) {
                canTravel = this.travelPredicate();
            }

            if (canTravel) {
                //defaults
                var behavior = {
                    flash: true,
                    sound: true,
                    nodeToEnter: this
                };
                if (options.mouseDownCallback) {
                    var ret = options.mouseDownCallback.call(self, mouseDownOptions);
                    if (ret) {
                        Object.assign(behavior, ret);
                    } else {
                        Object.assign(behavior, {
                            flash: false,
                            sound: false
                        });
                    }
                }

                if (behavior.nodeToEnter == globals.currentGame.currentLevel.mapNode && this.enterSelfBehavior) {
                    this.enterSelfBehavior();
                    this.displayObject.tooltipObj.enable();
                } else {
                    //detect if we can add this node to an outing
                    if (behavior.nodeToEnter.levelDetails.isOutingReady() && !mouseDownOptions.systemTriggered) {
                        if (this.mapRef.isNodeInOuting(behavior.nodeToEnter)) {
                            this.mapRef.removeNodeFromOuting(behavior.nodeToEnter);
                            unclickTokenSound.play();
                        } else {
                            //If we trying to add a fourth, just ignore this request
                            if (!this.mapRef.canAddNodeToOuting(behavior.nodeToEnter)) {
                                return;
                            }
                            if (behavior.flash) {
                                this.flashNode();
                            }
                            if (behavior.sound) {
                                this.getClickSound().play();
                            }
                            this.mapRef.addNodeToOuting(behavior.nodeToEnter);
                        }
                    } else if (this.mapRef.outingNodes.length == 0 || mouseDownOptions.systemTriggered) {
                        if (behavior.flash) {
                            this.flashNode();
                        }
                        if (behavior.sound) {
                            this.getClickSound().play();
                        }

                        //this is the plain travel-to-node behavior
                        this.mapRef.travelToNode(behavior.nodeToEnter, function() {
                            Matter.Events.trigger(globals.currentGame, "travelFinished", {
                                node: behavior.nodeToEnter
                            });

                            behavior.nodeToEnter.saveMapState();

                            if(behavior.nodeToEnter.travelToken) {
                                this.mapRef.arriveAtTravelToken(behavior.nodeToEnter);
                            } else {
                                behavior.nodeToEnter.levelDetails.enterLevel({
                                    enteredByTraveling: true,
                                    keepCurrentCollector: mouseDownOptions.keepCurrentCollector
                                });
                                behavior.nodeToEnter.untintNode();
                                this.displayObject.tooltipObj.enable();
                            }
                        }.bind(this));
                    } else {
                        //clear the outing if we click on non-outingReady node and we've been configuring an outing
                        this.mapRef.clearOuting();
                    }
                }
            }
        }
    };

    this.displayObject.on('mousedown', function(event) {
        this.onMouseDownBehavior();
    }.bind(this));

    if (options.deactivateToken) {
        this.deactivateToken = options.deactivateToken;
    }
};

MapLevelNode.prototype.saveMapState = function() {
    this.morphine = globals.currentGame.map.morphine;
};

MapLevelNode.prototype.restoreMapState = function() {
    globals.currentGame.map.setMorphine(this.morphine);
};

MapLevelNode.prototype.deactivateToken = function() {
    this.displayObject.tint = 0x038524;
    this.displayObject.alpha = 0.75;
};

MapLevelNode.prototype.complete = function() {
    this.isCompleted = true;
    this.justCompleted = true;
    Matter.Events.trigger(globals.currentGame, 'nodeCompleted', {node: this});
    this.displayObject.tooltipObj.destroy();
    if (this._nodeCompleteExtension) {
        this._nodeCompleteExtension();
    }
};

MapLevelNode.prototype.playCompleteAnimation = function(lesser) {
    var node = this;
    node.isSpinning = true;
    node.sizeNode();

    if (this.displayObject.iconIndicator) {
        this.displayObject.iconIndicator.tint = 0x038524;
        this.displayObject.iconIndicator.alpha = 0.8;
        this.displayObject.iconIndicator.addedBorder.alpha = 0.00;
        this.displayObject.iconIndicator.addedBorder.tint = 0xffffff;
    }

    var times = lesser ? 6 : 10;
    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            graphicsUtils.spinSprite(token, times, 150, 2, () => {
                if (node.mapRef.isShowing) {
                    node.deactivateToken();
                }
            }, () => {
                node.isSpinning = false;
            });
        });
    } else {
        graphicsUtils.spinSprite(this.displayObject, times, 150, 2, () => {
            if (node.mapRef.isShowing) {
                node.deactivateToken();
            }
        }, () => {
            node.isSpinning = false;
        });
    }

    if (this._playCompleteAnimationExtension) {
        this._playCompleteAnimationExtension();
    }
};

MapLevelNode.prototype.playSpawnAnimation = function(lesser) {
    //find left most node x position
    var leftMostX = null;
    this.mapRef.graph.forEach(node => {
        if (!leftMostX) {
            leftMostX = node.position.x;
        } else if (node.position.x < leftMostX) {
            leftMostX = node.position.x;
        }
    });

    var node = this;
    node.spawned = true;
    gameUtils.doSomethingAfterDuration(() => {
        if (this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.addGleamToSprite({
                    sprite: token,
                    gleamWidth: 20,
                    duration: 700,
                    power: 0.9,
                    red: 2.0
                });
            });
        } else {
            graphicsUtils.addGleamToSprite({
                sprite: this.displayObject,
                gleamWidth: 20,
                duration: 700,
                power: 0.9,
                red: 2.0
            });
        }
    }, this.position.x - leftMostX + 100);
};

MapLevelNode.prototype.canBePrereq = function() {
    return !this.travelToken;
};

MapLevelNode.prototype.setPosition = function(position) {
    this.displayObject.position = position;
    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            token.position = position;
        });
    }
    this.position = position;
};

MapLevelNode.prototype.cleanUp = function() {
    graphicsUtils.removeSomethingFromRenderer(this.displayObject);

    if (this.removeSpawnAnimator) {
        this.removeSpawnAnimator.removeHandler();
    }

    if (this.allPurposeSpawnAnimator) {
        Matter.Events.off(this.mapRef, 'mapGleam', this.allPurposeSpawnAnimator);
    }

    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            graphicsUtils.removeSomethingFromRenderer(token);
        });
    }
    if (this.cleanUpExtension) {
        this.cleanUpExtension();
    }

    if (this.levelDetails.cleanUp) {
        this.levelDetails.cleanUp();
    }
};

MapLevelNode.prototype.getClickSound = function() {
    return clickTokenSound2;
};

MapLevelNode.prototype.focusNode = function() {
    if (!this.isSpinning) {
        this.isFocused = true;
        this.focusCircle = graphicsUtils.addSomethingToRenderer('MapNodeFocusCircle', {
            where: 'hudNTwo',
            alpha: 0.8,
            position: this.position
        });
        graphicsUtils.makeSpriteSize(this.displayObject, this.enlargedTokenSize);
        graphicsUtils.makeSpriteSize(this.focusCircle, this.enlargedTokenSize);
        graphicsUtils.rotateSprite(this.focusCircle, {
            speed: 20
        });

        if (this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.makeSpriteSize(token, this.enlargedTokenSize);
            });
        }
    }
};

MapLevelNode.prototype.showNodeInOuting = function(options) {
    options = options || {};
    var tints = [0xeeec1a, 0xff7a00, 0xff0000];
    var tokenTint = 0xffffff;
    var number = options.number;
    var defaultSize = options.defaultSize;
    if (!this.isSpinning && !this.isCompleted) {
        this.isFocused = true;

        if (!this.outingFocusCircle) {
            this.outingFocusCircle = graphicsUtils.addSomethingToRenderer('MapNodeFocusCircle', {
                where: 'hudNTwo',
                alpha: 1.0,
                position: this.position,
                tint: options.travelToken ? tokenTint : tints[number]
            });
            graphicsUtils.makeSpriteSize(this.outingFocusCircle, defaultSize ? this.defaultTokenSize + 10 : this.enlargedTokenSize + 10);
            graphicsUtils.rotateSprite(this.outingFocusCircle, {
                speed: 20
            });
        } else {
            this.outingFocusCircle.tint = options.travelToken ? tokenTint : tints[number];
        }
    }
};

MapLevelNode.prototype.unshowNodeInOuting = function(force) {
    if (!this.outingFocusCircle) return;
    if (!this.isSpinning || force) {
        this.isFocused = false;
        graphicsUtils.fadeSpriteQuicklyThenDestroy(this.outingFocusCircle, 150);
        this.outingFocusCircle = null;
        graphicsUtils.makeSpriteSize(this.displayObject, this.defaultTokenSize);

        if (this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.makeSpriteSize(token, this.defaultTokenSize);
            });
        }
    }
};

MapLevelNode.prototype.tintNode = function(value) {
    var tintValue = this.customNodeTint || 0x20cd2c;
    this.displayObject.tint = value || tintValue;
    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            token.tint = value || tintValue;
        });
    }
};

MapLevelNode.prototype.untintNode = function() {
    this.displayObject.tint = 0xFFFFFF;
    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            token.tint = 0xFFFFFF;
        });
    }
};

MapLevelNode.prototype.flashNode = function(position) {
    graphicsUtils.graduallyTint(this.displayObject, 0xFFFFFF, 0xc72efb, 65, null, false, 3);
    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            graphicsUtils.graduallyTint(token, 0xFFFFFF, 0xc72efb, 65, null, false, 3);
        });
    }
};

MapLevelNode.prototype.sizeNode = function(size) {
    graphicsUtils.makeSpriteSize(this.displayObject, size || this.defaultTokenSize);
    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            graphicsUtils.makeSpriteSize(token, size || this.defaultTokenSize);
        });
    }

    if (this.outingFocusCircle) {
        graphicsUtils.makeSpriteSize(this.outingFocusCircle, size + 10 || this.defaultTokenSize + 10);
    }

    if (this.focusCircle) {
        graphicsUtils.makeSpriteSize(this.focusCircle, size || this.defaultTokenSize);
    }
};

MapLevelNode.prototype.setNodeZ = function(z) {
    this.displayObject.sortYOffset = z;
    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            token.sortYOffset = z;
        });
    }
};

MapLevelNode.prototype.setToDefaultState = function() {
    this.sizeNode();
    this.untintNode();
};

MapLevelNode.prototype.unfocusNode = function() {
    if (!this.focusCircle) return;
    if (!this.isSpinning) {
        this.isFocused = false;
        graphicsUtils.fadeSpriteQuicklyThenDestroy(this.focusCircle, 150);
        this.focusCircle = null;
        graphicsUtils.makeSpriteSize(this.displayObject, this.defaultTokenSize);

        if (this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.makeSpriteSize(token, this.defaultTokenSize);
            });
        }
    }
};

export default MapLevelNode;
