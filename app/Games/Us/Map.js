import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import utils from '@utils/GameUtils.js'
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
var mapLevelNode = function(levelDetails) {
    this.levelDetails = levelDetails;
    this.displayObject = utils.createDisplayObject(typeTokenMappings[levelDetails.type], {scale: {x: 1, y: 1}});
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
        if(!this.isCompleted)
            this.displayObject.tint = 0x20cd2c;
    }.bind(this))
    this.displayObject.on('mouseout', function(event) {
        if(!this.isCompleted)
            this.displayObject.tint = 0xFFFFFF;
    }.bind(this))
    this.displayObject.on('mousedown', function(event) {
        if(!self.isCompleted) {
            globals.currentGame.initLevel(self);
        }
    })

    this.setPosition = function(position) {
        this.displayObject.position = position;
        this.position = position;
    }
}

//Map object
var map = function(specs) {

    this.mapSprite = utils.createDisplayObject('MapBackground', {where: 'foreground', position: utils.getPlayableCenter()});
    utils.graduallyTint(this.mapSprite, 0x878787, 0x5565fc, 5000, null, 1800);

    this.levelSpecification = specs.levelSpecification;

    this.graph = [];
    for(const key in this.levelSpecification) {

        for(var x = 0; x < this.levelSpecification[key]; x++) {

            var level = LevelSpecifier.create(key);
            var mapNode = new mapLevelNode(level);

            //Determine position
            var position;
            var collision;
            var nodeBuffer = 100;
            do {
                collision = false;
                position = utils.getRandomPlacementWithinPlayableBounds(50);
                for(let node of this.graph) {
                    if(utils.distanceBetweenPoints(node.position, position) < nodeBuffer) {
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
        utils.addOrShowDisplayObject(this.mapSprite);
        this.graph.forEach(node => {
            node.displayObject.where = 'hudNTwo'
            if(node.isCompleted) {
                node.displayObject.tint = 0x002404;
            }
            utils.addOrShowDisplayObject(node.displayObject)
        })
    }

    this.hide = function() {
        this.mapSprite.visible = false;
        this.graph.forEach(node => {
            node.displayObject.visible = this.mapSprite.visible;
            node.displayObject.tooltipObj.hide();
        })
    }
}
export default map;
