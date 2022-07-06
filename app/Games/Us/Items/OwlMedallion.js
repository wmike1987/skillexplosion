import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    energyRegenerationRate: 0.25,
    maxEnergy: 2,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Owl Medallion",
        description: ["Add 2 to max energy", "Regenerate +0.25 energy per second."],
        icon: 'BronzeMedalCircle4'
    }, options);
    return new ic(item);
}
