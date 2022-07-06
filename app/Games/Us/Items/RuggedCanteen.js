import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    maxHealth: 20,
    healthRegenerationRate: 0.25,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Rugged Canteen",
        description: ["Add " + manipulations.maxHealth + " to maximum health.", "Regenerate +0.25 health per second."],
        icon: 'RuggedCanteen'
    }, options);
    return new ic(item);
}
