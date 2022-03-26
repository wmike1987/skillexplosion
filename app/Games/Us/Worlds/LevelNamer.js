import {
    mathArrayUtils
} from '@utils/MathArrayUtils.js';

var locationNames = ['Camp', 'Presence', 'Hut', 'Nest', 'Den', 'Burrow', 'Dwelling', 'Roost', 'Base', 'Garrison', 'Depot', 'Lodge', 'Haunt', 'Lair', 'Group', 'Troop'];
var basic = ['Mini', 'Small', 'Casual', 'Routine', 'Ragtag', 'Minor', 'Slight', 'Limited', 'Meager', 'Flimsy', 'Weak'];
var hard = ['Major', 'Large', 'Daunting', 'Heavy', 'Robust', 'Strong', 'Mighty', 'Sturdy', 'Looming', 'Fierce', 'Trained'];
var multi = ['Mega', 'Relentless', 'Ruthless', 'Harsh', 'Rigorous', 'Steady', 'Profuse', 'Vigorous', 'Headstrong'];

var adjectives = {basic: basic, hard: hard, multi: multi};

var locationVariations = [];

var levelNamer = {
    getName: function(options) {
        let noun = options.noun;
        let type = options.type;

        let adjective = mathArrayUtils.getRandomElementOfArray(adjectives[type]);
        let location = mathArrayUtils.getRandomElementOfArray(locationNames);
        return (adjective + ' ' + noun + ' ' + location);
    }
};

export default levelNamer;
