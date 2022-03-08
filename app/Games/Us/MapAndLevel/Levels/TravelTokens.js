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
            self.arriveCallback();
        }, 500);
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
            this.displayObject.tooltipObj.disable();
            this.displayObject.tooltipObj.hide();
            airDropClickTokenSound.play();
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
                            this.gleamTimer = graphicsUtils.fadeBetweenSprites(regularToken, specialToken, 500, 900, 0);
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
        this.tooltipDescription = 'Incur no fatigue damage on the next level.';
    };

    this.arriveCallback = function() {
        globals.currentGame.map.addMorphine(1);
    };
};
morphineStation.prototype = commonTravelToken;



export {
    morphineStation
};
