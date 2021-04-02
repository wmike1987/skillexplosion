import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import Tooltip from '@core/Tooltip.js';
import {
    levelFactory
} from '@games/Us/MapAndLevel/Levels/LevelFactory.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import styles from '@utils/Styles.js';

/*
 * Main Map object
 */
//Map sounds
var openmapSound = gameUtils.getSound('openmap.wav', {
    volume: 0.15,
    rate: 1.0
});
var openmapSound2 = gameUtils.getSound('openmap2.wav', {
    volume: 0.06,
    rate: 0.8
});
var openmapSound3 = gameUtils.getSound('openmap3.wav', {
    volume: 0.04,
    rate: 0.8
});

//Creates the map, the map head, the map nodes and their tooltips, as well as initializes the level obj which the player will enter upon clicking the node
var map = function(specs) {

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
    global.currentGame.addBody(this.headTokenBody);
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

    //Create main map sprite
    this.mapSprite = graphicsUtils.createDisplayObject('MapBackground', {
        where: 'foreground',
        position: gameUtils.getPlayableCenter()
    });
    graphicsUtils.graduallyTint(this.mapSprite, 0x878787, 0x5565fc, 5000, null, 1800);

    this.worldSpecs = specs;
    this.graph = [];

    //setup other properties
    this.mouseEventsAllowed = true;

    this.addMapNode = function(levelType, options) {
        options = options || {};
        var level = levelFactory.create(levelType, this.worldSpecs, options.levelOptions);

        //Determine position
        var position = options.position;
        var collision;
        var nodeBuffer = 100;
        if (!position) {
            do {
                collision = false;
                position = gameUtils.getRandomPositionWithinRadiusAroundPoint(gameUtils.getPlayableCenter(), 200, level.nodeBuffer || 20);
                for (let node of this.graph) {
                    if (mathArrayUtils.distanceBetweenPoints(node.position, position) < nodeBuffer) {
                        collision = true;
                        break;
                    }
                }
            } while (collision);
        }

        //air drop station needs the position upon init to determine its prerequisites
        var mapNode = level.createMapNode({
            levelDetails: level,
            mapRef: this,
            position: position
        });
        level.mapNode = mapNode; //add back reference

        if (level.manualNodePosition) {
            var returnedPosition = level.manualNodePosition(position);
            if (returnedPosition) {
                mapNode.setPosition(returnedPosition);
            }
        } else {
            mapNode.setPosition(position);
        }

        if (level.manualAddToGraph) {
            level.manualAddToGraph(this.graph);
        } else {
            this.graph.push(mapNode);
        }

        return mapNode;
    };

    this.show = function() {
        this.fatigueText.text = 'Fatigue: ' + (this.startingFatigue || 0) + '%';
        this.fatigueText.alpha = 0.3;
        this.allowMouseEvents(true);
        openmapSound2.play();
        openmapSound3.play();
        graphicsUtils.addOrShowDisplayObject(this.mapSprite);
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

        Matter.Events.trigger(this, 'showMap', {});
        Matter.Events.trigger(globals.currentGame, 'showMap', {});
    };

    this.hide = function() {
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

            this.headTokenSprite.visible = false;
            this.fatigueText.visible = false;
        },

        this.allowMouseEvents = function(value) {
            this.mouseEventsAllowed = value;
        },

        this.travelToNode = function(node, destinationCallback) {
            this.allowMouseEvents(false);
            this.lastNode = this.currentNode;
            this.currentNode = node;
            this.startingFatigue += 5;
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
        },

        this.revertHeadToPreviousLocationDueToDefeat = function() {
            Matter.Body.setPosition(this.headTokenBody, mathArrayUtils.clonePosition(this.lastNode.position, {
                y: 20
            }));
            this.currentNode = this.lastNode;
            this.startingFatigue -= 5;
            Matter.Events.trigger(globals.currentGame, "TravelReset", {
                resetToNode: this.lastNode
            });
        },

        this.findLevelById = function(id) {
            if (!this.graph) return null;
            var levelNode = this.graph.find(node => {
                return id == node.levelDetails.levelId;
            });
            return levelNode.levelDetails;
        },

        this.setHeadToken = function(renderlingId) {
            var self = this;
            mathArrayUtils.operateOnObjectByKey(this.headTokenBody.renderlings, function(key, rl) {
                if (key == renderlingId) {
                    rl.visible = true;
                    self.headTokenSprite = rl;
                } else {
                    rl.visible = false;
                }
            });
        },

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
