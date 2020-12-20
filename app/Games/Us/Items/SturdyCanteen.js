import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    maxHealth: 6,
}

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Sturdy Canteen",
        description: "Add +" + manipulations.maxHealth + " to maximum health.",
        icon: 'SturdyCanteen'
    }, options);
    return new ic(item);
};
