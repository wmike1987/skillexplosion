import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    maxHealth: 25,
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Gleaming Canteen",
        description: "Add +" + manipulations.maxHealth + " to maximum health.",
        icon: 'GleamingCanteen'
    }, options);
    return new ic(item);
}
