import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Tooltip from '@core/Tooltip.js'
import {levelSpecifier} from '@games/Us/MapAndLevel/Levels/LevelSpecifier.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import styles from '@utils/Styles.js'

//Token Mappings
var typeTokenMappings = {
    singles: 'MapGoldBattleToken',
    hardened: 'MapRedBattleToken',
    doubles: 'MapRedBattleToken',
    boss: 'MapRedBattleToken',
    norevives: 'MapRedBattleToken',
    mobs: 'MobBattleToken',
    camp: 'CampfireToken',
    airDropStations: 'AirDropToken',
    airDropSpecialStations: 'AirDropSpecialToken',
}

var hoverTick = gameUtils.getSound('augmenthover.wav', {volume: .03, rate: 1});

//Define node object
var MapLevelNode = function(options) {
    this.mapRef = options.mapRef;
    this.levelDetails = options.levelDetails;
    this.travelPredicate = options.travelPredicate;
    this.type = this.levelDetails.type;

    if(options.manualTokens) {
        //custom map token
        this.displayObject = graphicsUtils.createDisplayObject('TransparentSquare', {where: 'hudNOne', scale: {x: 50, y: 50}});
        this.displayObject.interactive = true;
        this.manualTokens = options.manualTokens.call(this);
        this.manualTokens.forEach((token) => {
            token.interactive = true;
        })
    } else {
        //default behavior
        this.displayObject = graphicsUtils.createDisplayObject(typeTokenMappings[this.levelDetails.type], {where: 'hudNTwo', scale: {x: 1, y: 1}});
        this.displayObject.interactive = true;
    }

    //Build informational tooltip
    var enemyDescriptions = [];
    var enemyIcons = [];
    var self = this;
    this.levelDetails.enemySets.forEach(set => {
        self.isBattleNode = true;
        enemyDescriptions.push(' x ' + set.spawn.total);
        enemyIcons.push(set.icon);
    })
    Tooltip.makeTooltippable(this.displayObject, {
        title: this.levelDetails.type,
        description: enemyDescriptions,
        descriptionIcons: enemyIcons
    });

    //Call init() if specified
    if(options.init) {
        options.init.call(this);
    }

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
                this.displayObject.tint = 0x20cd2c;
                if(this.manualTokens) {
                    this.manualTokens.forEach((token) => {
                        token.tint = 0x20cd2c;
                    })
                }
            }
        }

        //if we're a prerequisite to something, highlight the master
        if(this.chosenAsPrereq && !this.master.isCompleted) {
            var node = this.master;
            node.focusCircle = graphicsUtils.addSomethingToRenderer('MapNodeFocusCircle', {where: 'hudNTwo', alpha: .8, position: node.position, scale: {x: 1.1, y: 1.1}});
            this.master.manualTokens.forEach((token) => {
                token.scale = {x: 1.1, y: 1.1};
            })
            graphicsUtils.rotateSprite(node.focusCircle, {speed: 20});
        }
    }.bind(this))
    this.displayObject.on('mouseout', function(event) {
        if(!this.mapRef.mouseEventsAllowed) return;

        if(!this.isCompleted && !this.mapRef.travelInProgress) {
            var doDefault = true;
            if(options.unhoverCallback) {
                doDefault = options.unhoverCallback.call(self);
            }
            if(doDefault) {
                this.displayObject.tint = 0xFFFFFF;
                if(this.manualTokens) {
                    this.manualTokens.forEach((token) => {
                        token.tint = 0xFFFFFF;
                    })
                }
            }
        }
        //if we're a prerequisite to something, unhighlight the master
        if(this.chosenAsPrereq && !this.master.isCompleted) {
            var node = this.master;
            graphicsUtils.removeSomethingFromRenderer(node.focusCircle);
            this.master.manualTokens.forEach((token) => {
                token.scale = {x: 1.0, y: 1.0};
            })
            node.focusCirlce = null;
        }
    }.bind(this))
    this.displayObject.on('mousedown', function(event) {
        if(!this.mapRef.mouseEventsAllowed) return;

        if(!self.isCompleted && !this.mapRef.travelInProgress) {
            this.displayObject.tint = 0xff0000;
            var canTravel = true;
            if(options.travelPredicate) {
                canTravel = this.travelPredicate();
            }
            if(canTravel) {
                // this.complete();
                this.mapRef.travelToNode(this, function() {
                    Matter.Events.trigger(globals.currentGame, "TravelFinished", {node: this});
                    this.levelDetails.enterNode(self);
                    this.displayObject.tint = 0xFFFFFF;
                }.bind(this));
            }
        }
    }.bind(this))

    if(options.deactivateToken) {
        this.deactivateToken = options.deactivateToken;
    }

    this.cleanUp = function() {
        graphicsUtils.removeSomethingFromRenderer(this.displayObject);
        if(this.manualTokens) {
            this.manualTokens.forEach((token) => {
                graphicsUtils.removeSomethingFromRenderer(token);
            })
        }
    }
}

