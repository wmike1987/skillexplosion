define(['jquery', 'matter-js', 'pixi', 'utils/GameUtils', 'games/Us/LevelSpecifier'],
function($, Matter, PIXI, utils, LevelSpecifier) {

    var map = function(specs) {

        this.mapSprite = utils.createDisplayObject('MapBase', {where: 'foreground', position: utils.getPlayableCenter()});

        this.levelSpecification = {
            singles: 6,
            triplets: 1,
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
    return map;
})
