define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var equip = function(unit) {
        unit.defense += 1;
    };

    var unequip = function(unit) {
        unit.defense -= 1;
    };

    return function() {
        return ic({
            equip: equip,
            unequip: unequip,
            name: "Medal Of Grit",
            description: "Add +1 to defense.",
            icon: 'MedalOfGrit'
        })
    };
})
