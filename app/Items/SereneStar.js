define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor', 'matter-js'], function($, utils, ic, Matter) {

    var manipulations = {
        maxEnergy: 8,
        energyRegenerationRate: 1,
        events: {knifeKill: {currentEnergy: 5, callback: function(unit) {
            var manaStealAnimation = utils.getAnimationB({
                spritesheetName: 'animations2',
                animationName: 'manasteal',
                speed: .8,
                transform: [unit.position.x, unit.position.y, 1.5, 1.8]
            });
            manaStealAnimation.play();
            manaStealAnimation.alpha = 1;
            utils.attachSomethingToBody(manaStealAnimation, unit.body, {x: 2, y: 25});
            utils.addSomethingToRenderer(manaStealAnimation, 'foreground');
            Matter.Events.on(manaStealAnimation, "destroy", function() {
                utils.detachSomethingFromBody(manaStealAnimation);
            })
        }}}
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Serene Star",
            description: ["Add +8 to maximum energy.", "Regenerate +1 energy per second.", "Gain 5 energy after knife kill."],
            icon: 'SereneStar'
        })
    };
})
