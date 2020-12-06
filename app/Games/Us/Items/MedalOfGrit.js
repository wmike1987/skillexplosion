import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    defenseAddition: {value: 1},
    gritAddition: {value: 8},
    dodgeAddition: {value: 50},
    damageAddition: {value: 20},
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Medal Of Grit",
        description: ["Add +1 to armor.", "Add +5 to maximum health.", "Add 8% to grit."],
        icon: 'MedalOfGrit'
    })
};
