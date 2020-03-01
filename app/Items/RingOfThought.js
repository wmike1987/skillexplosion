define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var equip = function(unit) {
        unit.energyRegenerationRate += 1;
    };

    var unequip = function(unit) {
        unit.energyRegenerationRate -= 1;
    };

    return function() {
        return ic({
            equip: equip,
            unequip: unequip,
            name: "Ring Of Thought",
            description: "Regenerate +1 energy per second.",
            icon: 'RingOfReason'
        })
    };
})
