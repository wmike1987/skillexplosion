define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        energyRegenerationRate: 1,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Ring Of Thought",
            description: "Regenerate +1 energy per second.",
            icon: 'RingOfReason'
        })
    };
})
