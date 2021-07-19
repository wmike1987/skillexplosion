import ic from '@core/Unit/ItemConstructor.js';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/GameUtils.js';

var knifeImpactSound = gameUtils.getSound('knifeimpact.wav', {volume: 0.08, rate: 1.6});
var damage = 10;

var manipulations = {
    events: {secretStepCollision: {callback: function(event) {
            if(!event.otherUnit) return;

            if(event.otherUnit.team != event.equippedUnit.team) {
                event.otherUnit.sufferAttack(damage, event.equippedUnit);
                var bloodPierceAnimation = gameUtils.getAnimation({
                    spritesheetName: 'UtilityAnimations1',
                    animationName: 'pierce',
                    speed: 0.95,
                    transform: [event.otherUnit.position.x, event.otherUnit.position.y, 0.25, 0.25]
                });
                knifeImpactSound.play();
                bloodPierceAnimation.play();
                graphicsUtils.addSomethingToRenderer(bloodPierceAnimation, 'foreground');
            }
        }
    }}
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Box Cutter",
        description: "Deal " + damage + " damage upon secret stepping through an enemy unit.",
        icon: 'BoxCutter',
        type: 'Medic'
    }, options);
    return new ic(item);
}
