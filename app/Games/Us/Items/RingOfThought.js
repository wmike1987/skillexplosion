define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        energyRegenerationRate: .5,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Ring Of Thought",
            description: "Regenerate +0.5 energy per second.",
            icon: 'RingOfReason'
        })
    };
})
