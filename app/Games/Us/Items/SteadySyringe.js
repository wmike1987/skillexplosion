import ic from '@core/Unit/ItemConstructor.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var healAmount = 0.5;

var manipulations = {
    healAddition: healAmount,
    range: 25
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Steady Syringe",
        description: ["Increase heal amount by " + healAmount + ".", "Increase healing range by 25."],
        icon: 'SteadySyringe',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
