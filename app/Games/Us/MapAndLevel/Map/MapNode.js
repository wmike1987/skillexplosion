import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Tooltip from '@core/Tooltip.js'
import tokenMappings from '@games/Us/MapAndLevel/Map/TokenMappings.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import styles from '@utils/Styles.js'

var hoverTick = gameUtils.getSound('augmenthover.wav', {volume: .03, rate: 1});
var clickTokenSound = gameUtils.getSound('clickbattletoken1.wav', {volume: .05, rate: 1});
var clickTokenSound2 = gameUtils.getSound('clickbattletoken2.wav', {volume: .04, rate: .9});

var defaultTokenSize = 40;
var enlargedTokenSize = 50;

//Define node object
var MapLevelNode = function(options) {
    this.mapRef = options.mapRef;
    this.levelDetails = options.levelDetails;
    this.travelPredicate = options.travelPredicate;
    this.type = this.levelDetails.type;
    this.defaultTokenSize = options.tokenSize || this.levelDetails.tokenSize || defaultTokenSize;
    this.enlargedTokenSize = options.largeTokenSize || this.levelDetails.largeTokenSize || enlargedTokenSize;

    //Call init() if specified
    if(options.init) {
        options.init.call(this);
    }

    var myNode = this;
    gameUtils.matterOnce(this.levelDetails, 'endLevelActions', function(event) {
        myNode.complete();
        gameUtils.matterOnce(event.endLevelScene, 'sceneFadeOutDone', function() {
            myNode.playCompleteAnimation();
        })
        globals.currentGame.map.lastNode = myNode;
    })

    if(options.manualTokens) {
        //custom map token
        this.displayObject = graphicsUtils.createDisplayObject('TransparentSquare', {where: 'hudNOne', scale: {x: this.defaultTokenSize, y: this.defaultTokenSize}});
        this.displayObject.interactive = true;
        this.manualTokens = options.manualTokens.call(this);
        this.manualTokens.forEach((token) => {
            token.interactive = true;
        })
    } else {
        //default behavior
        this.displayObject = graphicsUtils.createDisplayObject(tokenMappings[this.levelDetails.type], {where: 'hudNTwo', scale: {x: 1, y: 1}});
        graphicsUtils.makeSpriteSize(this.displayObject, this.defaultTokenSize);
        this.displayObject.interactive = true;
    }

    //Build informational tooltip
    var enemyDescriptions = [];
    var enemyIcons = [];
    var self = this;
    if(this.levelDetails.enemySets.length > 0) {
        this.isBattleNode = true;
    }
    this.levelDetails.enemySets.forEach(set => {
        enemyDescriptions.push(' x ' + set.spawn.total);
        enemyIcons.push(set.icon);
    });

    //create the tooltip with a few assumptions
    Tooltip.makeTooltippable(this.displayObject, {
        title: options.tooltipTitle || this.levelDetails.type,
        description: options.tooltipDescription || enemyDescriptions,
        descriptionIcons: enemyIcons
    });
    this.tooltip = this.displayObject.tooltip;

    //Establish event handlers
    this.displayObject.on('mouseover', function(event) {
        if(!this.mapRef.mouseEventsAllowed) return;

        if(!this.isCompleted && !this.mapRef.travelInProgress) {
            var doDefault = true;
            if(options.hoverCallback) {
                doDefault = options.hoverCallback.call(self);
            }

            if(doDefault) {
                hoverTick.play();
                this.sizeNode(this.enlargedTokenSize);
                this.tintNode();
            }
        }

        //if we're a prerequisite to something, highlight the master
        if(this.chosenAsPrereq && !this.master.isCompleted) {
            this.master.focusNode();
        }
    }.bind(this));

    this.displayObject.on('mouseout', function(event) {
        if(!this.mapRef.mouseEventsAllowed) return;

        if(!this.isCompleted && !this.mapRef.travelInProgress) {
            var doDefault = true;
            if(options.unhoverCallback) {
                doDefault = options.unhoverCallback.call(self);
            }
            if(doDefault) {
                this.sizeNode();
                this.untintNode();
            }
        }
        //if we're a prerequisite to something, unhighlight the master
        if(this.chosenAsPrereq && !this.master.isCompleted) {
            this.master.unfocusNode();
        }
    }.bind(this));

    this.displayObject.on('mousedown', function(event) {
        if(!this.mapRef.mouseEventsAllowed) return;

        // this.playCompleteAnimation();

        if(!self.isCompleted && !this.mapRef.travelInProgress) {
            var canTravel = true;
            if(options.travelPredicate) {
                canTravel = this.travelPredicate();
            }

            if(canTravel) {
                //defaults
                var behavior = {flash: true, sound: true, nodeToEnter: this};
                if(options.mouseDownCallback) {
                    var ret =  options.mouseDownCallback.call(self);
                    if(ret) {
                        Object.assign(behavior, options.mouseDownCallback.call(self));
                    } else {
                        Object.assign(behavior, {flash: false, sound: false});
                    }
                }

                if(behavior.flash) {
                    this.flashNode();
                    this.displayObject.tooltipObj.disable();
                    this.displayObject.tooltipObj.hide();
                }

                if(behavior.sound) {
                    clickTokenSound2.play();
                }

                this.mapRef.travelToNode(behavior.nodeToEnter, function() {
                    Matter.Events.trigger(globals.currentGame, "TravelFinished", {node: behavior.nodeToEnter});
                    this.levelDetails.enterLevel(self);
                    behavior.nodeToEnter.untintNode();
                    this.displayObject.tooltipObj.enable();
                }.bind(this));
            }
        }
    }.bind(this));

    if(options.deactivateToken) {
        this.deactivateToken = options.deactivateToken;
    };

    this.focusNode = function() {
        if(!this.isSpinning) {
            this.isFocused = true;
            this.focusCircle = graphicsUtils.addSomethingToRenderer('MapNodeFocusCircle', {where: 'hudNTwo', alpha: .8, position: this.position});
            graphicsUtils.makeSpriteSize(this.displayObject, this.enlargedTokenSize);
            graphicsUtils.makeSpriteSize(this.focusCircle, this.enlargedTokenSize);
            graphicsUtils.rotateSprite(this.focusCircle, {speed: 20});

            if(this.manualTokens) {
                this.manualTokens.forEach((token) => {
                    graphicsUtils.makeSpriteSize(token, this.enlargedTokenSize);
                })
            }
        }
    };

    var tintValue = 0x20cd2c;
    this.tintNode = function(value) {
        this.displayObject.tint = value || tintValue;
        if(this.manualTokens) {
            this.manualTokens.forEach((token) => {
                token.tint = value || tintValue;
            })
        }
    };

    this.untintNode = function() {
        this.displayObject.tint = 0xFFFFFF;
        if(this.manualTokens) {
            this.manualTokens.forEach((token) => {
                token.tint = 0xFFFFFF;
            })
        }
    };

    this.flashNode = function() {
        graphicsUtils.graduallyTint(this.displayObject, 0xFFFFFF, 0xc72efb, 65, null, false, 3);
        if(this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.graduallyTint(token, 0xFFFFFF, 0xc72efb, 65, null, false, 3);
            })
        }
    };

    this.sizeNode = function(size) {
        graphicsUtils.makeSpriteSize(this.displayObject, size || this.defaultTokenSize);
        if(this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.makeSpriteSize(token, size || this.defaultTokenSize);
            })
        }
    };

    // this.bringNodeToForefront = function() {
    //     this.displayObject.originalSortYOffset = this.displayObject.sortYOffset;
    //     this.displayObject.sortYOffset = 1000;
    //     if(this.manualTokens) {
    //         this.manualTokens.forEach((token) => {
    //             token.originalSortYOffset = token.sortYOffset;
    //             token.sortYOffset = 1000;
    //         })
    //     }
    // }

    this.setNodeZ = function(z) {
        this.displayObject.sortYOffset = z;
        if(this.manualTokens) {
            this.manualTokens.forEach((token) => {
                token.sortYOffset = z;
            })
        }
    };

    this.setToDefaultState = function() {
        this.sizeNode();
        this.untintNode();
    };

    this.unfocusNode = function() {
        if(!this.isSpinning) {
            this.isFocused = false;
            graphicsUtils.removeSomethingFromRenderer(this.focusCircle);
            this.focusCirlce = null;
            graphicsUtils.makeSpriteSize(this.focusCircle, this.defaultTokenSize);
            graphicsUtils.makeSpriteSize(this.displayObject, this.defaultTokenSize);

            if(this.manualTokens) {
                this.manualTokens.forEach((token) => {
                    graphicsUtils.makeSpriteSize(token, this.defaultTokenSize);
                })
            }
        }
    },

    this.cleanUp = function() {
        graphicsUtils.removeSomethingFromRenderer(this.displayObject);
        if(this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.removeSomethingFromRenderer(token);
            })
        }
        if(this.cleanUpExtension) {
            this.cleanUpExtension();
        }
    };
}

MapLevelNode.prototype.deactivateToken = function() {
    this.displayObject.tint = 0x002404;
    this.displayObject.alpha = .5;
}

MapLevelNode.prototype.complete = function() {
    this.isCompleted = true;
    this.justCompleted = true;
    this.displayObject.tooltipObj.destroy();
}

MapLevelNode.prototype.playCompleteAnimation = function() {
    var node = this;
    node.isSpinning = true;
    graphicsUtils.spinSprite(this.displayObject, 1, 800, 0, () => {
        node.deactivateToken();
    }, () => {
        node.isSpinning = false;
    });
}

MapLevelNode.prototype.setPosition = function(position) {
    this.displayObject.position = position;
    if(this.manualTokens) {
        this.manualTokens.forEach((token) => {
            token.position = position;
        })
    }
    this.position = position;
}


export default MapLevelNode;
