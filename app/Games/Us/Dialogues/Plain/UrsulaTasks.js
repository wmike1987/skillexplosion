import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {Scene} from '@core/Scene.js';
import styles from '@utils/Styles.js';
import {
    DialogueScene
} from '@games/Us/Dialogues/DialogueScene.js';
import UnitMenu from '@games/Us/UnitMenu.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import {
    MapLearning
} from '@games/Us/Dialogues/Plain/MapLearning.js';

var completeTaskAndRelease = function(dialogue) {
    if(dialogue.isTask) {
        dialogue.completeTask();
    }
};

var UrsulaTasks = function(scene) {

    var achieve = gameUtils.getSound('fullheal.wav', {volume: 0.045, rate: 0.75});

    this.box = UnitMenu.createUnit('DestructibleBox', {team: this.neutralTeam, isTargetable: false, canTakeAbilityDamage: false});
    ItemUtils.giveUnitItem({gamePrefix: "Us", itemClass: ["stimulant"], unit: this.box, immortal: true});
    globals.currentGame.addUnit(this.box);
    this.box.position = {x: 950, y: 400};

    var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Ursula.", isTask: true, backgroundBox: true});
    var a2 = new Dialogue({actor: "Task", text: "Right click to move Ursula to the beacon.", isTask: true, backgroundBox: true });
    var a3a = new Dialogue({actor: "Task", text: "Hover over your Heal ability to read its description.", isTask: true, backgroundBox: true});
    var a3b = new Dialogue({actor: "Task", text: "Press 'A' then left click near (or on) Shane to heal him.", isTask: true, backgroundBox: true});
    var a4a = new Dialogue({actor: "Task", text: "Hover over your Vanish ability to read its description.", isTask: true, backgroundBox: true});
    var a4b = new Dialogue({actor: "Task", text: "Press 'D' then left click on the beacon to vanish to that point.", isTask: true, backgroundBox: true});
    var a5a = new Dialogue({actor: "Task", text: "Hover over your Mine ability to read its description.", newBreak: true, isTask: true, backgroundBox: true});
    var a5b = new Dialogue({actor: "Task", text: "Move next to the box then press 'F' to lay a mine.", isTask: true, backgroundBox: true});
    var a5c = new Dialogue({actor: "Task", text: "Pick up your item", isInfo: true, backgroundBox: true});
    var a5d = new Dialogue({actor: "Task", text: "This item is consumable. Read its description and consume it.", isTask: true, backgroundBox: true});
    var a6 = new Dialogue({text: "With both units selected, you can press 'tab' to switch the focused unit.", newBreak: true, isInfo: true, backgroundBox: true, delayAfterEnd: 2500});
    var a7 = new Dialogue({actor: "Task", text: "Lay a mine then trigger it by making Shane throw a knife at it.", isTask: true, backgroundBox: true});
    var a8 = new Dialogue({text: "You can also lay a mine while vanishing.", isInfo: true, backgroundBox: true, delayAfterEnd: 2500});

    var chain = new DialogueChain([a1, a2, a3a, a3b, a4a, a4b, a5a, a5b, a5c, a5d, a6, a7, a8], {startDelay: 200, done: function() {
        chain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            transitionChain.play();
        }, 250);
    }});

    var moveBeaconLocation = {x: 1000, y: 550};

    globals.currentGame.shane.ignoreHealthRegeneration = true;

    a1.onStart = function() {
        var arrow = graphicsUtils.pointToSomethingWithArrow(globals.currentGame.ursula, -35, 0.5);
        gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'executeSelection', (event) => {
            if(event.orderedSelection.length > 0 && event.orderedSelection[0].name == 'Ursula') {
                achieve.play();
                graphicsUtils.removeSomethingFromRenderer(arrow);
                completeTaskAndRelease(a1);

                return true;
            }
        });
    };

    a2.onStart = function() {
        var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
        graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 8});
        gameUtils.matterConditionalOnce(globals.currentGame.ursula, 'destinationReached', (event) => {
            var destination = event.destination;
            if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
            achieve.play();
            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTimeLegacy(moveBeacon, 500);}});

            completeTaskAndRelease(a2);
            return true;
        });
    };

    a3a.onStart = function() {
        var healAbility = globals.currentGame.ursula.getAbilityByName('Heal');
        var arrow = graphicsUtils.pointToSomethingWithArrow(healAbility.icon, -30, 0.75);
        gameUtils.matterOnce(healAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);

            completeTaskAndRelease(a3a);
        });
    };

    var allHealed = false;
    a3b.onStart = function() {
        gameUtils.matterOnce(globals.currentGame.ursula, 'performHeal', (event) => {
            var healme = gameUtils.matterOnce(globals.currentGame.shane, 'healedFully', (event) => {
                if(!allHealed) {
                    achieve.play();
                    allHealed = true;
                    globals.currentGame.shane.ignoreHealthRegeneration = false;
                    completeTaskAndRelease(a3b);
                }
            });
        });
    };

    a4a.onStart = function() {
        var ssAbility = globals.currentGame.ursula.getAbilityByName('Vanish');
        var arrow = graphicsUtils.pointToSomethingWithArrow(ssAbility.icon, -30, 0.75);
        gameUtils.matterOnce(ssAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);

            completeTaskAndRelease(a4a);
        });
    };

    a4b.onStart = function() {
        var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
        graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 8});
        gameUtils.matterConditionalOnce(globals.currentGame.ursula, 'secretStepLand', (event) => {
            var destination = event.destination;
            if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTimeLegacy(moveBeacon, 500);}});
            achieve.play();
            completeTaskAndRelease(a4b);
            return true;
        });
    };

    a5a.onStart = function() {
        var mineAbility = globals.currentGame.ursula.getAbilityByName('Mine');
        var arrow = graphicsUtils.pointToSomethingWithArrow(mineAbility.icon, -30, 0.75);
        gameUtils.matterOnce(mineAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);
            completeTaskAndRelease(a5a);
        });
    };

    var box = this.box;
    a5b.onStart = function() {
        box.isTargetable = true;
        box.canTakeAbilityDamage = true;
        gameUtils.matterOnce(box, 'death', (event) => {
            achieve.play();
            completeTaskAndRelease(a5b);
        });
    };

    a5c.onStart = function() {
        var a = gameUtils.matterOnce(globals.currentGame.ursula, 'pickupItem', (event) => {
            achieve.play();
            completeTaskAndRelease(a5c);
            b.removeHandler();
        });

        var b = gameUtils.matterOnce(globals.currentGame.shane, 'pickupItem', (event) => {
            achieve.play();
            completeTaskAndRelease(a5c);
            a.removeHandler();
        });
    };

    a5d.onStart = function() {
        var a = gameUtils.matterOnce(globals.currentGame.ursula, 'consume', (event) => {
            achieve.play();
            completeTaskAndRelease(a5d);
            b.removeHandler();
        });
        var b = gameUtils.matterOnce(globals.currentGame.shane, 'consume', (event) => {
            achieve.play();
            completeTaskAndRelease(a5d);
            a.removeHandler();
        });
    };

    a6.onStart = function() {
        globals.currentGame.shane.isSelectable = true;
    };

    a7.onStart = function() {
        gameUtils.matterOnce(globals.currentGame.shane, 'knifeMine', (event) => {
            achieve.play();
            completeTaskAndRelease(a7);
        });
    };

    scene.addCleanUpTask(() => {
        achieve.unload();
        chain.cleanUp();
        transitionChain.cleanUp();
        microchipChain.cleanUp();
    });

    var b1 = new Dialogue({actor: "MacMurray", text: "Good job, you'll need to learn fast out here.", pauseAfterWord: {word: 'Great.', duration: 1000}, backgroundBox: true, letterSpeed: 40});
    var b2 = new Dialogue({actor: "MacMurray", text: "I'm delivering a microchip. Learn to use it.", isTask: false, backgroundBox: true, letterSpeed: 40, continuation: true, preventAutoEnd: true, delayAfterEnd: 100});

    var transitionChain = new DialogueChain([b1, b2], {startDelay: 200, done: function() {
        transitionChain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            microchipChain.play();
        }, 50);
    }});

    b2.onFullyShown = function() {
        globals.currentGame.flyover(() => {
            globals.currentGame.dustAndItemBox({location: gameUtils.getPlayableCenterPlus({x: 100}), item: ['BasicMicrochip'], special: true});
            b2.preventAutoEnd = false;
        });
    };

    var c1 = new Dialogue({text: "Destroy the box and collect the microchip.", isTask: true, backgroundBox: true});
    var c2 = new Dialogue({text: "Hover over the microchip to read its description.", isTask: true, backgroundBox: true});
    var c3 = new Dialogue({text: "Grab the microchip and place it on one of your ability augments.", isTask: true, backgroundBox: true});
    var c4 = new Dialogue({text: "Microchips can be reused.", isInfo: true, backgroundBox: true, letterSpeed: 30, delayAfterEnd: 1500});
    var c5 = new Dialogue({text: "Unseat the microchip and place it on a different augment.", isTask: true, backgroundBox: true});
    var c6 = new Dialogue({actor: "MacMurray", text: "There's a small wave incoming, let's test out what you've learned.", newBreak: true, pauseAfterWord: {word: 'incoming,', duration: 500}, backgroundBox: true, letterSpeed: 40});

    var microchip = null;
    c1.onStart = function() {
        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, 'pickupItem', (event) => {
            if(event.unit.name != 'Ursula' && event.unit.name != 'Shane') return;
            var item = event.item;
            if(item.name == 'Gen-1 Microchip') {
                microchip = item;
                microchip.notGrabbable = true;
                if(microchip) {
                    achieve.play();
                    completeTaskAndRelease(c1);
                }
                return true;
            }
        });
    };

    c2.onStart = function() {
        var arrow = graphicsUtils.pointToSomethingWithArrow(microchip, -10, 0.5);
        gameUtils.matterOnce(microchip.icon, 'tooltipShown', () => {
            graphicsUtils.removeSomethingFromRenderer(arrow);
            achieve.play();
            completeTaskAndRelease(c2);
        });
    };

    c3.onStart = function() {
        microchip.notGrabbable = false;
        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, "usergrab", function(event) {
            var item = event.item;
            var unit = event.unit;
            if(item.name == 'Gen-1 Microchip') {
                // arrow = graphicsUtils.pointToSomethingWithArrow(microchip, -5, 0.5);
                gameUtils.matterOnce(globals.currentGame.unitSystem, 'augmentEquip', function() {
                    achieve.play();
                    completeTaskAndRelease(c3);
                });
                return true;
            }
        });
    };

    c5.onStart = function() {
        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, "usergrab", function(event) {
            var item = event.item;
            var unit = event.unit;
            if(item.name == 'Gen-1 Microchip') {
                // arrow = graphicsUtils.pointToSomethingWithArrow(microchip, -5, 0.5);
                gameUtils.matterOnce(globals.currentGame.unitSystem, 'augmentEquip', function() {
                    achieve.play();
                    completeTaskAndRelease(c5);
                });
                return true;
            }
        });
    };

    var microchipChain = new DialogueChain([c1, c2, c3, c4, c5, c6], {startDelay: 200, done: function() {
        microchipChain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
                globals.currentGame.nextPhase();
                var arrow = graphicsUtils.pointToSomethingWithArrow(globals.currentGame.currentLevel.mapTableSprite, -20, 0.5);
                globals.currentGame.currentLevel.mapTableActive = true;
                gameUtils.matterOnce(globals.currentGame, 'showMap', () => {
                    graphicsUtils.removeSomethingFromRenderer(arrow);
                    //Enable the map learning section
                    var mapLearning = new MapLearning(scene);
                    mapLearning.play();
                });
        }, 750);
    }});

    return chain;
};

export {
    UrsulaTasks
};
