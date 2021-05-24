import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    healAddition: 0.5
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Steady Syringe",
        description: "Increase heal amount by 0.5.",
        icon: 'SteadySyringe',
        type: 'Medic'
    }, options);
    return new ic(item);
}
