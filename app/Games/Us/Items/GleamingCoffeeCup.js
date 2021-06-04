import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    energyRegenerationRate: 1,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Gleaming Coffee Cup",
        description: "Regenerate +1 energy per second.",
        icon: 'GleamingCoffeeCup'
    }, options);
    return new ic(item);
}
