import ic from '@core/Unit/ItemConstructor.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var healAmount = 1.0;

var manipulations = {
    healAddition: healAmount
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Steady Syringe",
        description: "Increase heal amount by " + healAmount + ".",
        icon: 'SteadySyringe',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
