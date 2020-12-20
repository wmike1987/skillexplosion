import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    maxEnergy: 10,
}

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Rich Pep Pill",
        description: "Add +" + manipulations.maxEnergy + " to maximum energy.",
        icon: 'RichPepPill'
    }, options);
    return new ic(item);
};
