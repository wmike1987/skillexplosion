define(['jquery', 'utils/GameUtils', 'core/Tooltip', 'matter-js',], function($, utils, Tooltip, Matter) {

    var baseItem = {
        equip: function() {
            //override me
        },
        unequip: function() {
            //override me
        },
        name: 'generic item name',
        description: 'generic item description',
        icon: 'required'
    }

    return function(options) {
        var newItem = $.extend({}, baseItem, options);
        newItem.isItem = true;
        newItem.icon = utils.createDisplayObject(options.icon);
        var ctrlClickToDropMessage = '(Ctrl + Click to drop item)';

        newItem.icon.interactive = true;
        newItem.icon.on('mousedown', function(event) {
            if(keyStates['Control']) {
                newItem.owningUnit.dropItem(newItem);
            }
        }.bind(this))

        Tooltip.makeTooltippable(newItem.icon, {title: newItem.name, description: newItem.description, systemMessage: ctrlClickToDropMessage});
        newItem.body = Matter.Bodies.circle(0, 0, 30, {
            isSensor: true
        });

        //create name display (shown upon alt or hover)
        var baseTint = 0x00042D;
        newItem.nameDisplayBase = utils.createDisplayObject('TintableSquare', {tint: baseTint, scale: {x: 1, y: 1}, alpha: .85});
        newItem.nameDisplay = utils.createDisplayObject('TEXT:' + newItem.name)
        utils.makeSpriteSize(newItem.nameDisplayBase, {w: newItem.nameDisplay.width + 15, h: 55});

        newItem.showName = function(bool) {
            if(!newItem.nameDisplay.parent) {
                utils.addDisplayObjectToRenderer(newItem.nameDisplay, 'hudText');
                utils.addDisplayObjectToRenderer(newItem.nameDisplayBase, 'hud')
            }

            newItem.nameDisplayBase.visible = bool;
            newItem.nameDisplay.visible = bool;

            if(bool) {
                newItem.nameDisplayBase.position = {x: newItem.body.position.x, y: newItem.body.position.y - 40};
                newItem.nameDisplay.position = {x: newItem.body.position.x, y: newItem.body.position.y - 40};
            }
        }

        utils.deathPact(newItem, newItem.nameDisplayBase);
        utils.deathPact(newItem, newItem.nameDisplay);

        //Make renderlings accessible from wherever
        Object.defineProperty(newItem.body, 'renderlings', {
            get: function() {
                return newItem.renderlings;
            },
            set: function(v) {
                newItem.renderlings = v;
            }
        });
        Object.defineProperty(newItem.body, 'renderChildren', {
            get: function() {
                return newItem.renderChildren;
            }
        });

        newItem.renderChildren = [{
            id: 'itemFootprint',
            data: 'GlassMarble',
            scale: {
                x: .4,
                y: .4
            },
            rotate: 'none',
            visible: true,
        },
        {
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: {x: .6, y: .6},
            visible: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: {x: 0, y: 10}
        }];

        newItem.body.item = newItem;

        return newItem;
    }
})
