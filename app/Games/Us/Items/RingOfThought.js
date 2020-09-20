import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    energyRegenerationRate: .5,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Ring Of Thought",
        description: "Regenerate +0.5 energy per second.",
        icon: 'RingOfReason'
    })
};
