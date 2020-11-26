import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    defenseAdditions: {addHandler: 'addDefenseAddition',
                       removeHandler: 'removeDefenseAddition',
                       value: 1},
    maxHealth: 5
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Medal Of Grit",
        description: ["Add +1 to defense.", "Add +5 to maximum health."],
        icon: 'MedalOfGrit'
    })
};
