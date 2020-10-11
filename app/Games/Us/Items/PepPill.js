import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    maxEnergy: 5,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Pep Pill",
        description: "Add +" + manipulations.maxEnergy + " to maximum energy.",
        icon: 'PepPillOne'
    })
};
