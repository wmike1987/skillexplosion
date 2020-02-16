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
        Tooltip.makeTooltippable(newItem.icon, {title: newItem.name, description: newItem.description});
        newItem.body = Matter.Bodies.circle(0, 0, 10, {
            isStatic: true
        });

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
                x: .3,
                y: .3
            },
            rotate: 'none',
            visible: true,
        },
        {
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: {x: .4, y: .4},
            visible: true,
            rotate: 'none',
            stage: "StageNTwo",
            offset: {x: 0, y: 10}
        }];

        newItem.body.item = newItem;

        return newItem;
    }
})
