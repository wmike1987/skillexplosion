define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        maxEnergy: 8,
        energyRegenerationRate: 1,
        events: {knifeKill: {currentEnergy: 5}}
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Serene Star",
            description: ["Add +8 to maximum energy.", "Regenerate +1 energy per second.", "Gain 5 energy after knife kill."],
            icon: 'SereneStar'
        })
    };
})
