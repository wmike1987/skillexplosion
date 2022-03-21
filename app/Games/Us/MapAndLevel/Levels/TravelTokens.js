import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    globals,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';
import Tooltip from '@core/Tooltip.js';
import TileMapper from '@core/TileMapper.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import styles from '@utils/Styles.js';
import {
    Doodad
} from '@utils/Doodad.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js';
import {
    ItemClasses
} from '@games/Us/Items/ItemClasses.js';

var entrySound = gameUtils.getSound('enterairdrop1.wav', {
    volume: 0.04,
    rate: 1
});
var airDropClickTokenSound = gameUtils.getSound('clickairdroptoken1.wav', {
    volume: 0.03,
    rate: 1
});
var itemRevealSound = gameUtils.getSound('itemreveal1.wav', {
    volume: 0.08,
    rate: 1
});
var stimulantRevealSound = gameUtils.getSound('itemreveal2.wav', {
    volume: 0.08,
    rate: 1.0
});

var fatigueBenefit = 3;

//Create the travel token "level"
var commonTravelToken = Object.create(levelBase);

commonTravelToken.preNodeInit = function() {
    this.isSupplyDropEligible = false;
    this.setNodeTitle();
};

commonTravelToken.initExtension = function() {
    var self = this;
    this.mapNode.travelToken = true;
    this.mapNode.arriveAtNode = function() {
        gameUtils.doSomethingAfterDuration(() => {
            globals.currentGame.soundPool.positiveSound3.play();
            self.arriveCallback();
        }, 500);
    };
    this.isOutingReady = function() {
        return !this.mapNode.isCompleted;
    };
};

commonTravelToken.createMapNode = function(options) {
    var self = this;
    var mapNode = new MapNode({
        levelDetails: this,
        mapRef: options.mapRef,
        customNodeTint: 0x939393,
        tokenSize: 40,
        largeTokenSize: 50,
        indicatorOffset: {
            x: -22,
            y: -22
        },
        travelPredicate: function() {
            return true;
        },
        mouseDownCallback: function() {
            this.flashNode();
            return false;
        },
        manualTokens: function() {
            var regularToken = graphicsUtils.createDisplayObject(this.levelDetails.regularTokenName, {
                where: 'hudNTwo',
            });
            var specialToken = graphicsUtils.createDisplayObject(this.levelDetails.specialTokenName, {
                where: 'hudNTwo',
            });
            this.regularToken = regularToken;
            this.specialToken = specialToken;

            var mapEventFunction = function() {
                if (this.isCompleted) {
                    // this.deactivateToken();
                } else {
                    if (this.travelPredicate()) {
                        regularToken.visible = true;
                        specialToken.visible = true;
                        if (!this.gleamTimer) {
                            this.gleamTimer = graphicsUtils.fadeBetweenSprites(regularToken, specialToken, 900, 1500, 1500);
                            Matter.Events.on(regularToken, 'destroy', () => {
                                this.gleamTimer.invalidate();
                            });
                        }
                    } else {
                        regularToken.visible = true;
                        specialToken.visible = false;
                    }
                }
            }.bind(this);
            Matter.Events.on(this.mapRef, 'showMap', mapEventFunction);
            gameUtils.deathPact(self, () => {
                Matter.Events.off(this.mapRef, 'showMap', mapEventFunction);
            });
            return [regularToken, specialToken];
        },
        deactivateToken: function() {
            this.regularToken.visible = true;
            this.specialToken.visible = false;
            this.regularToken.alpha = 0.5;
            this.specialToken.alpha = 0.0;
            this.regularToken.tint = 0x002404;
            this.gleamTimer.invalidate();
        }
    });

    return mapNode;
};

var morphineStation = function(options) {
    this.regularTokenName = 'MorphineToken';
    this.specialTokenName = 'MorphineTokenGleaming';

    this.setNodeTitle = function() {
        this.nodeTitle = "Morphine Station";
        this.tooltipDescription = 'Travel at double speed to your next two enemy camps.';
    };

    this.arriveCallback = function() {
        globals.currentGame.map.addMorphine(2);
    };
};
morphineStation.prototype = commonTravelToken;

var restStop = function(options) {
    this.regularTokenName = 'RestStopToken';
    this.specialTokenName = 'RestStopTokenGleaming';

    this.setNodeTitle = function() {
        this.nodeTitle = "Rest Stop";
        this.tooltipDescription = ['Subtract half of current fatigue.', 'Subtract 2 adrenaline.'];
    };

    this.arriveCallback = function() {
        graphicsUtils.flashSprite({sprite: globals.currentGame.map.fatigueText, toColor: 0x45f112});
        Matter.Events.trigger(globals.currentGame.map, 'SetFatigue', {
            amount: Math.floor(globals.currentGame.map.getCurrentFatigue()/2.0)
        });
        globals.currentGame.map.removeAdrenalineBlock();
        globals.currentGame.map.removeAdrenalineBlock();
    };
};
restStop.prototype = commonTravelToken;



export {
    morphineStation,
    restStop
};