MapLevelNode.prototype.deactivateToken = function() {
    this.displayObject.tint = 0x002404;
    this.displayObject.alpha = .5;
}

MapLevelNode.prototype.complete = function() {
    this.isCompleted = true;
    this.displayObject.tooltipObj.destroy();

    //setup flip animation
    var halfFlipTime = null
    var flipTime = null;
    var setFlipTime = function(time) {
        flipTime = time;
        halfFlipTime = time/2;
    }
    setFlipTime(80);
    var totalDone = 0;
    var spinningIn = true;
    var self = this;
    var spins = 20;
    var percentDone = 0;
    var slowDownThreshold = 5;
    this.isSpinning = true;
    this.flipTimer = globals.currentGame.addTimer({
        name: 'nodeFlipTimer' + mathArrayUtils.getId(),
        gogogo: true,
        tickCallback: function(deltaTime) {
            //if we're on our last flip, make it slow down during the turn
            if(spins <= slowDownThreshold) {
                var shelf = (slowDownThreshold - spins) * (1/slowDownThreshold);
                var fullPercentageDone = shelf + (spinningIn ? (percentDone/2)*(1/slowDownThreshold) : (1/slowDownThreshold/2)+(percentDone/2)*(1/slowDownThreshold));
                deltaTime *= Math.max(.25, 1-fullPercentageDone);
            }

            totalDone += deltaTime;
            percentDone = totalDone/halfFlipTime;

            if(percentDone >= 1) {
                percentDone = 0;
                totalDone = 0;
                if(!spinningIn) {
                    spins--;
                    if(spins == 0) {
                        this.invalidate();
                        self.displayObject.scale.x = 1;
                        self.isSpinning = false;
                        return;
                    }
                }
                spinningIn = !spinningIn;

                if(spinningIn) {
                    self.displayObject.tint = 0xFFFFFF;
                } else {
                    if(spins > 1) {
                        self.displayObject.tint = 0xbdbdbd;
                    } else {
                        self.deactivateToken();
                    }
                }
            }
            if(spinningIn) {
                self.displayObject.scale.x = 1-percentDone;
            } else {
                self.displayObject.scale.x = percentDone;
            }
        }
    })
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
    this.fatigueText = graphicsUtils.createDisplayObject("TEX+:" + 'Fatigue: 0%', {position: {x: 100, y: 100}, style: styles.fatigueText, where: "hudNOne"});
    Matter.Events.on(this, "SetFatigue", function(event) {
        this.fatigueText.alpha = .9;
        var amount = event.amount;
        this.fatigueText.text = 'Fatigue: ' + event.amount + '%';
    }.bind(this))
    gameUtils.attachSomethingToBody({something: this.fatigueText, body: this.headTokenBody, offset: {x: 0, y: 20}});
    this.fatigueBarSprite = this.headTokenBody.renderlings.fatigueBar;
    this.fatigueFillSprite = this.headTokenBody.renderlings.fatigueFill;

    //Create main map sprite
    this.mapSprite = graphicsUtils.createDisplayObject('MapBackground', {where: 'foreground', position: gameUtils.getPlayableCenter()});
    graphicsUtils.graduallyTint(this.mapSprite, 0x878787, 0x5565fc, 5000, null, 1800);

    this.levels = specs.levels;
    this.travelInProgress = false;
    this.graph = [];

    //setup other properties
    this.mouseEventsAllowed = true;
    this.nodeCount = 0;

    //Add the camp node
    var mainCamp = levelSpecifier.create('camp', specs.worldSpecs);
    var initialCampNode = new MapLevelNode({levelDetails: mainCamp, mapRef: this,
        travelPredicate: function() {
            return this.mapRef.nodeCount % 2 == 0 && this.mapRef.currentNode != this;
        },
        hoverCallback: function() {
            return this.travelPredicate();
        },
        unhoverCallback: function() {
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
                        regularToken.alpha = .5;
                        regularToken.tint = 0x002404;
                    }
                    regularToken.visible = true;
                    specialToken.visible = false;
                    if(this.gleamTimer) {
                        this.gleamTimer.paused = true;
                    }
                }
            }.bind(this))
            return [regularToken, specialToken];
        }});
    initialCampNode.setPosition(campLocation);
    this.currentNode = initialCampNode;
    this.graph.push(initialCampNode);
    this.lastNode = initialCampNode;

    //Non-airdrop levels
    for(const key in this.levels) {
        if(key.includes('airDrop')) continue;
        for(var x = 0; x < this.levels[key]; x++) {

            var level = levelSpecifier.create(key, specs.worldSpecs);
            var mapNode = new MapLevelNode({levelDetails: level, mapRef: this});

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
            mapNode.setPosition(position);
            this.graph.push(mapNode);
        }
    }

    //Add air drop stations
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
        var mapNode = new MapLevelNode({levelDetails: level, mapRef: this,
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
                    if(node.isBattleNode && !node.chosenAsPrereq && mathArrayUtils.distanceBetweenPoints(position, node.position) < prereqDistanceLimit) {
                        node.chosenAsPrereq = true;
                        node.master = this;
                        this.prereqs.push(node);
                    }
                    count++;
                } while(this.prereqs.length < level.prereqCount)
            },
            hoverCallback: function() {
                this.prereqs.forEach((node) => {
                    node.focusCircle = graphicsUtils.addSomethingToRenderer('MapNodeFocusCircle', {where: 'hudNTwo', position: node.position, scale: {x: 1.4, y: 1.4}});
                    graphicsUtils.rotateSprite(node.focusCircle, {speed: 20});
                    if(!node.isSpinning) {
                        node.displayObject.scale = {x: 1.25, y: 1.25};
                    }
                })
                return true;
            },
            unhoverCallback: function() {
                this.prereqs.forEach((node) => {
                    graphicsUtils.removeSomethingFromRenderer(node.focusCircle);
                    node.displayObject.scale = {x: 1.0, y: 1.0};
                })
                return true;
            },
            travelPredicate: function() {
                var allowed = false;
                return this.prereqs.every((pr) => {
                    return pr.isCompleted;
                })
            },
            manualTokens: function() {
                var regularToken = graphicsUtils.createDisplayObject(regularTokenName, {where: 'hudNTwo'});
                var specialToken = graphicsUtils.createDisplayObject(specialTokenName, {where: 'hudNTwo'});
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
                regularToken.visible = true;
                specialToken.visible = false;
                regularToken.alpha = .5;
                regularToken.tint = 0x002404;
                this.gleamTimer.invalidate();
            }
        });

        mapNode.setPosition(position);
        this.graph.push(mapNode);
    }

    this.show = function() {
        this.fatigueText.text = 'Fatigue: ' + '0%';
        this.fatigueText.alpha = .3;
        // openmapSound.play();
        openmapSound2.play();
        openmapSound3.play();
        graphicsUtils.addOrShowDisplayObject(this.mapSprite);
        this.graph.forEach(node => {
            if(node.isCompleted) {
                node.deactivateToken();
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
            node.displayObject.tooltipObj.hide();
            if(node.manualTokens) {
                node.manualTokens.forEach((token) => {
                    token.visible = this.mapSprite.visible;
                })
            }
            if(node.focusCircle) {
                graphicsUtils.removeSomethingFromRenderer(node.focusCircle);
                if(!node.manualTokens) {
                    node.displayObject.scale = {x: 1.0, y: 1.0};
                } else {
                    node.manualTokens.forEach((token) => {
                        token.scale = {x: 1.0, y: 1.0};
                    })
                }
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
        this.currentNode = node;
        var position = mathArrayUtils.clonePosition(node.position, {y: 20});
        Matter.Events.trigger(globals.currentGame, "TravelStarted", {node: node});
        gameUtils.sendBodyToDestinationAtSpeed(this.headTokenBody, position, 2.5, null, null, function() {
            Matter.Body.setVelocity(this.headTokenBody, {
                x: 0.0,
                y: 0.0
            });
            this.travelInProgress = false;
            if(node.levelDetails.type != 'camp') {
                this.nodeCount++;
            }
            destinationCallback();
        }.bind(this));
    }

    this.revertHeadToPreviousLocationDueToDefeat = function() {
        Matter.Body.setPosition(this.headTokenBody, mathArrayUtils.clonePosition(this.lastNode.position, {y: 20}));
        this.currentNode = this.lastNode;
        this.nodeCount--;
    }
}
export default map;
