define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var equip = function(unit) {
        unit.healthRegenerationRate += 1;
    };

    var unequip = function(unit) {
        unit.healthRegenerationRate -= 1;
    };

    return function() {
        return ic({
            equip: equip,
            unequip: unequip,
            name: "Ring Of Renewal",
            description: "Regenerate +1 hp per second.",
            icon: 'RingOfWellBeing'
        })
    };
})
