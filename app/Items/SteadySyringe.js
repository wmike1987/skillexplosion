define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        healAmount: .5,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Steady Syringe",
            description: "Increase heal amount by 0.5.",
            icon: 'SteadySyringe',
            unitType: 'Medic'
        })
    };
})
