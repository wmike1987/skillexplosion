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
var clickTokenSound = gameUtils.getSound('clickbattletoken1.wav', {volume: .05, rate: 1});
var clickTokenSound2 = gameUtils.getSound('clickbattletoken2.wav', {volume: .04, rate: .9});

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
    if(this.levelDetails.enemySets.length > 0) {
        this.isBattleNode = true;
    }
    this.levelDetails.enemySets.forEach(set => {
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
            var canTravel = true;
            if(options.travelPredicate) {
                canTravel = this.travelPredicate();
            }

            if(canTravel) {
                var doDefault = true;
                if(options.mouseDownCallback) {
                    doDefault = options.mouseDownCallback.call(self);
                }
                if(doDefault) {
                    graphicsUtils.graduallyTint(this.displayObject, 0xFFFFFF, 0xc72efb, 65, null, false, 3);
                    clickTokenSound2.play();
                    this.displayObject.tooltipObj.disable();
                    this.displayObject.tooltipObj.hide();
                }

                this.mapRef.travelToNode(this, function() {
                    Matter.Events.trigger(globals.currentGame, "TravelFinished", {node: this});
                    this.levelDetails.enterLevel(self);
                    this.displayObject.tint = 0xFFFFFF;
                    this.displayObject.tooltipObj.enable();
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
    this.justCompleted = true;
    this.displayObject.tooltipObj.destroy();
}

MapLevelNode.prototype.playCompleteAnimation = function() {
    var node = this;
    node.isSpinning = true;
    graphicsUtils.spinSprite(this.displayObject, 1, 800, 0, ()=> {
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
