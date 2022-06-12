import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import Tooltip from '@core/Tooltip.js';
import {
    levelFactory
} from '@games/Us/MapAndLevel/Levels/LevelFactory.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import styles from '@utils/Styles.js';
import windowShader from '@shaders/WindowShader.js';

/*
 * Main Map object
 */
//Map sounds
var openmapSound = gameUtils.getSound('openmap.wav', {
    volume: 0.15,
    rate: 1.0
});
var openmapSound2 = gameUtils.getSound('openmap2.wav', {
    volume: 0.1,
    rate: 1.0
});
var openmapSound3 = gameUtils.getSound('itemreveal2.wav', {
    volume: 0.04,
    rate: 1.4
});
var openmapNewPhase = gameUtils.getSound('gleamsweep.wav', {
    volume: 0.06,
    rate: 0.8
});

//Creates the map, the map head, the map nodes and their tooltips, as well as initializes the level obj which the player will enter upon clicking the node
var map = function(specs) {

    this.outingNodes = [];
    this.outingNodeMemory = [];
    this.outingArrows = [];
    this.inProgressOutingNodes = [];
    this.maxOutingLength = 3;
    this.fatigueIncrement = 4;
    this.additionalState = {};
    this.tokenAugments = {};

    //create the head token
    this.headTokenBody = Matter.Bodies.circle(0, 0, 4, {
        isSensor: true,
        frictionAir: 0.0,
    });

    this.planeDropIndicator1 = graphicsUtils.createDisplayObject('PlaneDrop1', {
        where: "hudOne",
        scale: {x: 0.85, y: 0.85},
        tint: 0xb4a200,
        alpha: 1.0,
        sortYOffset: -50
    });

    this.planeDropIndicator2 = graphicsUtils.createDisplayObject('PlaneDrop2', {
        where: "hudOne",
        scale: {x: 0.85, y: 0.85},
        tint: 0x984d00,
        alpha: 1.0,
        sortYOffset: -50
    });

    this.planeDropIndicator3 = graphicsUtils.createDisplayObject('PlaneDrop3', {
        where: "hudOne",
        scale: {x: 0.85, y: 0.85},
        tint: 0x860000,
        alpha: 1.0,
        sortYOffset: -50
    });
    this.planeDropIndicators = [this.planeDropIndicator1, this.planeDropIndicator2, this.planeDropIndicator3];

    var fatigueScaleX = 1;
    var fatigueScaleY = 1;
    this.headTokenBody.renderChildren = [{
            id: 'headtoken',
            data: "HeadToken",
            stage: 'hudOne',
        },
        {
            id: 'shaneOnly',
            data: "ShaneHeadToken",
            stage: 'hudOne',
            visible: false
        },
    ];
    globals.currentGame.addBody(this.headTokenBody);
    this.headTokenSprite = this.headTokenBody.renderlings.headtoken;
    this.headTokenSprite.visible = false;
    // Matter.Body.setPosition(this.headTokenBody, mathArrayUtils.clonePosition(campLocation, {y: 20}));

    //setup fatigue functionality
    this.startingFatigue = 0;
    this.fatigueText = graphicsUtils.createDisplayObject("TEX+:" + 'Fatigue: 0%', {
        position: {
            x: 100,
            y: 100
        },
        style: styles.fatigueText,
        where: "hudOne"
    });

    Matter.Events.on(this, "SetFatigue", function(event) {
        if(event.includeStartingFatigue) {
            this.startingFatigue = event.amount;
        }
        this.fatigueText.alpha = 0.9;
        var amount = event.amount;
        this.fatigueText.text = 'Fatigue: ' + event.amount + '%';
        this.fatigueAmount = event.amount;
    }.bind(this));

    Matter.Events.on(this, "SetStartingFatigue", function(event) {
        this.startingFatigue = event.amount;
    }.bind(this));

    gameUtils.attachSomethingToBody({
        something: this.fatigueText,
        body: this.headTokenBody,
        offset: {
            x: 8,
            y: 20
        }
    });

    this.getCurrentFatigue = function() {
        return this.fatigueAmount;
    };

    //manage morphine
    this.morphine = 0;
    this.addMorphine = function(amount) {
        this.morphine += amount;
        graphicsUtils.fadeSpriteInQuickly(this.morphineText, 250);
        this.refreshMorphineText();
    };
    this.subtractMorphine = function(amount) {
        this.morphine -= amount;
        if(this.morphine < 0) {
            this.morphine = 0;
        }
        this.refreshMorphineText();
    };
    this.hasMorphine = function() {
        return this.morphine > 0;
    };
    this.setMorphine = function(amount) {
        this.morphine = amount;
        this.refreshMorphineText();
    };
    this.refreshMorphineText = function() {
        this.morphineText.text = 'Morphine (' + this.morphine + ')';
    };
    this.morphineText = graphicsUtils.createDisplayObject("TEX+:" + 'Morphine', {
        position: {
            x: 100,
            y: 100
        },
        style: styles.fatigueText,
        where: "hudOne",
        tint: 0xe63175
    });
    gameUtils.attachSomethingToBody({
        something: this.morphineText,
        body: this.headTokenBody,
        offset: {
            x: 0,
            y: 40
        }
    });
    Matter.Events.on(globals.currentGame, 'travelFinished', (event) => {
        if(event.node.levelDetails.isBattleLevel()) {
            this.subtractMorphine(1);
        }
    });

    //manage adrenaline
    this.adrenaline = 0;
    this.adrenalineMax = 4;
    this.adrenalineText = graphicsUtils.createDisplayObject("TEX+:" + 'Adrenaline', {
        position: {
            x: 192,
            y: 622
        },
        style: styles.adrenalineText,
        where: "hudNOne"
    });
    Tooltip.makeTooltippable(this.adrenalineText, {
        showInfoCursor: true,
        title: 'Adrenaline',
        descriptions: ['Adrenaline reduces travel fatigue.'],
        systemMessage: ['Adrenaline is gained by beating a level.', 'Adrenaline is lost by reconfiguring after a level', 'Returning to camp resets adrenaline.']
    });
    this.adrenalineBlocks = [];
    this.removedAdrenalineBlocks = [];

    this.isAdrenalineFull = function() {
        return this.adrenaline == this.adrenalineMax;
    };

    this.addAdrenalineBlock = function(amount) {
        amount = amount || 1;
        var amountGained = 0;
        do {
            if (this.adrenaline >= this.adrenalineMax) {
                //do nothing if we're already at the limit
                amount = 0;
                continue;
            }
            this.adrenaline += 1;
            amountGained++;
            if (this.adrenaline >= this.adrenalineMax) {
                this.adrenaline = this.adrenalineMax;
            }
            let offset = 18;
            let newBlock = graphicsUtils.createDisplayObject('TintableSquare', {
                position: {
                    x: 147.5 + this.adrenaline * offset,
                    y: 645.5
                },
                where: "hudNOne",
                tint: 0xd72e75,
                scale: {
                    x: 7,
                    y: 7
                }
            });
            newBlock.justAdded = true;
            this.adrenalineBlocks.push(newBlock);
            amount--;
        } while (amount);

        return amountGained;
    };

    this.removeAdrenalineBlock = function() {
        if (this.adrenaline == 0) {
            return;
        }
        let lastBlock = this.adrenalineBlocks[this.adrenalineBlocks.length - 1];
        mathArrayUtils.removeObjectFromArray(lastBlock, this.adrenalineBlocks);
        this.removedAdrenalineBlocks.push(lastBlock);
        this.adrenaline -= 1;

        if(this.isShowing) {
            this.flashAndHideAdrenalineBlocks();
        }
    };

    this.clearAllAdrenalineBlocks = function() {
        this.adrenalineBlocks.forEach((item, i) => {
            graphicsUtils.removeSomethingFromRenderer(item);
        });
        this.adrenaline = 0;
        this.adrenalineBlocks = [];
    };

    this.flashAndHideAdrenalineBlocks = function() {
        this.removedAdrenalineBlocks.forEach((item, i) => {
            if(item.adrenalineAlreadyDying) {
                return;
            }
            graphicsUtils.addOrShowDisplayObject(item);
            item.adrenalineAlreadyDying = true;
            graphicsUtils.flashSprite({
                sprite: item,
                fromColor: item.tint,
                toColor: 0x464646,
                duration: 150,
                times: 8,
                onEnd: () => {
                    graphicsUtils.removeSomethingFromRenderer(item);
                }
            });
        });
    };

    this.backgroundSprite = graphicsUtils.createDisplayObject('TintableSquare', {
        where: 'foregroundOne',
        position: gameUtils.getPlayableCenter(),
        sortYOffset: -1,
        tint: 0x000000,
        alpha: 0.75
    });
    graphicsUtils.makeSpriteSize(this.backgroundSprite, gameUtils.getCanvasWH());

    //Create main map sprite
    this.mapSprite = graphicsUtils.createDisplayObject('MapBackground', {
        where: 'foregroundOne',
        position: gameUtils.getPlayableCenter()
    });
    graphicsUtils.graduallyTint(this.mapSprite, 0x878787, 0x5565fc, 5000, null, 1800);

    this.worldSpecs = specs;
    this.graph = [];

    //setup other properties
    this.mouseEventsAllowed = true;
    this.clicksAllowed = true;
    this.keyEventsAllowed = true;

    this.addAdditionalState = function(obj) {
        Object.assign(this.additionalState, obj);
    };

    this.removeAdditionalState = function(key) {
        if(this.additionalState[key]) {
            delete this.additionalState[key];
        }
    };

    this.getAdditionalState = function() {
        return this.additionalState;
    };

    this.addTokenAugment = function(sprite, id) {
        var prevLength = Object.keys(this.tokenAugments).length;
        this.tokenAugments[id] = sprite;
        gameUtils.attachSomethingToBody({
            something: sprite,
            body: this.headTokenBody,
            offset: {
                x: 40 + 18 * prevLength,
                y: 0
            }
        });
        if(this.isShowing) {
            graphicsUtils.addOrShowDisplayObject(sprite);
            graphicsUtils.fadeSpriteInQuickly(sprite);
        }
    };

    this.removeTokenAugment = function(id) {
        graphicsUtils.removeSomethingFromRenderer(this.tokenAugments[id]);
        delete this.tokenAugments[id];
    };

    this.addMapNode = function(levelType, options) {
        //default these values
        var genericOptions = options || {};
        genericOptions.levelOptions = genericOptions.levelOptions || {};
        genericOptions.mapNodeOptions = genericOptions.mapNodeOptions || {};
        genericOptions.positionOptions = genericOptions.positionOptions || {};

        //Determine position unless otherwise specified
        var position = genericOptions.position;
        var collision, outOfBounds = false;
        var nodeBuffer = 100;
        var radius = 200;
        var minRadius = 0;
        var noZones = genericOptions.positionOptions.noZones;
        var minX = genericOptions.positionOptions.minX;
        var maxX = genericOptions.positionOptions.maxX;
        var minY = genericOptions.positionOptions.minY;
        var maxY = genericOptions.positionOptions.maxY;
        if(genericOptions.levelOptions.outer) {
            radius = 1000;
            minRadius = 400;
            noZones = {center: {x: 60, y: gameUtils.getPlayableHeight() - 60}, radius: 80};
        } else if(genericOptions.levelOptions.middle) {
            radius = 450;
            minRadius = 250;
            minY = 200;
            maxY = gameUtils.getPlayableHeight() - 200;
        }
        var tries = 0;
        if (!position) {
            do {
                if (tries > 40) {
                    tries = 0;
                    radius += 100;
                }
                collision = false;
                outOfBounds = false;
                position = gameUtils.getRandomPositionWithinRadiusAroundPoint({
                    point: gameUtils.getPlayableCenter(),
                    radius: radius,
                    buffer: 40,
                    minRadius: minRadius,
                    minX: minX,
                    maxX: maxX,
                    minY: minY,
                    maxY: maxY,
                    noZones: noZones
                });
                if (!gameUtils.isPositionWithinMapBounds(position, {x: 50, y: 50})) {
                    outOfBounds = true;
                }
                for (let node of this.graph) {
                    if (mathArrayUtils.distanceBetweenPoints(node.position, position) < nodeBuffer) {
                        collision = true;
                        tries++;
                        break;
                    }
                }
            } while (collision || outOfBounds);
        }
        genericOptions.mapNodeOptions.position = position;
        genericOptions.mapNodeOptions.mapRef = this;

        //create the level
        var level = levelFactory.create(levelType, this.worldSpecs, Object.assign(genericOptions, {
            mapRef: this
        }));

        //add to map graph if not handled manually
        if (!level.manualAddToGraph) {
            this.graph.push(level.mapNode);
        }

        return level.mapNode;
    };

    this.removeMapNode = function(node) {
        if (node.levelDetails.manualRemoveFromGraph) {
            node.levelDetails.manualRemoveFromGraph(this.graph);
        } else {
            mathArrayUtils.removeObjectFromArray(node, this.graph);
        }
        node.cleanUp();
    };

    this.removeMapNodeByName = function(name) {
        var node = this.findNodeById(name);
        if (node.levelDetails.manualRemoveFromGraph) {
            node.levelDetails.manualRemoveFromGraph(this.graph);
        } else {
            mathArrayUtils.removeObjectFromArray(node, this.graph);
        }
        node.cleanUp();
    };

    this.clearAllNodesExcept = function(name) {
        var graphClone = this.graph.slice(0);
        graphClone.forEach((node) => {
            if (node.levelDetails.levelId == name) return;
            if (node.levelDetails.manualRemoveFromGraph) {
                node.levelDetails.manualRemoveFromGraph(this.graph);
            } else {
                mathArrayUtils.removeObjectFromArray(node, this.graph);
            }
            node.cleanUp();
        });
    };

    this.retriggerTravelToken = function(node) {
        node.arriveAtNode();
    };

    this.arriveAtTravelToken = function(node) {
        //travel tokens
        var self = this;
        node.arriveAtNode();
        globals.currentGame.currentScene.clear();
        var finalNode = this.outingNodes.length == 0;

        if(!node.isCompleted) {
            node.playCompleteAnimation();
            node.complete();
        }

        //if we're the final node and travel token, remove all the route arrows
        gameUtils.doSomethingAfterDuration(() => {
            if(finalNode) {
                self._completeOuting({finalNode: node});
            } else {
                var mapnode = self.outingNodes.shift();
                self.inProgressOutingNodes.push(mapnode);
                mapnode.onMouseDownBehavior({
                    systemTriggered: true,
                    keepCurrentCollector: true
                });
            }
        }, 2000);

    };

    this.show = function(options) {
        options = options || {
            backgroundAlpha: 1.0,
            backgroundTint: 0x000000
        };

        this.isShowing = true;

        //manage showing current fatigue, or startingFatigue
        if(this.currentNode.travelToken) {
            this.fatigueText.text = 'Fatigue: ' + (this.fatigueAmount || 0) + '%';
        } else {
            this.fatigueText.text = 'Fatigue: ' + (this.startingFatigue || 0) + '%';
            this.fatigueAmount = this.startingFatigue || 0;
        }

        this.fatigueText.alpha = 0.3;

        if (!this.outingInProgress) {
            this.allowMouseEvents(true);
        }

        this.allowKeyEvents(true);
        openmapSound2.play();
        openmapSound3.play();

        graphicsUtils.addOrShowDisplayObject(this.mapSprite);
        this.backgroundSprite.alpha = options.backgroundAlpha;
        this.backgroundSprite.tint = options.backgroundTint;
        graphicsUtils.addOrShowDisplayObject(this.backgroundSprite);
        if (this.newPhase) {
            this.newPhase = false;
            openmapNewPhase.play();
        }
        this.graph.forEach(node => {
            if (node.isCompleted) {
                if (node.justCompleted) { //just completed allows the node to signal it deactivation with an animation the first time
                    node.justCompleted = false;
                } else {
                    node.deactivateToken();
                }
            } else {
                node.setToDefaultState();
            }
            graphicsUtils.addOrShowDisplayObject(node.displayObject);
            if (node.manualTokens) {
                node.manualTokens.forEach((token) => {
                    graphicsUtils.addOrShowDisplayObject(token);
                });
            }
        });

        graphicsUtils.addOrShowDisplayObject(this.headTokenSprite);
        graphicsUtils.addOrShowDisplayObject(this.fatigueText);
        this.fatigueText.alpha = 0.9;
        graphicsUtils.addOrShowDisplayObject(this.morphineText);
        this.morphineText.alpha = 0.9;

        if(!this.hasMorphine()) {
            graphicsUtils.hideDisplayObject(this.morphineText);
        }

        //token augments
        var tokenSprites = mathArrayUtils.operateOnObjectByKey(this.tokenAugments, function(id, sprite) {
            graphicsUtils.addOrShowDisplayObject(sprite);
        });

        graphicsUtils.addOrShowDisplayObject(this.adrenalineText);
        if (this.adrenalineBlocks.length > 0) {
            graphicsUtils.addGleamToSprite({
                sprite: this.adrenalineText,
                gleamWidth: 50,
                duration: 1250
            });
        }

        this.adrenalineBlocks.forEach((item, i) => {
            graphicsUtils.addOrShowDisplayObject(item);
            if (item.justAdded) {
                graphicsUtils.flashSprite({
                    sprite: item,
                    fromColor: item.tint,
                    toColor: 0xFFFFFF,
                    duration: 100,
                    times: 8
                });
                item.justAdded = false;
            }
        });

        this.flashAndHideAdrenalineBlocks();

        if (this.outingInProgress) {
            let myIndex = 0;
            this.outingNodeMemory.forEach((node, index) => {
                node.showNodeInOuting({
                    number: myIndex,
                    defaultSize: true,
                    travelToken: node.travelToken
                });
                if(!node.travelToken) {
                    myIndex += 1;
                }
            });
        }

        this.updateRouteArrows();
        this.updatePlaneDropIndicators();

        Matter.Events.trigger(this, 'showMap', {});
        Matter.Events.trigger(globals.currentGame, 'showMap', {});
    };

    this.handleEscape = function() {
        if(this.outingNodes.length == 0) {
            this.hide()
        } else {
            this.clearOuting();
        }
    },

    this.hide = function() {
        this.isShowing = false;
        Matter.Events.trigger(this, 'hideMap', {});
        Matter.Events.trigger(globals.currentGame, 'hideMap', {});

        graphicsUtils.hideDisplayObject(this.mapSprite);
        graphicsUtils.hideDisplayObject(this.backgroundSprite);
        this.graph.forEach(node => {
            graphicsUtils.hideDisplayObject(node.displayObject);
            if (node.displayObject.tooltipObj) {
                node.displayObject.tooltipObj.hide();
            }
            if (node.manualTokens) {
                node.manualTokens.forEach((token) => {
                    graphicsUtils.hideDisplayObject(token);
                });
            }
            if (node.isFocused) {
                node.unfocusNode();
                graphicsUtils.removeSomethingFromRenderer(node.focusCircle);
            }
        });

        this.adrenalineText.tooltipObj.hide();

        //Clear the outing if we're in progress
        this.clearOuting();

        //turn plane indicators off
        this.planeDropIndicators.forEach((plane, index) => {
            plane.visible = false;
        });

        this.headTokenSprite.visible = false;
        this.fatigueText.visible = false;
        this.adrenalineText.visible = false;
        this.morphineText.visible = false;

        //token augments
        var tokenSprites = mathArrayUtils.operateOnObjectByKey(this.tokenAugments, function(id, sprite) {
            graphicsUtils.hideDisplayObject(sprite);
        });

        this.adrenalineBlocks.forEach((item, i) => {
            item.visible = false;
        });
        this.removedAdrenalineBlocks.forEach((item, i) => {
            item.visible = false;
        });
        this.removedAdrenalineBlocks = [];

        //hide route arrows
        this.clearRouteArrows();
    };

    this.allowMouseEvents = function(value) {
        this.mouseEventsAllowed = value;
    };

    this.allowKeyEvents = function(value) {
        this.keyEventsAllowed = value;
    };

    this.allowClickEvents = function(value) {
        this.clicksAllowed = value;
    };

    this.addNodeToOuting = function(node) {
        this.outingNodes.push(node);
        this.updateOutingEngagement();
        this.updateRouteArrows();
        this.updatePlaneDropIndicators();

        if(this.outingIsAtMaxLength()) {
            Matter.Events.trigger(this, 'maxOutingLengthReached');
        }
    };

    this.removeNodeFromOuting = function(node) {
        node.unshowNodeInOuting();
        mathArrayUtils.removeObjectFromArray(node, this.outingNodes);
        this.updateOutingEngagement();
        this.updateRouteArrows();
        this.updatePlaneDropIndicators();
    };

    this.updatePlaneDropIndicators = function() {
        var nodesToSample = this.outingInProgress ? this.outingNodeMemory : this.outingNodes;
        var relevantNodes = nodesToSample.filter((node) => {
            return !node.travelToken;
        });
        var outingLength = relevantNodes.length;

        //turn everthing off
        this.planeDropIndicators.forEach((plane, index) => {
            plane.visible = false;
        });

        if(outingLength == 0) {
            return;
        }

        //enable our relevant air drop
        var relevantPlane = this.planeDropIndicators[outingLength-1];
        var lastNode = relevantNodes.slice(-1)[0];
        graphicsUtils.addOrShowDisplayObject(relevantPlane);
        relevantPlane.position = mathArrayUtils.clonePosition(lastNode.position, {x: 28, y: 28});
    };

    this.updateRouteArrows = function() {
        var colors = [0xcdc012, 0xe47b0e, 0xc20000];
        var travelTokenColor = 0xffffff;

        //function to create the timer that creates the arrows
        var sendSpriteWrapper = function(start, destination, index, travelToken) {
            let myArrowTimers = [];
            let timer = globals.currentGame.addTimer({
                name: 'sendSpriteWrapper:' + mathArrayUtils.getId(),
                gogogo: true,
                timeLimit: 500,
                immediateStart: true,
                callback: function() {
                    let routeArrow = graphicsUtils.addSomethingToRenderer('MapArrow', {where: 'noMansLand', alpha: 0.5, scale: {x: 0.5, y: 0.5}, tint: sendSpriteObj.color});

                    //This is a little hacky, but we're creating objects here on 'tick'. Simultaneously, the head token could trigger a render texture on the same tick, before
                    //the container updates all its children, including the last MapArrow created. It therefore would show up in the top left (0, 0) since the transform wouldn't have
                    //initiated the 'initial position'. This solution initially creates it in no mans land, then will manually change it to a visible layer the next frame.
                    //This serves to offset this 'tick' until the 'next tick'.
                    gameUtils.executeSomethingNextFrame(() => {
                        if(!routeArrow._destroyed) {
                            graphicsUtils.changeDisplayObjectStage(routeArrow, 'hudOne');
                        }
                    });
                    let arrowRouteTimer = graphicsUtils.sendSpriteToDestinationAtSpeed({sprite: routeArrow, start: start, destination: destination, speed: 0.75, removeOnFinish: true});
                    if(this.isMimicing) {
                        arrowRouteTimer.mimicry = this.mimicLeft;
                    }
                    myArrowTimers.push(arrowRouteTimer);
                }
            });

            timer.mimicry = 40000;
            Matter.Events.on(timer, 'onInvalidate', () => {
                myArrowTimers.forEach((t) => {
                    t.invalidate();
                });
            });

            let sendSpriteObj = {timer: timer, color: travelToken ? travelTokenColor : colors[index]};
            return sendSpriteObj;
        };

        if(this.outingNodes.length == 0) {
            this.clearRouteArrows();
        } else {
            var battleNodeIndex = 0;

            //if we're in the midst of an outing, use the outing node memory, else use the current outing nodes + 1. The plus 1 accounts for adds and subtracts
            var nodesToSample = this.outingInProgress ? this.outingNodeMemory.length : this.outingNodes.length + 1;
            mathArrayUtils.repeatXTimes((index) => {
                //either use the set of outing nodes or the outing node memory (which occurs when we've started an outing)
                var nodesToUse = this.outingNodes;
                if(this.outingInProgress) {
                    nodesToUse = this.outingNodeMemory;
                }
                let currentNode = nodesToUse[index];
                let previousNode = index == 0 ? {id: 'headToken', position: mathArrayUtils.clonePosition(this.currentNode.position)} : nodesToUse[index-1];

                if(currentNode && currentNode.travelToken && currentNode.isCompleted) {
                    return;
                }

                if(this.completedNodes && this.completedNodes.indexOf(currentNode) >= 0) {
                    battleNodeIndex += 1;
                    return;
                }

                //detect removals (from the end of the array)
                if(this.outingArrows[index] && currentNode == null) {
                    this.outingArrows[index].timer.invalidate();
                    mathArrayUtils.removeObjectFromArray(this.outingArrows[index], this.outingArrows);
                } else if(this.outingArrows[index] == null && currentNode != null) {
                    //detect additions
                    let sendObj = sendSpriteWrapper(previousNode.position, currentNode.position, battleNodeIndex, currentNode.travelToken);
                    this.outingArrows[index] = {timer: sendObj.timer, sendObj: sendObj, id: currentNode.id};
                } else if(this.outingArrows[index] && this.outingArrows[index].id != currentNode.id) {
                    //detect changes (removals from the middle)

                    //kill current --> changed node and replace with new arrow
                    this.outingArrows[index].timer.invalidate();
                    let sendObj = sendSpriteWrapper(previousNode.position, currentNode.position, battleNodeIndex, currentNode.travelToken);
                    this.outingArrows[index] = {timer: sendObj.timer, sendObj: sendObj, id: currentNode.id};

                    //kill changed --> it's previous next
                    if(this.outingArrows[index+1]) {
                        this.outingArrows[index+1].timer.invalidate();
                        mathArrayUtils.removeObjectFromArray(this.outingArrows[index+1], this.outingArrows);
                    }
                }

                if(currentNode && !currentNode.travelToken) {
                    battleNodeIndex += 1;
                }
            }, nodesToSample);

            //update colors (if our outing is not in progress)
            var nonTokenIndex = 0;
            if(!this.outingInProgress) {
                this.outingArrows.forEach((outingArrowObject, index) => {
                    if(outingArrowObject.sendObj.color != travelTokenColor) {
                        outingArrowObject.sendObj.color = colors[nonTokenIndex];
                        nonTokenIndex += 1;
                    }
                });
            }
        }
    };

    this.clearRouteArrows = function() {
        mathArrayUtils.reverseForEach(this.outingArrows, (outingArrowObj, index) => {
            if(outingArrowObj) {
                outingArrowObj.timer.invalidate();
                mathArrayUtils.removeObjectFromArray(this.outingArrows[index], this.outingArrows);
            }
        });
    };

    this.clearOuting = function(options) {
        options = options || {};

        //clear visuals
        this.inProgressOutingNodes.forEach((node) => {
            node.unshowNodeInOuting();
        });
        this.outingNodes.forEach((node) => {
            node.unshowNodeInOuting();
        });

        $('body').off('keydown.engagespace');

        graphicsUtils.removeSomethingFromRenderer(this.engageText);

        //if our outing is not in progress, clear any state related to the configured outing
        if (!this.outingInProgress) {
            this.allowMouseEvents(true);
            this.allowKeyEvents(true);

            this.inProgressOutingNodes.forEach((node) => {
                if (node.getOutingCompatibleNode) {
                    node = node.getOutingCompatibleNode();
                }
                node.levelDetails.semiCustomWinBehavior = null;
            });
            this.outingNodes.forEach((node) => {
                if (node.getOutingCompatibleNode) {
                    node = node.getOutingCompatibleNode();
                }
                node.levelDetails.semiCustomWinBehavior = null;
            });
            this.outingNodes = [];
            this.outingNodeMemory = [];
            this.updateRouteArrows();
            this.updatePlaneDropIndicators()
            this.inProgressOutingNodes = [];

            this.engageText = null;
        }

    };

    this.isNodeInOuting = function(node) {
        return this.outingNodes.indexOf(node) > -1;
    };

    this.updateOutingEngagement = function() {
        var game = globals.currentGame;

        //refresh the graphics
        var myIndex = 0;
        this.outingNodes.forEach((node, index) => {
            node.showNodeInOuting({
                number: myIndex,
                travelToken: node.travelToken
            });
            if(!node.travelToken) {
                myIndex += 1;
            }
        });

        //create the space to embark text
        if (this.outingNodes.length > 0 && this.engageText == null) {
            this.engageText = graphicsUtils.addSomethingToRenderer("TEX+:Space to embark (" + this.outingNodes.length + "/3)", {
                where: 'hudText',
                style: styles.escapeToContinueStyle,
                anchor: {
                    x: 0.5,
                    y: 1
                },
                position: {
                    x: gameUtils.getPlayableWidth() - 260,
                    y: gameUtils.getPlayableHeight() - 10
                }
            });
            this.spaceFlashTimer = graphicsUtils.graduallyTint(this.engageText, 0xFFFFFF, 0x3183fe, 120, null, false, 3);
            game.currentScene.add(this.engageText);
            game.soundPool.positiveSoundFast.play();

            //add space listener
            $('body').on('keydown.engagespace', function(event) {
                var key = event.key.toLowerCase();
                if (key == ' ') {
                    if(!this.keyEventsAllowed) {
                        return;
                    }
                    var legal = this.isOutingLegal();
                    if(!legal.result) {
                        game.toastMessage({message: legal.message, state: 'cantdo'});
                        return;
                    }
                    $('body').off('keydown.engagespace');
                    game.soundPool.sceneContinue.play();
                    this.spaceFlashTimer.invalidate();
                    this.embarkOnOuting();
                    graphicsUtils.graduallyTint(this.engageText, 0xFFFFFF, 0x6175ff, 60, null, false, 3, function() {
                        this.engageText.visible = false;
                    }.bind(this));
                }
            }.bind(this));
        } else if (this.outingNodes.length == 0) {
            $('body').off('keydown.engagespace');
            graphicsUtils.removeSomethingFromRenderer(this.engageText);
            this.engageText = null;
        } else {
            var nonTokenNodes = this.getNonTokenNodes();
            this.engageText.text = "Space to embark (" + nonTokenNodes.length + "/3)";
        }
    };

    this.getNonTokenNodes = function() {
        var nonTokenNodes = this.outingNodes.filter((node) => {
            return !node.travelToken;
        });

        return nonTokenNodes;
    };

    this.outingIsAtMaxLength = function() {
        var nonTokenNodes = this.getNonTokenNodes();
        return nonTokenNodes.length == this.maxOutingLength;
    };

    this.canAddNodeToOuting = function(node) {
        if(node.travelToken) {
            return true;
        }

        return !this.outingIsAtMaxLength();
    };

    this.isOutingLegal = function() {
        var finalNode = this.outingNodes[this.outingNodes.length - 1];

        if(finalNode.travelToken && this.getNonTokenNodes().length > 0) {
            return {result: false, message: 'Final destination must be an enemy camp'};
        }

        return {result: true};
    };

    this.embarkOnOuting = function() {
        this.outingInProgress = true;
        this.preOutingNode = this.currentNode;
        this.outingAdrenalineGained = 0;
        this.completedNodes = [];
        this.outingNodeMemory = [...this.outingNodes];

        this.allowMouseEvents(false);
        this.allowKeyEvents(false);

        var finalNode = this.outingNodes[this.outingNodes.length - 1];

        //Change the win/continuation behavior of some of these nodes
        this.outingNodes.forEach((node) => {
            var myNode = node;

            //don't change the final node's behavior
            if (myNode == finalNode) {
                return;
            }

            //sometimes we need to get the right "sub node" for the node (multi level)
            var outingManipulatedNode = myNode;
            if (myNode.getOutingCompatibleNode) {
                outingManipulatedNode = myNode.getOutingCompatibleNode();
            }

            //define custom win behavior
            var level = outingManipulatedNode.levelDetails;
            outingManipulatedNode.levelDetails.semiCustomWinBehavior = () => {
                this.completedNodes.push(myNode);
                globals.currentGame.unitSystem.deselectAllUnits();
                globals.currentGame.unitSystem.pause();
                unitUtils.pauseTargetingAndResumeUponNewLevel();

                Matter.Events.trigger(globals.currentGame, 'OutingLevelCompleted', {
                    result: 'victory'
                });

                //disable the cursor
                gameUtils.setCursorStyle('None');

                level.showAdrenalineReward({
                    onAdrenalineAdd: (amount) => {
                        this.outingAdrenalineGained += amount;
                    },
                    onDone: function(options) {
                        Matter.Events.trigger(level, 'endLevelActions');
                        globals.currentGame.transitionToBlankScene();
                        this.show({
                            backgroundAlpha: 1.0,
                            backgroundTint: 0x000d07
                        });
                        gameUtils.doSomethingAfterDuration(() => {
                            //get the next node and trigger the mouse down behavior
                            var mapnode = this.outingNodes.shift();
                            this.inProgressOutingNodes.push(mapnode);
                            mapnode.onMouseDownBehavior({
                                systemTriggered: true,
                                keepCurrentCollector: true
                            });
                        }, 1500);
                    }.bind(this),
                    endAfter: null
                });
            };
        });

        //start the first node which will kick off the whole process
        var firstNode = this.outingNodes.shift();
        this.inProgressOutingNodes.push(firstNode);
        firstNode.onMouseDownBehavior({
            systemTriggered: true
        });

        //let everyone know
        Matter.Events.trigger(globals.currentGame, 'EmbarkOnOuting', {outingNodes: this.outingNodeMemory});

        //These two handlers will be removed after the outing is completed just in case the outing consisted only
        //of a travel token
        this.beginLevelHandler = gameUtils.matterOnce(globals.currentGame, 'BeginLevel', () => {
            Matter.Events.trigger(globals.currentGame, 'BeginPrimaryBattle');
        });

        //upon normal win/loss behavior clear the outing
        this.finalWinHandler = gameUtils.matterOnce(globals.currentGame, 'VictoryOrDefeat', (event) => {
            this._completeOuting({finalNode: finalNode, result: event.result});
        });
    };

    this._completeOuting = function(options) {
        let result = options.result;
        let finalNode = options.finalNode;

        this.outingInProgress = false;
        this.clearOuting();
        this.allowMouseEvents(true);
        this.clearRouteArrows();
        finalNode.unshowNodeInOuting(true);

        //if we have a result
        if (result == 'victory') {
            this.completedNodes.push(finalNode);
        }

        this.beginLevelHandler.removeHandler();
        this.finalWinHandler.removeHandler();
    };

    this.getPlayerMapPosition = function() {
        return this.headTokenBody.position;
    };

    this.isOnTravelToken = function() {
        return this.currentNode.travelToken;
    };

    this.isOnActiveTravelToken = function() {
        return this.currentNode.travelToken && !this.currentNode.isCompleted;
    };

    this.travelToNode = function(node, destinationCallback) {
        this.allowMouseEvents(false);
        this.allowKeyEvents(false);
        this.lastNode = this.currentNode;
        this.currentNode = node;

        var position = mathArrayUtils.clonePosition(node.travelPosition || node.position, {
            y: 20
        });

        let travelSpeed = 2.5 * (this.hasMorphine() ? 2 : 1);

        gameUtils.sendBodyToDestinationAtSpeed(this.headTokenBody, position, travelSpeed, null, null, function() {
            Matter.Body.setVelocity(this.headTokenBody, {
                x: 0.0,
                y: 0.0
            });
            Matter.Events.trigger(node, "ArrivedAtNode", {});
            destinationCallback();
        }.bind(this));
        Matter.Events.trigger(globals.currentGame, "TravelStarted", {
            continueFromCurrentFatigue: this.lastNode.travelToken,
            node: node,
            headVelocity: this.headTokenBody.velocity,
            startingFatigue: this.startingFatigue
        });
    };

    this.revertHeadToPreviousLocationDueToDefeat = function() {
        Matter.Body.setPosition(this.headTokenBody, mathArrayUtils.clonePosition(this.lastNode.position, {
            y: 20
        }));

        var node = this.lastNode;
        this.currentNode = node;
        Matter.Events.trigger(globals.currentGame, "TravelReset", {
            resetToNode: node
        });
    };

    this.findLevelById = function(id) {
        if (!this.graph) return null;
        var levelNode = this.graph.find(node => {
            return id == node.levelDetails.levelId;
        });
        return levelNode.levelDetails;
    };

    this.findNodeById = function(id) {
        if (!this.graph) return null;
        var levelNode = this.graph.find(node => {
            return id == node.levelDetails.levelId;
        });
        return levelNode;
    };

    this.areAllRequiredNodesExceptCampCompleted = function() {
        let foundIncomplete = this.graph.find(node => {
            return node.type != 'camp' && !node.isCompleted && !node.travelToken;
        });

        if (foundIncomplete) {
            return false;
        } else {
            return true;
        }
    };

    this.setHeadToken = function(renderlingId) {
        var self = this;
        mathArrayUtils.operateOnObjectByKey(this.headTokenBody.renderlings, function(key, rl) {
            if (key == renderlingId) {
                self.headTokenSprite = rl;
            } else {
                rl.visible = false;
            }
        });
    };

    //this takes either a raw position or a map node
    this.setHeadTokenPosition = function(options) {
        if (options.node) {
            var node = options.node;
            var position = mathArrayUtils.clonePosition(node.travelPosition || node.position, {
                y: 20
            });
            Matter.Body.setPosition(this.headTokenBody, position);
            this.currentNode = node;
        } else {
            Matter.Body.setPosition(this.headTokenBody, options);
        }
    };
};
export default map;
