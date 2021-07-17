import ic from '@core/Unit/ItemConstructor.js';

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
        type: 'Medic'
    }, options);
    return new ic(item);
}
