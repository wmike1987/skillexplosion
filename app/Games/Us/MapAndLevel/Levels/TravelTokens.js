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

var clickTokenSound = gameUtils.getSound('clickbattletoken2.wav', {
    volume: 0.03,
    rate: 1.2
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
    this.stateCaptured = false;

    this.mapNode.saveMapState = function() {
        //capture or restore states
        if (!self.stateCaptured) {
            self.fatigueState = globals.currentGame.map.startingFatigue;
            self.adrenalineState = globals.currentGame.map.adrenaline;
            self.morphineState = globals.currentGame.map.morphine;
            self.healthDepot = globals.currentGame.map.getAdditionalState().healthDepot;
            self.energyDepot = globals.currentGame.map.getAdditionalState().energyDepot;
            self.stateCaptured = true;
        }
    };

    this.mapNode.restoreMapState = function() {
        var mapState = {
            fatigue: self.fatigueState,
            adrenaline: self.adrenalineState,
            morphine: self.morphineState,
            healthDepot: self.healthDepot,
            energyDepot: self.energyDepot,
            dodgeDepot: self.dodgeDepot
        };

        //starting fatigue/fatigue
        Matter.Events.trigger(globals.currentGame.map, 'SetFatigue', {
            amount: mapState.fatigue,
            includeStartingFatigue: true
        });

        //morphine
        globals.currentGame.map.setMorphine(mapState.morphine);

        //adrenaline
        globals.currentGame.map.clearAllAdrenalineBlocks();
        mathArrayUtils.repeatXTimes(() => {
            globals.currentGame.map.addAdrenalineBlock();
        }, mapState.adrenaline);

        //depots
        if (mapState.healthDepot) {
            healthDepotAction();
        }

        if (mapState.energyDepot) {
            energyDepotAction();
        }

        if (mapState.dodgeDepot) {
            dodgeDepotAction();
        }
    };

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
        getClickSound: function() {
            return clickTokenSound;
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
        graphicsUtils.flashSprite({
            sprite: globals.currentGame.map.fatigueText,
            toColor: 0x45f112
        });
        Matter.Events.trigger(globals.currentGame.map, 'SetFatigue', {
            amount: Math.floor(globals.currentGame.map.getCurrentFatigue() / 2.0),
            includeStartingFatigue: true
        });
        globals.currentGame.map.removeAdrenalineBlock();
        globals.currentGame.map.removeAdrenalineBlock();
    };
};
restStop.prototype = commonTravelToken;

var tokenAugmentFunction = function(options) {
    var icon = graphicsUtils.createDisplayObject('SmallWhiteCircle', {
        where: 'hudOne',
        tint: options.tint
    });
    globals.currentGame.map.addTokenAugment(icon, options.id);
    let st = {};
    st[options.stateKey] = 1;
    globals.currentGame.map.addAdditionalState(st);
    gameUtils.matterOnce(globals.currentGame, 'EarlyEnterBattleLevel', () => {
        globals.currentGame.map.removeTokenAugment(options.id);
        globals.currentGame.map.removeAdditionalState(options.stateKey);
        unitUtils.applyToUnitsByTeam(function(team) {
            return team == globals.currentGame.playerTeam;
        }.bind(this), null, function(unit) {
            options.action(unit);
        }.bind(this));
    });
};

var healthDepotAction = () => {
    tokenAugmentFunction({
        tint: 0xd70808,
        stateKey: 'healthDepot',
        id: 'healthIcon' + mathArrayUtils.getId(),
        action: (unit) => {
            var id = 'healthDepotBuff' + mathArrayUtils.getId();
            unit.applyHealthGem({
                duration: 999999,
                id: id
            });
        }
    });
};

var healthDepot = function(options) {
    this.regularTokenName = 'HealthDepotToken';
    this.specialTokenName = 'HealthDepotTokenGleaming';

    this.setNodeTitle = function() {
        this.nodeTitle = "Health Depot";
        this.tooltipDescription = ['Gain a health gem for the next camp.'];
    };

    this.arriveCallback = healthDepotAction;
};
healthDepot.prototype = commonTravelToken;

var energyDepotAction = () => {
    tokenAugmentFunction({
        tint: 0x8d2fc7,
        stateKey: 'energyDepot',
        id: 'energyIcon' + mathArrayUtils.getId(),
        action: (unit) => {
            var id = 'energyDepotBuff' + mathArrayUtils.getId();
            unit.applyEnergyGem({
                duration: 999999,
                id: id
            });
        }
    });
};

var energyDepot = function(options) {
    this.regularTokenName = 'EnergyDepotToken';
    this.specialTokenName = 'EnergyDepotTokenGleaming';

    this.setNodeTitle = function() {
        this.nodeTitle = "Energy Depot";
        this.tooltipDescription = ['Gain an energy gem for the next camp.'];
    };

    this.arriveCallback = energyDepotAction;
};
energyDepot.prototype = commonTravelToken;

var dodgeDepotAction = () => {
    tokenAugmentFunction({
        tint: 0x066a01,
        stateKey: 'dodgeDepot',
        id: 'dodgeIcon' + mathArrayUtils.getId(),
        action: (unit) => {
            var id = 'dodgeDepotBuff' + mathArrayUtils.getId();
            unit.applyDodgeBuff({
                duration: 999999,
                amount: 30,
                id: id
            });
        }
    });
};

var dodgeDepot = function(options) {
    this.regularTokenName = 'DodgeToken';
    this.specialTokenName = 'DodgeTokenGleaming';

    this.setNodeTitle = function() {
        this.nodeTitle = "Dodge Depot";
        this.tooltipDescription = ['Gain a dodge buff (+30) for the next camp.'];
    };

    this.arriveCallback = dodgeDepotAction;
};
dodgeDepot.prototype = commonTravelToken;

export {
    morphineStation,
    restStop,
    healthDepot,
    energyDepot,
    dodgeDepot,
};
