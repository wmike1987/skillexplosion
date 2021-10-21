import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {
    globals
} from '@core/Fundamental/GlobalState';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';

var ItemClasses = {
    worn: {
        item: {
            description: 'Worn Item',
            tint: 0x949494,
            items: ['MedalOfHeart', 'MedalOfMoxie', 'BearMedallion', 'OwlMedallion', 'LeatherBelt',
                'PictureOfEarth', 'SturdyCanteen', 'PoundCake', 'CoffeeCup', 'SilverLocket', 'PictureOfTheMoon', 'PlatedPants'
            ],
            mapNodeIndicator: 'SturdyCanteen'
        },
        microchip: {
            description: 'Microchip',
            tint: 0xf59a87,
            items: ['BasicMicrochip'],
            gleamAnimation: "MicrochipGleam",
            mapNodeIndicator: 'BasicMicrochip'
        },
        specialtyItem: {
            description: 'Worn Specialty Item',
            tint: 0x7ffcea,
            items: ['LeatherGlove', 'RoseRing', 'SilverYinYang', 'SteadySyringe', 'BlackTipCartridge', 'SereneStar', 'PillBottle', 'SkyMedallion'],
            mapNodeIndicator: 'RoseRing'
        },
    },

    rugged: {
        item: {
            description: 'Rugged Item',
            tint: 0xffffff,
            items: ['LightBoots', 'Compass', 'GoldPlatedPants', 'RuggedCanteen', 'RoseLocket', 'SharpPictureOfEarth', 'SharpPictureOfTheMoon', 'MedalOfGrit', 'MedalOfMerit'],
            mapNodeIndicator: 'RuggedCanteen'
        },
        microchip: {
            description: 'Rugged Microchip',
            tint: 0xa77e16,
            items: ['JaggedMicrochip', 'GreenMicrochip', 'ApolloMicrochip'],
            mapNodeIndicator: 'GreenMicrochip'
        },
        specialtyItem: {
            description: 'Rugged Specialty Item',
            tint: 0x1e9489,
            items: ["JadeRing", 'BoxCutter', 'GoldenYinYang', "RubyRing", "BlueVisor", "PolarizedVisor", 'CamoflaugeGlove'],
            mapNodeIndicator: 'JadeRing'
        },
    },

    gleaming: {
        item: {
            tint: 0xfce558,
            items: ['GleamingCanteen', 'GoldenCompass', 'FruitCake', 'JadeLocket', 'DiamondLocket', 'GleamingCoffeeCup'],
            mapNodeIndicator: 'GleamingCanteen'
        },
        microchip: {
            tint: 0xa73cc2,
            items: []
        },
        specialtyItem: {
            tint: 0x810587,
            items: ['VioletTipCartridge',  "RubyVisor"],
            mapNodeIndicator: 'VioletTipCartridge'
        },
    },

    alien: {
        item: {
            tint: 0xc0eb7a,
            items: []
        },
        microchip: {
            tint: 0x58bb3f,
            items: []
        },
        specialtyItem: {
            tint: 0x0f7e09,
            items: []
        },
    },

    lightStimulant: {
        item: {
            description: 'Pill',
            tint: 0x80ffbb,
            items: ['Amphetamine', 'PepPill', 'Steroid', 'SugarPill', 'Vitamin'],
            gleamAnimation: 'PillGleam',
            mapNodeIndicator: 'VitaminOne'
        },
    },

    stimulant: {
        item: {
            description: 'Stimulant',
            tint: 0x80ffbb,
            items: ['SlipperySoup', 'StoutShot', 'Painkiller', 'LifeExtract', 'CoarseBrine', 'ChemicalConcentrate', 'AwarenessTonic'],
            gleamAnimation: "StimulantGleam",
            mapNodeIndicator: 'BlackSyringe'
        },
    },

    book: {
        item: {
            description: 'Book',
            tint: 0x1169de,
            items: ['Book'],
            gleamAnimation: 'BookGleam',
            mapNodeIndicator: 'BlueBook'
        }
    },

    noClass: {
        item: {
            tint: 0xffffff,
            items: []
        }
    },
};

export {
    ItemClasses
};
