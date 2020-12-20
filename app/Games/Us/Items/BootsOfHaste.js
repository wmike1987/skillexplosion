import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    moveSpeed: .2,
}

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Boots Of Haste",
        description: "Increase movement speed.",
        icon: 'BootsOfHaste'
    }, options);
    return new ic(item);
};
