import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import Scene from '@core/Scene.js';
import styles from '@utils/Styles.js';
import {
    DialogueScene
} from '@games/Us/Dialogues/DialogueScene.js';
import UnitMenu from '@games/Us/UnitMenu.js';
import ItemUtils from '@core/Unit/ItemUtils.js';


var pauseAfterCompleteTime = 750;
var completeTaskAndRelease = function(dialogue) {
    if(dialogue.isTask) {
        dialogue.completeTask();
        gameUtils.doSomethingAfterDuration(() => {
            dialogue.preventAutoEnd = false;
        }, pauseAfterCompleteTime);
    }
};

var UrsulaTasks = function(scene) {

    var achieve = gameUtils.getSound('fullheal.wav', {volume: 0.045, rate: 0.75});

    this.box = UnitMenu.createUnit('DestructibleBox', {team: this.neutralTeam, isTargetable: false, canTakeAbilityDamage: false});
    ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["SturdyCanteen"], unit: this.box, immortal: true});
    globals.currentGame.addUnit(this.box);
    this.box.position = {x: 850, y: 300};

    var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Ursula.", isTask: true, backgroundBox: true});
    var a2 = new Dialogue({actor: "Task", text: "Right click to move Ursula to the beacon.", isTask: true, backgroundBox: true });
    var a3a = new Dialogue({actor: "Task", text: "Hover over your Heal ability to read its description.", isTask: true, backgroundBox: true});
    var a3b = new Dialogue({actor: "Task", text: "Press 'A' then left click near (or on) Shane to heal him.", isTask: true, backgroundBox: true});
    var a4a = new Dialogue({actor: "Task", text: "Hover over your Secret Step ability to read its description.", isTask: true, backgroundBox: true});
    var a4b = new Dialogue({actor: "Task", text: "Press 'D' then left click on the beacon to secret-step to that point.", isTask: true, backgroundBox: true});
    var a5a = new Dialogue({actor: "Task", text: "Hover over your Mine ability to read its description.", newBreak: true, isTask: true, backgroundBox: true});
    var a5b = new Dialogue({actor: "Task", text: "Move next to the box then press 'F' to lay a mine.", isTask: true, backgroundBox: true});
    var a5c = new Dialogue({actor: "Task", text: "Pick up your item.", isTask: true, backgroundBox: true});
    var a6 = new Dialogue({actor: "Task", text: "Lay a mine then trigger it by making Shane throw a knife at it.", isTask: true, backgroundBox: true});
    var a7 = new Dialogue({text: "You can also lay a mine while secret stepping.", isInfo: true, backgroundBox: true, delayAfterEnd: 2000});

    var chain = new DialogueChain([a1, a2, a3a, a3b, a4a, a4b, a5a, a5b, a5c, a6, a7], {startDelay: 200, done: function() {
        chain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            // microchipChain.play();
            transitionChain.play();
        }, 250);
    }});

    var moveBeaconLocation = {x: 1000, y: 550};

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
            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});

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
            globals.currentGame.shane.ignoreHealthRegeneration = false;
            var healme = gameUtils.matterOnce(globals.currentGame.shane, 'healedFully', (event) => {
                if(!allHealed) {
                    achieve.play();
                    allHealed = true;
                    completeTaskAndRelease(a3b);
                }
            });

            //safety net
            gameUtils.doSomethingAfterDuration(() => {
                if(!allHealed) {
                    achieve.play();
                    allHealed = true;
                    healme.removeHandler();
                    completeTaskAndRelease(a3b);
                }
            }, 15000);
        });
    };

    a4a.onStart = function() {
        var ssAbility = globals.currentGame.ursula.getAbilityByName('Secret Step');
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
            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});
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
        gameUtils.matterOnce(globals.currentGame.ursula, 'pickupItem', (event) => {
            achieve.play();
            completeTaskAndRelease(a5c);
        });
    };

    a6.onStart = function() {
        globals.currentGame.shane.isSelectable = true;
        gameUtils.matterOnce(globals.currentGame.shane, 'knifeMine', (event) => {
            achieve.play();
            completeTaskAndRelease(a6);
        });
    };

    scene.addCleanUpTask(() => {
        achieve.unload();
        chain.cleanUp();
        transitionChain.cleanUp();
        microchipChain.cleanUp();
        bookChain.cleanUp();
        finalMacMurrayChain.cleanUp();
    });

    var b1 = new Dialogue({actor: "MacMurray", text: "One more thing, you live and die by your wits out here.", pauseAfterWord: {word: 'thing,', duration: 300}, backgroundBox: true, letterSpeed: 30});
    var b2 = new Dialogue({actor: "MacMurray", text: "I'm delivering a microchip and a book. Learn to use them.", isTask: false, backgroundBox: true, letterSpeed: 30, continuation: true, preventAutoEnd: true});

    var transitionChain = new DialogueChain([b1, b2], {startDelay: 200, done: function() {
        transitionChain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            microchipChain.play();
        }, 1000);
    }});

    b2.fullyShownCallback = function() {
        globals.currentGame.flyover(() => {
            globals.currentGame.dustAndItemBox(gameUtils.getPlayableCenterPlus({x: 100}), ['BasicMicrochip', 'Book'], true);
            b2.preventAutoEnd = false;
        });
    };

    var c1 = new Dialogue({text: "Destroy the box and collect the microchip and the book.", isTask: true, backgroundBox: true});
    var c2 = new Dialogue({text: "Hover over the microchip to read its description.", isTask: true, backgroundBox: true});
    var c3 = new Dialogue({text: "Grab the microchip and place it on one of your ability augments.", isTask: true, backgroundBox: true});
    var c4 = new Dialogue({text: "Microchips can be reused.", isInfo: true, backgroundBox: true, letterSpeed: 30, delayAfterEnd: 1500});
    var c5 = new Dialogue({text: "Unseat the microchip and place it on a different augment.", isTask: true, backgroundBox: true});

    var microchip = null;
    var book = null;
    c1.onStart = function() {
        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, 'pickupItem', (event) => {
            if(event.unit.name != 'Ursula' && event.unit.name != 'Shane') return;
            var item = event.item;
            if(item.name == 'Gen-1 Microchip') {
                microchip = item;
                microchip.notGrabbable = true;
                if(book && microchip) {
                    achieve.play();
                    completeTaskAndRelease(c1);
                }
                return true;
            }
        });

        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, 'pickupItem', (event) => {
            if(event.unit.name != 'Ursula' && event.unit.name != 'Shane') return;
            var item = event.item;
            if(item.name == "Book") {
                book = item;
                book.notGrabbable = true;
                if(book && microchip) {
                    achieve.play();
                    completeTaskAndRelease(c1);
                }
                return true;
            }
        });
    };

    var arrow;
    c2.onStart = function() {
        arrow = graphicsUtils.pointToSomethingWithArrow(microchip, -5, 0.5);
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

    var microchipChain = new DialogueChain([c1, c2, c3, c4, c5], {startDelay: 200, done: function() {
        microchipChain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            bookChain.play();
        }, 250);
    }});

    var d1 = new Dialogue({text: "Hover over the book to read its description.", isTask: true, backgroundBox: true});
    var d2 = new Dialogue({text: "Books cannot be reused like microchips can.", isInfo: true, backgroundBox: true, delayAfterEnd: 1500});
    var d3 = new Dialogue({text: "Grab the book and drop it on a state of mind.", isTask: true, backgroundBox: true});
    var d4 = new Dialogue({text: "This state of mind is now available to equip.", isInfo: true, backgroundBox: true, delayAfterEnd: 2750});
    var d5 = new Dialogue({text: "Each state of mind has two modes to choose from.", isInfo: true, backgroundBox: true, delayAfterEnd: 1000});
    var d6 = new Dialogue({text: "Activate the aggression mode of your learned state of mind. (Click)", isTask: true, backgroundBox: true});
    var d7 = new Dialogue({text: "Now switch to the defensive mode. (Ctrl+Click)", isTask: true, backgroundBox: true});

    d1.onStart = function() {
        arrow = graphicsUtils.pointToSomethingWithArrow(book, -5, 0.5);
        gameUtils.matterOnce(book.icon, 'tooltipShown', () => {
            graphicsUtils.removeSomethingFromRenderer(arrow);
            achieve.play();
            completeTaskAndRelease(d1);
        });
    };

    d3.onStart = function() {
        book.notGrabbable = false;
        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, "usergrab", function(event) {
            var item = event.item;
            var unit = event.unit;
            if(item == book) {
                globals.currentGame.unitSystem.unitPanel.hideAugmentsForCurrentUnit();
                // arrow = graphicsUtils.pointToSomethingWithArrow(microchip, -5, 0.5);
                gameUtils.matterOnce(globals.currentGame.unitSystem, 'stateOfMindLearned', function() {
                    achieve.play();
                    completeTaskAndRelease(d3);
                });
                return true;
            }
        });
    };

    d6.onStart = function() {
        gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'stateOfMindEquipped', function(event) {
            var mode = event.mode;
            if(mode == 'aggression') {
                achieve.play();
                completeTaskAndRelease(d6);
                return true;
            }
        });
    };

    d7.onStart = function() {
        gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'stateOfMindEquipped', function(event) {
            var mode = event.mode;
            if(mode == 'defensive') {
                achieve.play();
                completeTaskAndRelease(d7);
                return true;
            }
        });
    };

    var bookChain = new DialogueChain([d1, d2, d3, d4, d5, d6, d7], {startDelay: 200, done: function() {
        bookChain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            finalMacMurrayChain.play();
        }, 1000);
    }});

    var e1 = new Dialogue({actor: "MacMurray", text: "Well done.", backgroundBox: true});
    var e2 = new Dialogue({actor: "MacMurray", text: "When you're out traveling you won't be able to configure your abilities, so plan ahead.", continuation: true, backgroundBox: true});
    var e3 = new Dialogue({actor: "MacMurray", text: "Get some rest, I'll be in touch...", continuation: true, backgroundBox: true});
    var finalMacMurrayChain = new DialogueChain([e1, e2, e3], {startDelay: 200, done: function() {
        finalMacMurrayChain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            globals.currentGame.nextPhase();
        }, 1500);
    }});

    return chain;
};

export {
    UrsulaTasks
};
