import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Tooltip from '@core/Tooltip.js'
import {levelSpecifier} from '@games/Us/MapAndLevel/Levels/LevelSpecifier.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import styles from '@utils/Styles.js'
import MapLevelNode from '@games/Us/MapAndLevel/Map/MapNode.js'

/*
 * Main Map object
 */
//Map sounds
var openmapSound = gameUtils.getSound('openmap.wav', {volume: .15, rate: 1.0});
var openmapSound2 = gameUtils.getSound('openmap2.wav', {volume: .06, rate: .8});
var openmapSound3 = gameUtils.getSound('openmap3.wav', {volume: .04, rate: .8});

//Creates the map, the map head, the map nodes and their tooltips, as well as initializes the level obj which the player will enter upon clicking the node
var map = function(specs) {

    //camp location
    var campLocation = gameUtils.getPlayableCenter();

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
            stage: 'hudNOne'
        },
    ];
    global.currentGame.addBody(this.headTokenBody);
    this.headTokenSprite = this.headTokenBody.renderlings.headtoken;
    this.headTokenSprite.visible = false;
    Matter.Body.setPosition(this.headTokenBody, mathArrayUtils.clonePosition(campLocation, {y: 20}));

    //setup fatigue functionality
    this.startingFatigue = 0;
    this.fatigueText = graphicsUtils.createDisplayObject("TEX+:" + 'Fatigue: 0%', {position: {x: 100, y: 100}, style: styles.fatigueText, where: "hudNOne"});
    Matter.Events.on(this, "SetFatigue", function(event) {
        this.fatigueText.alpha = .9;
        var amount = event.amount;
        this.fatigueText.text = 'Fatigue: ' + event.amount + '%';
    }.bind(this))
    gameUtils.attachSomethingToBody({something: this.fatigueText, body: this.headTokenBody, offset: {x: 0, y: 20}});

    //Create main map sprite
    this.mapSprite = graphicsUtils.createDisplayObject('MapBackground', {where: 'foreground', position: gameUtils.getPlayableCenter()});
    graphicsUtils.graduallyTint(this.mapSprite, 0x878787, 0x5565fc, 5000, null, 1800);

    this.levels = specs.levels;
    this.travelInProgress = false;
    this.graph = [];

    //setup other properties
    this.mouseEventsAllowed = true;

    //Add the camp node
    var mainCamp = levelSpecifier.create('camp', specs.worldSpecs);
    var initialCampNode = new MapLevelNode({levelDetails: mainCamp, mapRef: this,tokenSize: 50, largeTokenSize: 55,
        travelPredicate: function() {
            return this.campAvailableCount >= 3 && this.mapRef.currentNode != this;
        },
        hoverCallback: function() {
            return this.travelPredicate();
        },
        unhoverCallback: function() {
            // this.availabilityText.visible = false;
            return this.travelPredicate();
        },
        manualTokens: function() {
            var regularToken = graphicsUtils.createDisplayObject('CampfireToken', {where: 'hudNTwo'});
            var specialToken = graphicsUtils.createDisplayObject('CampfireTokenGleam', {where: 'hudNTwo'});
            Matter.Events.on(this.mapRef, 'showMap', function() {
                if(this.travelPredicate()) {
                    regularToken.visible = true;
                    specialToken.visible = true;
                    if(!this.gleamTimer) {
                        this.gleamTimer = graphicsUtils.fadeBetweenSprites(regularToken, specialToken, 500, 900, 0);
                        Matter.Events.on(regularToken, 'destroy', () => {
                            this.gleamTimer.invalidate();
                        })
                    }
                    regularToken.tint = 0xFFFFFF;
                    specialToken.tint = 0xFFFFFF;
                    regularToken.visible = true;
                    specialToken.visible = true;
                    this.gleamTimer.reset();
                } else {
                    if(this.mapRef.currentNode == this) {
                        regularToken.alpha = 1
                        regularToken.tint = 0xFFFFFF;
                    } else {
                        regularToken.alpha = 1;
                        regularToken.tint = 0x7c7c7c;
                    }
                    regularToken.visible = true;
                    specialToken.visible = false;
                    if(this.gleamTimer) {
                        this.gleamTimer.paused = true;
                    }
                }
            }.bind(this))
            return [regularToken, specialToken];
        },
        init: function() {
            Matter.Events.on(globals.currentGame, 'TravelStarted', function(event) {
                if(!this.campAvailableCount) {
                    this.campAvailableCount = 0;
                }
                this.campAvailableCount++;

                if(event.node == this) {
                    this.campAvailableCount = 0;
                }
            }.bind(this));

            Matter.Events.on(globals.currentGame, 'TravelReset', function() {
                this.campAvailableCount--;
            }.bind(this));

            Matter.Events.on(this, 'ArrivedAtNode', function() {
                this.mapRef.startingFatigue = 0;
            }.bind(this));

            Matter.Events.on(this.mapRef, 'showMap', function() {
                var availabilityText = 'Available now.';
                if(this.mapRef.currentNode != this && !this.travelPredicate()) {
                    var nodesLeft = 3 - this.campAvailableCount % 3;
                    var roundS = nodesLeft == 1 ? ' round.' : ' rounds.';
                    availabilityText = 'Available in ' + nodesLeft + roundS;
                } else if(this.mapRef.currentNode == this) {
                    availabilityText = 'Currently in camp.'
                }
                this.displayObject.tooltipObj.setMainDescription(availabilityText);
            }.bind(this));
        },
        cleanUpExtension: function() {

        },
        tooltipTitle: 'Camp Noir',
        tooltipDescription: '',
    });

    initialCampNode.setPosition(campLocation);
    this.campNode = initialCampNode;
    this.currentNode = initialCampNode;
    this.graph.push(initialCampNode);

    //Non-airdrop levels
    for(const key in this.levels) {
        if(key.includes('airDrop')) continue;
        for(var x = 0; x < this.levels[key]; x++) {

            var level = levelSpecifier.create(key, specs.worldSpecs);
            var mapNode = level.createMapNode({levelDetails: level, mapRef: this});

            //Determine position
            var position;
            var collision;
            var nodeBuffer = 100;
            do {
                collision = false;
                position = gameUtils.getRandomPositionWithinRadiusAroundPoint(gameUtils.getPlayableCenter(), 200, level.nodeBuffer || 20);
                for(let node of this.graph) {
                    if(mathArrayUtils.distanceBetweenPoints(node.position, position) < nodeBuffer) {
                        collision = true;
                        break;
                    }
                }
            } while(collision)

            if(level.manualSetPosition) {
                level.manualSetPosition(position);
            } else {
                mapNode.setPosition(position);
            }

            if(level.manualAddToGraph) {
                level.manualAddToGraph(this.graph)
            } else {
                this.graph.push(mapNode);
            }
        }
    }

    //Add air drop stations
    var airDropClickTokenSound = gameUtils.getSound('clickairdroptoken1.wav', {volume: .03, rate: 1});
    var airDrops = this.levels.airDropStations + this.levels.airDropSpecialStations;
    for(var x = 0; x < airDrops; x++) {
        var key = 'airDropStations';
        var regularTokenName = 'AirDropToken';
        var specialTokenName = 'AirDropTokenGleam';
        if(x >= this.levels.airDropStations) {
            key = 'airDropSpecialStations';
            var regularTokenName = 'AirDropSpecialToken';
            var specialTokenName = 'AirDropSpecialTokenGleam'
        }

        //Determine position
        var position;
        var collision;
        var nodeBuffer = 100;
        do {
            collision = false;
            position = gameUtils.getRandomPlacementWithinPlayableBounds(50);
            for(let node of this.graph) {
                if(mathArrayUtils.distanceBetweenPoints(node.position, position) < nodeBuffer) {
                    collision = true;
                    break;
                }
            }
        } while(collision)

        var level = levelSpecifier.create(key, specs.worldSpecs);
        var mapNode = new MapLevelNode({levelDetails: level, mapRef: this, tokenSize: 50, largeTokenSize: 60,
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
                    if(node.canBePrereq() && node.isBattleNode && !node.chosenAsPrereq && mathArrayUtils.distanceBetweenPoints(position, node.position) < prereqDistanceLimit) {
                        node.chosenAsPrereq = true;
                        node.master = this;
                        this.prereqs.push(node);
                    }
                    count++;
                } while(this.prereqs.length < level.prereqCount)
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
                var regularToken = graphicsUtils.createDisplayObject(regularTokenName, {where: 'hudNTwo'});
                var specialToken = graphicsUtils.createDisplayObject(specialTokenName, {where: 'hudNTwo'});
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

        mapNode.setPosition(position);
        this.graph.push(mapNode);
    }

    this.show = function() {
        this.fatigueText.text = 'Fatigue: ' + (this.startingFatigue || 0) + '%';
        this.fatigueText.alpha = .3;
        // openmapSound.play();
        openmapSound2.play();
        openmapSound3.play();
        graphicsUtils.addOrShowDisplayObject(this.mapSprite);
        this.graph.forEach(node => {
            if(node.isCompleted) {
                if(node.justCompleted) { //just completed allows the node to signal it deactivation with an animation the first time
                    node.justCompleted = false;
                } else {
                    node.deactivateToken();
                }
            } else {
                node.setToDefaultState();
            }
            graphicsUtils.addOrShowDisplayObject(node.displayObject)
            if(node.manualTokens) {
                node.manualTokens.forEach((token) => {
                    graphicsUtils.addOrShowDisplayObject(token);
                })
            }
        })

        graphicsUtils.addOrShowDisplayObject(this.headTokenSprite);
        graphicsUtils.addOrShowDisplayObject(this.fatigueText);

        Matter.Events.trigger(this, 'showMap', {});
    }

    this.hide = function() {
        Matter.Events.trigger(this, 'hideMap', {});
        this.mapSprite.visible = false;
        this.graph.forEach(node => {
            node.displayObject.visible = this.mapSprite.visible;
            if(node.displayObject.tooltipObj) {
                node.displayObject.tooltipObj.hide();
            }
            if(node.manualTokens) {
                node.manualTokens.forEach((token) => {
                    token.visible = this.mapSprite.visible;
                })
            }
            if(node.isFocused) {
                node.unfocusNode();
                graphicsUtils.removeSomethingFromRenderer(node.focusCircle);
            }
        })

        this.headTokenSprite.visible = false;
        this.fatigueText.visible = false;
    },

    this.allowMouseEvents = function(value) {
        this.mouseEventsAllowed = value;
    },

    this.travelToNode = function(node, destinationCallback) {
        this.travelInProgress = true;
        this.lastNode = this.currentNode;
        this.currentNode = node;
        this.startingFatigue += 5;
        var position = mathArrayUtils.clonePosition(node.travelPosition || node.position, {y: 20});
        gameUtils.sendBodyToDestinationAtSpeed(this.headTokenBody, position, 2.5, null, null, function() {
            Matter.Body.setVelocity(this.headTokenBody, {
                x: 0.0,
                y: 0.0
            });
            this.travelInProgress = false;
            Matter.Events.trigger(node, "ArrivedAtNode", {});
            destinationCallback();
        }.bind(this));
        console.info(this.headTokenBody.velocity);
        Matter.Events.trigger(globals.currentGame, "TravelStarted", {node: node, headVelocity: this.headTokenBody.velocity, startingFatigue: this.startingFatigue});
    }

    this.revertHeadToPreviousLocationDueToDefeat = function() {
        Matter.Body.setPosition(this.headTokenBody, mathArrayUtils.clonePosition(this.lastNode.position, {y: 20}));
        this.currentNode = this.lastNode;
        this.startingFatigue -= 5;
        Matter.Events.trigger(globals.currentGame, "TravelReset", {resetToNode: this.lastNode});
    }
}
export default map;