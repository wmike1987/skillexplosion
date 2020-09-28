import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import utils from '@utils/GameUtils.js'
import LevelSpecifier from '@games/Us/LevelSpecifier.js'

var map = function(specs) {

    this.mapSprite = utils.createDisplayObject('MapBackground', {where: 'foreground', position: utils.getPlayableCenter()});
    utils.graduallyTint(this.mapSprite, 0x878787, 0x5565fc, 5000, null, 1800);

    //this will be given in the specs parameter, for now we'll just include it here
    this.levelSpecification = {
        singles: 26,
        doubles: 1,
        boss: 1,
        norevives: 1,
        mobs: 1
    }

    this.graph = [];
    for(const key in this.levelSpecification) {

        for(var x = 0; x < this.levelSpecification[key]; x++) {

            var levelNode = LevelSpecifier.create(key);

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
            levelNode.setPosition(position);
            this.graph.push(levelNode);
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
