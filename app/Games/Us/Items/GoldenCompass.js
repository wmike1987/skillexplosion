import ic from '@core/Unit/ItemConstructor.js';

var manipulations = {
    fatigueReduction: 15,
    maxEnergy: 6
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Compass",
        description: ["Reduce fatigue applied by " + manipulations.fatigueReduction + "%.", "Add " + manipulations.maxEnergy + " to maximum energy."],
        icon: 'GoldenCompass'
    }, options);
    return new ic(item);
}
