import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    energyRegenerationRate: 0.35,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Coffee Cup",
        description: "Regenerate +0.35 energy per second.",
        icon: 'CoffeeCup'
    }, options);
    return new ic(item);
}
