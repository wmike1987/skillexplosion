import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    maxHealth: 15,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Rugged Canteen",
        description: "Add +" + manipulations.maxHealth + " to maximum health.",
        icon: 'RuggedCanteen'
    }, options);
    return new ic(item);
}
