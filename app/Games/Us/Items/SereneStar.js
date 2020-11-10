import ic from '@core/Unit/ItemConstructor.js'
import * as Matter from 'matter-js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils'

var manipulations = {
    maxEnergy: 8,
    energyRegenerationRate: 1,
    events: {knifeKill: {currentEnergy: 5, callback: function(unit) {
        var manaStealAnimation = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations1',
            animationName: 'manasteal',
            speed: Math.random() + .5,
            transform: [unit.position.x, unit.position.y, 1.3, 1.3]
        });

        manaStealAnimation.tint = 0xA6E5D8;
        manaStealAnimation.play();
        manaStealAnimation.alpha = 1;
        gameUtils.attachSomethingToBody({something: manaStealAnimation, body: unit.body, offset: {x: Math.random()*40-20, y: 25-(Math.random()*5)}, somethingId: 'manaStealAttach'});
        graphicsUtils.addSomethingToRenderer(manaStealAnimation, 'foreground');
        Matter.Events.on(manaStealAnimation, "destroy", function() {
            gameUtils.detachSomethingFromBody(manaStealAnimation);
        })
    }}}
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Serene Star",
        description: ["Add +8 to maximum energy.", "Regenerate +1 energy per second.", "Gain 5 energy after knife kill."],
        icon: 'SereneStar',
        type: 'Marine'
    })
};
