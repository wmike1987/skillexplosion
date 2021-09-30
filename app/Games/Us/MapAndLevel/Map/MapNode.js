import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import Tooltip from '@core/Tooltip.js';
import tokenMappings from '@games/Us/MapAndLevel/Map/TokenMappings.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import styles from '@utils/Styles.js';

var hoverTick = gameUtils.getSound('augmenthover.wav', {
    volume: 0.03,
    rate: 1
});
var clickTokenSound = gameUtils.getSound('clickbattletoken1.wav', {
    volume: 0.05,
    rate: 1
});
var clickTokenSound2 = gameUtils.getSound('clickbattletoken2.wav', {
    volume: 0.04,
    rate: 0.9
});

var defaultTokenSize = 40;
var enlargedTokenSize = 50;

//Define node object
var MapLevelNode = function(options) {
    Object.assign(this, options);
    this.type = this.levelDetails.type;
    this.defaultTokenSize = options.tokenSize || this.levelDetails.tokenSize || defaultTokenSize;
    this.enlargedTokenSize = options.largeTokenSize || this.levelDetails.largeTokenSize || enlargedTokenSize;

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

    if(!options.noSpawnGleam) {
        this.removeSpawnAnimator = gameUtils.matterOnce(this.mapRef, 'showMap', this.playSpawnAnimation.bind(this));
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
        //default behavior
        var tokenMapping = tokenMappings[this.levelDetails.token] || tokenMappings['default'];
        this.displayObject = graphicsUtils.createDisplayObject(tokenMapping, {
            where: 'hudNTwo',
            scale: {
                x: 1,
                y: 1
            }
        });
        graphicsUtils.makeSpriteSize(this.displayObject, this.defaultTokenSize);
        this.displayObject.interactive = true;
    }

    //Build informational tooltip
    var enemyDescriptions = [];
    var enemyIcons = [];
    var self = this;
    if (this.levelDetails.enemySets.length > 0) {
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
    this.displayObject.tooltipObj.isNodeTooltip = true;

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
                    var ret = options.mouseDownCallback.call(self);
                    if (ret) {
                        Object.assign(behavior, ret);
                    } else {
                        Object.assign(behavior, {
                            flash: false,
                            sound: false
                        });
                    }
                }

                if (behavior.flash) {
                    this.flashNode();
                    // this.displayObject.tooltipObj.hide();
                    // this.displayObject.tooltipObj.disable();
                }

                if (behavior.sound) {
                    clickTokenSound2.play();
                }

                if (behavior.nodeToEnter == globals.currentGame.currentLevel.mapNode && this.enterSelfBehavior) {
                    this.enterSelfBehavior();
                    this.displayObject.tooltipObj.enable();
                } else {
                    if(behavior.nodeToEnter.levelDetails.isBattleLevel() && !this.mapRef.outingInProgress) {
                        if(this.mapRef.isNodeInOuting(behavior.nodeToEnter)) {
                            this.mapRef.removeNodeFromOuting(behavior.nodeToEnter);
                        } else {
                            this.mapRef.addNodeToOuting(behavior.nodeToEnter);
                        }
                    } else {
                        //this is the main business logic
                        this.mapRef.travelToNode(behavior.nodeToEnter, function() {
                            Matter.Events.trigger(globals.currentGame, "travelFinished", {
                                node: behavior.nodeToEnter
                            });
                            behavior.nodeToEnter.levelDetails.enterLevel({enteredByTraveling: true});
                            behavior.nodeToEnter.untintNode();
                            this.displayObject.tooltipObj.enable();
                        }.bind(this));
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

MapLevelNode.prototype.deactivateToken = function() {
    this.displayObject.tint = 0x002404;
    this.displayObject.alpha = 0.5;
};

MapLevelNode.prototype.complete = function() {
    this.isCompleted = true;
    this.justCompleted = true;
    this.displayObject.tooltipObj.destroy();
    if (this._nodeCompleteExtension) {
        this._nodeCompleteExtension();
    }
};

MapLevelNode.prototype.completeAndPlayAnimation = function() {
    this.complete();
    this.playCompleteAnimation();
};

MapLevelNode.prototype.playCompleteAnimation = function(lesser) {
    var node = this;
    node.isSpinning = true;
    node.sizeNode();
    var times = lesser ? 6 : 10;
    if (this.manualTokens) {
        this.manualTokens.forEach((token) => {
            graphicsUtils.spinSprite(token, times, 150, 2, () => {
                if(node.mapRef.isShown) {
                    node.deactivateToken();
                }
            }, () => {
                node.isSpinning = false;
            });
        });
    } else {
        graphicsUtils.spinSprite(this.displayObject, times, 150, 2, () => {
            if(node.mapRef.isShown) {
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
        if(!leftMostX) {
            leftMostX = node.position.x;
        } else if(node.position.x < leftMostX) {
            leftMostX = node.position.x;
        }
    });

    var node = this;
    node.spawned = true;
    gameUtils.doSomethingAfterDuration(() => {
        if (this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.addGleamToSprite({sprite: token, gleamWidth: 20, duration: 750});
            });
        } else {
            graphicsUtils.addGleamToSprite({sprite: this.displayObject, gleamWidth: 20, duration: 750});
        }
    }, this.position.x - leftMostX + 100);
};

MapLevelNode.prototype.canBePrereq = function() {
    return true;
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

    if(this.removeSpawnAnimator) {
        this.removeSpawnAnimator.removeHandler();
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

MapLevelNode.prototype.showNodeInOuting = function() {
    if (!this.isSpinning) {
        this.isFocused = true;
        this.outingFocusCircle = graphicsUtils.addSomethingToRenderer('MapNodeFocusCircle', {
            where: 'hudNTwo',
            alpha: 1.0,
            position: this.position,
            tint: 0xe93d3d
        });
        graphicsUtils.makeSpriteSize(this.displayObject, this.enlargedTokenSize);
        graphicsUtils.makeSpriteSize(this.outingFocusCircle, this.enlargedTokenSize);
        graphicsUtils.rotateSprite(this.outingFocusCircle, {
            speed: 20
        });

        if (this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.makeSpriteSize(token, this.enlargedTokenSize);
            });
        }
    }
};

MapLevelNode.prototype.unshowNodeInOuting = function() {
    if (!this.outingFocusCircle) return;
    if (!this.isSpinning) {
        this.isFocused = false;
        graphicsUtils.removeSomethingFromRenderer(this.outingFocusCircle);
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
    var tintValue = 0x20cd2c;
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

    if(this.outingFocusCircle) {
        graphicsUtils.makeSpriteSize(this.outingFocusCircle, size || this.defaultTokenSize);
    }

    if(this.focusCircle) {
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
        graphicsUtils.removeSomethingFromRenderer(this.focusCircle);
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
