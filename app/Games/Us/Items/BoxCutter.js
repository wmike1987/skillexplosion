import ic from '@core/Unit/ItemConstructor.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/GameUtils.js';

var knifeImpactSound = gameUtils.getSound('knifeimpact.wav', {
    volume: 0.08,
    rate: 1.6
});
var damage = 10;

var manipulations = {
    events: {
        petrify: {
            callback: function(event) {
                let petrifiedUnit = event.petrifiedUnit;

                gameUtils.doSomethingAfterDuration(() => {
                    if (!petrifiedUnit.isDead && petrifiedUnit.team != event.equippedUnit.team) {
                        petrifiedUnit.sufferAttack(damage, event.equippedUnit);
                        var bloodPierceAnimation = gameUtils.getAnimation({
                            spritesheetName: 'UtilityAnimations1',
                            animationName: 'pierce',
                            speed: 0.95,
                            transform: [petrifiedUnit.position.x, petrifiedUnit.position.y, 0.45, 0.45]
                        });
                        knifeImpactSound.play();
                        bloodPierceAnimation.play();
                        graphicsUtils.addSomethingToRenderer(bloodPierceAnimation, 'foreground');
                    }
                }, 50);
            }},
        condemn: {
            callback: function(event) {
                let condemnedUnit = event.condemnedUnit;

                gameUtils.doSomethingAfterDuration(() => {
                    if (!condemnedUnit.isDead && condemnedUnit.team != event.equippedUnit.team) {
                        condemnedUnit.sufferAttack(damage, event.equippedUnit);
                        var bloodPierceAnimation = gameUtils.getAnimation({
                            spritesheetName: 'UtilityAnimations1',
                            animationName: 'pierce',
                            speed: 0.95,
                            transform: [condemnedUnit.position.x, condemnedUnit.position.y, 0.45, 0.45]
                        });
                        knifeImpactSound.play();
                        bloodPierceAnimation.play();
                        graphicsUtils.addSomethingToRenderer(bloodPierceAnimation, 'foreground');
                    }
                }, 50);
            }
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Box Cutter",
        description: "Deal " + damage + " damage upon petrifying or condemning an enemy unit.",
        icon: 'BoxCutter',
        type: 'Medic'
    }, options);
    return new ic(item);
}
