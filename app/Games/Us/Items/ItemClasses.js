import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {globals} from '@core/Fundamental/GlobalState';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

var ItemClasses = {
    worn: {
        item: {tint: 0x949494, items: ['JewelOfLife', 'MaskOfRage', 'PepPill', 'SturdyCanteen', 'RingOfRenewal', 'RingOfThought']},
        microchip: {tint: 0xf59a87, items: ['BasicMicrochip']},
        specialtyItem: {tint: 0x7ffcea, items: ['SteadySyringe']},
    },

    rugged: {
        item: {tint: 0xffffff, items: ['BootsOfHaste', 'RuggedCanteen', 'RichPepPill', 'MedalOfGrit', 'MedalOfMerit']},
        microchip: {tint: 0xa77e16, items: ['JaggedMicrochip', 'GreenMicrochip', 'ApolloMicrochip']},
        specialtyItem: {tint: 0x1e9489, items: ['SereneStar']},
    },

    gleaming: {
        item: {tint: 0xfce558, items: ['GleamingCanteen']},
        microchip: {tint: 0xa73cc2, items: []},
        specialtyItem: {tint: 0x810587, items: []},
    },

    alien: {
        item: {tint: 0xc0eb7a, items: []},
        microchip: {tint: 0x58bb3f, items: []},
        specialtyItem: {tint: 0x0f7e09, items: []},
    },

    stimulant: {
        item: {tint: 0x2a2a2a, items: ['SlipperySoup', 'StoutShot', 'Painkiller', 'LifeExtract', 'CoarseBrine', 'ChemicalConcentrate', 'AwarenessTonic']},
    },

    book: {
        item: {tint: 0x1169de, items: ['Book'], gleamAnimation: 'BookGleam'}
    },

    noClass: {
        item: {tint: 0xffffff, items: []}
    },
};

export {ItemClasses};