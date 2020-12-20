import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    maxHealth: 10,
}

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Jewel Of Life",
        description: "Add +10 to maximum health.",
        icon: 'JewelOfLife'
    }, options);
    return new ic(item);
};
