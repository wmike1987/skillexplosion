import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    damageAddition: .5
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Steady Syringe",
        description: "Increase heal amount by 0.5.",
        icon: 'SteadySyringe',
        type: 'Medic'
    })
};
