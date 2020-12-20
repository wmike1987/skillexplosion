import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    maxEnergy: 5,
}

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Pep Pill",
        description: "Add +" + manipulations.maxEnergy + " to maximum energy.",
        icon: 'PepPillOne'
    }, options);
    return new ic(item);
};
