import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Tooltip from '@core/Tooltip.js'
import {levelSpecifier} from '@games/Us/MapAndLevel/LevelSpecifier.js'
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

//Define node object
var MapLevelNode = function(options) {
    this.mapRef = options.mapRef;
    this.levelDetails = options.levelDetails;
    this.displayObject = graphicsUtils.createDisplayObject(typeTokenMappings[this.levelDetails.type], {scale: {x: 1, y: 1}});
    this.displayObject.interactive = true;

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

    if(options.init) {
        options.init.call(this);
    }

    this.enterNode = this.levelDetails.enterNode;
    this.displayObject.on('mouseover', function(event) {
        if(!this.isCompleted && !this.mapRef.travelInProgress) {
            if(options.hoverCallback) {
                options.hoverCallback.call(self);
            }
            this.displayObject.tint = 0x20cd2c;
        }
    }.bind(this))
    this.displayObject.on('mouseout', function(event) {
        if(!this.isCompleted && !this.mapRef.travelInProgress) {
            if(options.unhoverCallback) {
                options.unhoverCallback.call(self);
            }
            this.displayObject.tint = 0xFFFFFF;
        }
    }.bind(this))
    this.displayObject.on('mousedown', function(event) {
        if(!self.isCompleted && !this.mapRef.travelInProgress) {
            this.displayObject.tint = 0xff0000;
            var canTravel = true;
            if(options.travelCallback) {
                canTravel = options.travelCallback.call(self);
            }
            if(canTravel) {
                this.mapRef.travelToNode(this, function() {
                    Matter.Events.trigger(globals.currentGame, "TravelFinished", {node: this});
                    this.enterNode(self);
                    this.displayObject.tint = 0xFFFFFF;
                }.bind(this));
            }
        }
    }.bind(this))

    this.setPosition = function(position) {
        this.displayObject.position = position;
        this.position = position;
    }
}

//Map object
var openmapSound = gameUtils.getSound('openmap.wav', {volume: .15, rate: 1.0});
var openmapSound2 = gameUtils.getSound('openmap2.wav', {volume: .03, rate: 1.0});
var map = function(specs) {

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
    this.fatigueText = graphicsUtils.createDisplayObject("TEX+:" + 'Fatigue: 0%', {position: {x: 100, y: 100}, style: styles.fatigueText, where: "hudNOne"});
    Matter.Events.on(this, "SetFatigue", function(event) {
        this.fatigueText.alpha = .9;
        var amount = event.amount;
        this.fatigueText.text = 'Fatigue: ' + event.amount + '%';
    }.bind(this))
    global.currentGame.addBody(this.headTokenBody);
    gameUtils.attachSomethingToBody({something: this.fatigueText, body: this.headTokenBody, offset: {x: 0, y: 20}});
    Matter.Body.setPosition(this.headTokenBody, gameUtils.getCanvasCenter());
    this.headTokenSprite = this.headTokenBody.renderlings.headtoken;
    this.fatigueBarSprite = this.headTokenBody.renderlings.fatigueBar;
    this.fatigueFillSprite = this.headTokenBody.renderlings.fatigueFill;
    this.headTokenSprite.visible = false;
    this.mapSprite = graphicsUtils.createDisplayObject('MapBackground', {where: 'foreground', position: gameUtils.getPlayableCenter()});
    graphicsUtils.graduallyTint(this.mapSprite, 0x878787, 0x5565fc, 5000, null, 1800);

    this.levels = specs.levels;
    this.travelInProgress = false;

    this.graph = [];

    var mainCamp = levelSpecifier.create('camp', specs.worldSpecs);
    var initialCampNode = new MapLevelNode({levelDetails: mainCamp, mapRef: this});
    initialCampNode.setPosition(gameUtils.getPlayableCenter());
    this.graph.push(initialCampNode);

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

    var airDrops = this.levels.airDropStations + this.levels.airDropSpecialStations;
    for(var x = 0; x < airDrops; x++) {
        var key = 'airDropStations';
        if(x >= this.levels.airDropStations) {
            key = 'airDropSpecialStations';
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

                //choose two battle nodes to be the prereqs
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
                        this.prereqs.push(node);
                    }
                    count++;
                } while(this.prereqs.length < level.prereqCount)
            },
            hoverCallback: function() {
                this.prereqs.forEach((node) => {
                    node.focusCircle = graphicsUtils.addSomethingToRenderer('MapNodeFocusCircle', {where: 'hudNTwo', position: node.position, scale: {x: 1.4, y: 1.4}});
                    graphicsUtils.rotateSprite(node.focusCircle, {speed: 20});
                    node.displayObject.scale = {x: 1.25, y: 1.25};
                })
            },
            unhoverCallback: function() {
                this.prereqs.forEach((node) => {
                    graphicsUtils.removeSomethingFromRenderer(node.focusCircle);
                    node.displayObject.scale = {x: 1.0, y: 1.0};
                })
            },
            travelCallback: function() {
                return true;
            }
        });

        mapNode.setPosition(position);
        this.graph.push(mapNode);
    }

    this.show = function() {
        this.fatigueText.text = 'Fatigue: ' + '0%';
        this.fatigueText.alpha = .3;
        openmapSound.play();
        openmapSound2.play();
        graphicsUtils.addOrShowDisplayObject(this.mapSprite);
        this.graph.forEach(node => {
            node.displayObject.where = 'hudNTwo'
            if(node.isCompleted) {
                node.displayObject.tint = 0x002404;
            }
            graphicsUtils.addOrShowDisplayObject(node.displayObject)
        })

        graphicsUtils.addOrShowDisplayObject(this.headTokenSprite);
        graphicsUtils.addOrShowDisplayObject(this.fatigueText);
    }

    this.hide = function() {
        this.mapSprite.visible = false;
        this.graph.forEach(node => {
            node.displayObject.visible = this.mapSprite.visible;
            node.displayObject.tooltipObj.hide();
            if(node.prereqs) {
                node.prereqs.forEach((pr) => {
                    if(pr.focusCircle) {
                        graphicsUtils.removeSomethingFromRenderer(pr.focusCircle);
                        pr.displayObject.scale = {x: 1.0, y: 1.0};
                    }
                })
            }
        })

        this.headTokenSprite.visible = false;
        this.fatigueText.visible = false;
    }

    this.travelToNode = function(node, destinationCallback) {
        this.travelInProgress = true;
        var position = mathArrayUtils.clonePosition(node.position, {y: 20});
        Matter.Events.trigger(globals.currentGame, "TravelStarted", {node: node});
        gameUtils.sendBodyToDestinationAtSpeed(this.headTokenBody, position, 2.5, null, null, function() {
            Matter.Body.setVelocity(this.headTokenBody, {
                x: 0.0,
                y: 0.0
            });
            this.travelInProgress = false;
            destinationCallback();
        }.bind(this));
    }
}
export default map;
