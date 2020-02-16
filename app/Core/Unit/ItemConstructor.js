define(['jquery', 'utils/GameUtils', 'core/Tooltip', 'matter-js',], function($, utils, Tooltip, Matter) {

    return function(options) {
        var newItem = $.extend({}, options);
        newItem.isItem = true;
        newItem.icon = utils.createDisplayObject(options.icon);
        Tooltip.makeTooltippable(newItem.icon, {title: newItem.name, description: newItem.description});
        newItem.body = Matter.Bodies.circle(0, 0, 10, {
            isStatic: true
        });
        newItem.body.renderChildren = [{
            id: newItem.body.id + 'itemFootprint',
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

        return newItem;
    }
})
