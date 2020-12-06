import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Tooltip from '@core/Tooltip.js'
import LevelSpecifier from '@games/Us/LevelSpecifier.js'
import {globals} from '@core/Fundamental/GlobalState.js'

//Token Mappings
var typeTokenMappings = {
    singles: 'MapGoldBattleToken',
    doubles: 'MapRedBattleToken',
    boss: 'MapRedBattleToken',
    norevives: 'MapRedBattleToken',
    mobs: 'MobBattleToken',
}

//Define node object
var MapLevelNode = function(levelDetails, mapRef) {
    this.mapRef = mapRef;
    this.levelDetails = levelDetails;
    this.displayObject = graphicsUtils.createDisplayObject(typeTokenMappings[levelDetails.type], {scale: {x: 1, y: 1}});
    this.displayObject.interactive = true;

    var enemyDescriptions = [];
    var enemyIcons = [];
    levelDetails.enemySets.forEach(set => {
        enemyDescriptions.push(' x ' + set.spawn.total);
        enemyIcons.push(set.icon);
    })
    Tooltip.makeTooltippable(this.displayObject, {
        title: levelDetails.type,
        description: enemyDescriptions,
        descriptionIcons: enemyIcons});

    var self = this;

    this.displayObject.on('mouseover', function(event) {
        if(!this.isCompleted && !this.mapRef.travelInProgress)
            this.displayObject.tint = 0x20cd2c;
    }.bind(this))
    this.displayObject.on('mouseout', function(event) {
        if(!this.isCompleted && !this.mapRef.travelInProgress)
            this.displayObject.tint = 0xFFFFFF;
    }.bind(this))
    this.displayObject.on('mousedown', function(event) {
        if(!self.isCompleted && !this.mapRef.travelInProgress) {
            this.mapRef.travelToNode(this, function() {
                globals.currentGame.initLevel(self);
            });
        }
    }.bind(this))

    this.setPosition = function(position) {
        this.displayObject.position = position;
        this.position = position;
    }
}

//Map object
var map = function(specs) {

    this.headTokenBody = Matter.Bodies.circle(0, 0, 4, {
        isSensor: true,
        frictionAir: 0.0,
    });
    this.headTokenBody.renderChildren = [{
        id: 'headtoken',
        data: "HeadToken",
        stage: 'hudNOne'
    }]
    global.currentGame.addBody(this.headTokenBody);
    Matter.Body.setPosition(this.headTokenBody, gameUtils.getCanvasCenter());
    this.headTokenSprite = this.headTokenBody.renderlings.headtoken;
    this.headTokenSprite.visible = false;
    this.mapSprite = graphicsUtils.createDisplayObject('MapBackground', {where: 'foreground', position: gameUtils.getPlayableCenter()});
    graphicsUtils.graduallyTint(this.mapSprite, 0x878787, 0x5565fc, 5000, null, 1800);

    this.levels = specs.levels;
    this.travelInProgress = false;

    this.graph = [];
    for(const key in this.levels) {

        for(var x = 0; x < this.levels[key]; x++) {

            var level = LevelSpecifier.create(key, specs.levelOptions);
            var mapNode = new MapLevelNode(level, this);

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

    this.show = function() {
        graphicsUtils.addOrShowDisplayObject(this.mapSprite);
        this.graph.forEach(node => {
            node.displayObject.where = 'hudNTwo'
            if(node.isCompleted) {
                node.displayObject.tint = 0x002404;
            }
            graphicsUtils.addOrShowDisplayObject(node.displayObject)
        })

        graphicsUtils.addOrShowDisplayObject(this.headTokenSprite);
    }

    this.hide = function() {
        this.mapSprite.visible = false;
        this.graph.forEach(node => {
            node.displayObject.visible = this.mapSprite.visible;
            node.displayObject.tooltipObj.hide();
        })

        this.headTokenSprite.visible = false;
    }

    this.travelToNode = function(node, destinationCallback) {
        this.travelInProgress = true;
        var position = mathArrayUtils.clonePosition(node.position, {y: 20});
        gameUtils.sendBodyToDestinationAtSpeed(this.headTokenBody, position, 2, null, null, function() {
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
