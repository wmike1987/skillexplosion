define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        defense: 1,
        maxHealth: 5
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Medal Of Grit",
            description: ["Add +1 to defense.", "Add +5 to maximum health."],
            icon: 'MedalOfGrit'
        })
    };
})
