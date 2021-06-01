import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    energyRegenerationRate: 0.5,
    maxEnergy: 3,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Owl Medallion",
        description: ["Add +3 to max energy", "Regenerate +0.5 energy per second."],
        icon: 'BronzeMedalCircle4'
    }, options);
    return new ic(item);
}
