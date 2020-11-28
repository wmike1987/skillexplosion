import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {
    // defenseAdditions: {addHandler: 'addDefenseAddition', removeHandler: 'removeDefenseAddition', value: 1},
    // gritAdditions: {addHandler: 'addGritAddition',  removeHandler: 'removeGritAddition', value: 8},
    // dodgeAdditions: {addHandler: 'addDodgeAddition', removeHandler: 'removeDodgeAddition', value: 50},
    dodge: 3,
    grit: 8,
    maxHealth: 5
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Medal Of Grit",
        description: ["Add +1 to defense.", "Add +5 to maximum health.", "Add 8% to grit."],
        icon: 'MedalOfGrit'
    })
};
