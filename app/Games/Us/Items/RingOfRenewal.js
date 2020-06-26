define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        healthRegenerationRate: 1,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Ring Of Renewal",
            description: "Regenerate +1 hp per second.",
            icon: 'RingOfWellBeing'
        })
    };
})
