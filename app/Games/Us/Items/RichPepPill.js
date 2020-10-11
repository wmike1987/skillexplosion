import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    maxEnergy: 10,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Rich Pep Pill",
        description: "Add +" + manipulations.maxEnergy + " to maximum energy.",
        icon: 'RichPepPill'
    })
};
