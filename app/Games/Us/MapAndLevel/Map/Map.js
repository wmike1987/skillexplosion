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
    this.inProgressOutingNodes = [];
    this.maxOutingLength = 3;

    //create the head token
    this.headTokenBody = Matter.Bodies.circle(0, 0, 4, {
        isSensor: true,
        frictionAir: 0.0,
    });
    var fatigueScaleX = 1;
    var fatigueScaleY = 1;
    this.headTokenBody.renderChildren = [{
            id: 'headtoken',
            data: "HeadToken",
            stage: 'hudNOne',
        },
        {
            id: 'shaneOnly',
            data: "ShaneHeadToken",
            stage: 'hudNOne',
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
        where: "hudNOne"
    });
    Matter.Events.on(this, "SetFatigue", function(event) {
        this.fatigueText.alpha = 0.9;
        var amount = event.amount;
        this.fatigueText.text = 'Fatigue: ' + event.amount + '%';
    }.bind(this));
    gameUtils.attachSomethingToBody({
        something: this.fatigueText,
        body: this.headTokenBody,
        offset: {
            x: 0,
            y: 20
        }
    });

    //manage adrenaline
    this.adrenaline = 0;
    this.adrenalineMax = 4;
    this.adrenalineText = graphicsUtils.createDisplayObject("TEX+:" + 'Adrenaline', {
        position: {
            x: 90,
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

    this.addAdrenalineBlock = function() {
        if (this.adrenaline >= this.adrenalineMax) {
            return;
        }
        this.adrenaline += 1;
        let offset = 18;
        let newBlock = graphicsUtils.createDisplayObject('TintableSquare', {
            position: {
                x: 47.5 + this.adrenaline * offset,
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
    };

    this.removeAdrenalineBlock = function() {
        if (this.adrenaline == 0) {
            return;
        }
        let lastBlock = this.adrenalineBlocks[this.adrenalineBlocks.length - 1];
        mathArrayUtils.removeObjectFromArray(lastBlock, this.adrenalineBlocks);
        this.removedAdrenalineBlocks.push(lastBlock);
        this.adrenaline -= 1;
    };

    Matter.Events.on(globals.currentGame, 'EnterLevel', function(event) {
        if (event.level.isCampProper) {
            this.adrenalineBlocks.forEach((item, i) => {
                graphicsUtils.removeSomethingFromRenderer(item);
            });
            this.adrenaline = 0;
            this.adrenalineBlocks = [];
        }
    }.bind(this));

    Matter.Events.on(globals.currentGame, 'VictoryOrDefeat OutingLevelCompleted', function(event) {
        if (event.result == 'victory') {
            this.startingFatigue += 3;
        }
    }.bind(this));

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
    this.keyEventsAllowed = true;

    this.addMapNode = function(levelType, options) {
        //default these values
        var genericOptions = options || {};
        genericOptions.levelOptions = genericOptions.levelOptions || {};
        genericOptions.mapNodeOptions = genericOptions.mapNodeOptions || {};

        //Determine position unless otherwise specified
        var position = genericOptions.position;
        var collision, outOfBounds = false;
        var nodeBuffer = 100;
        var radius = genericOptions.levelOptions.outer ? 1000 : 200;
        var minRadius = genericOptions.levelOptions.outer ? 400 : 0;
        var tries = 0;
        if (!position) {
            do {
                if (tries > 40) {
                    tries = 0;
                    radius += 100;
                }
                collision = false;
                position = gameUtils.getRandomPositionWithinRadiusAroundPoint(gameUtils.getPlayableCenter(), radius, 40, minRadius);
                if (!gameUtils.isPositionWithinPlayableBounds(position)) {
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
        var level = levelFactory.create(levelType, this.worldSpecs, Object.assign(genericOptions, {mapRef: this}));

        //add to map graph if not handled manually
        if(!level.manualAddToGraph) {
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

    this.show = function() {
        this.isShown = true;
        this.fatigueText.text = 'Fatigue: ' + (this.startingFatigue || 0) + '%';
        this.fatigueText.alpha = 0.3;

        if(!this.outingInProgress) {
            this.allowMouseEvents(true);
        }

        this.allowKeyEvents(true);
        openmapSound2.play();
        openmapSound3.play();
        graphicsUtils.addOrShowDisplayObject(this.mapSprite);
        if(this.newPhase) {
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

        this.removedAdrenalineBlocks.forEach((item, i) => {
            graphicsUtils.addOrShowDisplayObject(item);
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

        if(this.outingInProgress) {
            this.outingNodeMemory.forEach((node, index) => {
                node.showNodeInOuting({number: index, defaultSize: true});
            });
        }

        Matter.Events.trigger(this, 'showMap', {});
        Matter.Events.trigger(globals.currentGame, 'showMap', {});
    };

    this.hide = function() {
        this.isShown = false;
        Matter.Events.trigger(this, 'hideMap', {});

        this.mapSprite.visible = false;
        this.graph.forEach(node => {
            node.displayObject.visible = this.mapSprite.visible;
            if (node.displayObject.tooltipObj) {
                node.displayObject.tooltipObj.hide();
            }
            if (node.manualTokens) {
                node.manualTokens.forEach((token) => {
                    token.visible = this.mapSprite.visible;
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

        this.headTokenSprite.visible = false;
        this.fatigueText.visible = false;
        this.adrenalineText.visible = false;
        this.adrenalineBlocks.forEach((item, i) => {
            item.visible = false;
        });
        this.removedAdrenalineBlocks.forEach((item, i) => {
            item.visible = false;
        });
        this.removedAdrenalineBlocks = [];
    };

    this.allowMouseEvents = function(value) {
        this.mouseEventsAllowed = value;
    };

    this.allowKeyEvents = function(value) {
        this.keyEventsAllowed = value;
    };

    this.addNodeToOuting = function(node) {
        this.outingNodes.push(node);
        this.updateOutingEngagement();
    };

    this.removeNodeFromOuting = function(node) {
        node.unshowNodeInOuting();
        mathArrayUtils.removeObjectFromArray(node, this.outingNodes);
        this.updateOutingEngagement();
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
        if(!this.outingInProgress) {
            this.allowMouseEvents(true);
            this.allowKeyEvents(true);

            this.inProgressOutingNodes.forEach((node) => {
                node.levelDetails.customWinBehavior = null;
            });
            this.outingNodes.forEach((node) => {
                node.levelDetails.customWinBehavior = null;
            });
            this.outingNodes = [];
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
        this.outingNodes.forEach((node, index) => {
            node.showNodeInOuting({number: index});
        });

        //create the space to embark text
        if(this.outingNodes.length > 0 && this.engageText == null) {
            this.engageText = graphicsUtils.addSomethingToRenderer("TEX+:Space to embark", {
                where: 'hudText',
                style: styles.escapeToContinueStyle,
                anchor: {
                    x: 0.5,
                    y: 1
                },
                position: {
                    x: gameUtils.getPlayableWidth() - 210,
                    y: gameUtils.getPlayableHeight() - 20
                }
            });
            this.spaceFlashTimer = graphicsUtils.graduallyTint(this.engageText, 0xFFFFFF, 0x3183fe, 120, null, false, 3);
            game.currentScene.add(this.engageText);
            game.soundPool.positiveSoundFast.play();

            //add space listener
            $('body').on('keydown.engagespace', function(event) {
                var key = event.key.toLowerCase();
                if (key == ' ') {
                    $('body').off('keydown.engagespace');
                    game.soundPool.sceneContinue.play();
                    this.spaceFlashTimer.invalidate();
                    this.embarkOnOuting();
                    graphicsUtils.graduallyTint(this.engageText, 0xFFFFFF, 0x6175ff, 60, null, false, 3, function() {
                        this.engageText.visible = false;
                    }.bind(this));
                }
            }.bind(this));
        } else if(this.outingNodes.length == 0) {
            $('body').off('keydown.engagespace');
            graphicsUtils.removeSomethingFromRenderer(this.engageText);
            this.engageText = null;
        }
    };

    this.isOutingFull = function() {
        return this.outingNodes.length >= this.maxOutingLength;
    };

    this.embarkOnOuting = function() {
        this.outingInProgress = true;
        this.preOutingNode = this.currentNode;
        this.outingAdrenalineGained = 0;
        this.completedNodes = [];
        this.outingNodeMemory = [...this.outingNodes];

        this.allowMouseEvents(false);
        this.allowKeyEvents(false);

        var finalNode = this.outingNodes[this.outingNodes.length-1];

        //Change the win behavior of every node except the final node
        this.outingNodes.forEach((node) => {
            var myNode = node;

            //don't change the final node's behavior
            if(myNode == finalNode) {
                return;
            }

            //sometimes we need to get the right "sub node" for the node we have here
            if(myNode.getOutingCompatibleNode) {
                myNode = myNode.getOutingCompatibleNode();
            }

            //define custom win behavior
            myNode.levelDetails.customWinBehavior = () => {
                this.completedNodes.push(myNode);
                globals.currentGame.unitSystem.deselectAllUnits();
                globals.currentGame.unitSystem.pause();
                unitUtils.pauseIdlingAndResumeUponNewScene();

                //show +1 adrenaline
                var t = "Excellent";
                if (!this.isAdrenalineFull()) {
                    this.addAdrenalineBlock();
                    this.outingAdrenalineGained += 1;
                    t = '+1 adrenaline!';
                }

                Matter.Events.trigger(globals.currentGame, 'OutingLevelCompleted', {result: 'victory'});

                //disable the cursor
                gameUtils.setCursorStyle('None');

                gameUtils.doSomethingAfterDuration(() => {
                    globals.currentGame.soundPool.positiveSoundFast.play();
                    var adrText = graphicsUtils.floatText(t, gameUtils.getPlayableCenterPlus({
                        y: 300
                    }), {
                        where: 'hudTwo',
                        style: styles.adrenalineTextLarge,
                        speed: 6,
                        duration: 1500
                    });
                    graphicsUtils.addGleamToSprite({
                        sprite: adrText,
                        gleamWidth: 50,
                        duration: 500
                    });
                }, 1000);

                //show the map and trigger a travel to the next node
                gameUtils.doSomethingAfterDuration(() => {
                    Matter.Events.trigger(myNode.levelDetails, 'endLevelActions');
                    globals.currentGame.transitionToBlankScene();
                    this.show();
                    gameUtils.doSomethingAfterDuration(() => {
                        //get the next node and trigger the mouse down behavior
                        var mapnode = this.outingNodes.shift();
                        this.inProgressOutingNodes.push(mapnode);
                        mapnode.onMouseDownBehavior({systemTriggered: true});
                    }, 2000);
                }, 2500);
            };
        });

        //start the first node which will kick off the whole process
        var firstNode = this.outingNodes.shift();
        this.inProgressOutingNodes.push(firstNode);
        firstNode.onMouseDownBehavior({systemTriggered: true});

        //let everyone know
        Matter.Events.trigger(globals.currentGame, "EmbarkOnOuting");

        //upon normal win/loss behavior clear the outing
        var outingWinLossHandler = gameUtils.matterOnce(globals.currentGame, "VictoryOrDefeat", (event) => {
            this.outingInProgress = false;
            this.clearOuting();

            //if we've won, add the finalNode to the completed node list
            if(event.result == 'victory') {
                this.completedNodes.push(finalNode);
            }
        });
    };

    this.travelToNode = function(node, destinationCallback) {
        this.allowMouseEvents(false);
        this.allowKeyEvents(false);
        this.lastNode = this.currentNode;
        this.currentNode = node;
        var position = mathArrayUtils.clonePosition(node.travelPosition || node.position, {
            y: 20
        });
        gameUtils.sendBodyToDestinationAtSpeed(this.headTokenBody, position, 2.5, null, null, function() {
            Matter.Body.setVelocity(this.headTokenBody, {
                x: 0.0,
                y: 0.0
            });
            Matter.Events.trigger(node, "ArrivedAtNode", {});
            destinationCallback();
        }.bind(this));
        Matter.Events.trigger(globals.currentGame, "TravelStarted", {
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

    this.areAllNodesExceptCampCompleted = function() {
        let foundIncomplete = this.graph.find(node => {
            return node.type != 'camp' && !node.isCompleted;
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
