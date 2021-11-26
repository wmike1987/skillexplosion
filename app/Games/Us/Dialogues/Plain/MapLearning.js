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

var completeTaskAndRelease = function(dialogue) {
    if (dialogue.isTask) {
        dialogue.completeTask();
    }
};

var MapLearning = function(scene) {

    var achieve = gameUtils.getSound('fullheal.wav', {
        volume: 0.045,
        rate: 0.75
    });

    var a1 = new Dialogue({
        actor: "Ursula",
        text: "Let's check our intel.",
        letterSpeed: 45,
        pauseAfterWord: {
            word: 'territory.',
            duration: 500
        },
        isTask: false,
        backgroundBox: true,
        delayAfterEnd: 1000
    });
    var a3 = new Dialogue({
        actor: "Task",
        text: "Hover over an enemy camp for more details.",
        isTask: true,
        backgroundBox: true
    });
    var a4 = new Dialogue({
        actor: "Ursula",
        text: "This map is how we'll embark on outings.",
        newBreak: true,
        isTask: false,
        letterSpeed: 45,
        backgroundBox: true,
        delayAfterEnd: 1000
    });
    var a5 = new Dialogue({
        actor: "Shane",
        text: "An... outing?",
        isTask: false,
        backgroundBox: true
    });
    var a6 = new Dialogue({
        actor: "Ursula",
        text: "An outing is a series of enemy camps we'll address back-to-back.",
        letterSpeed: 45,
        backgroundBox: true
    });
    var a7 = new Dialogue({
        actor: "Info",
        text: "Outings can be up to three camps long.",
        isInfo: true,
        backgroundBox: true
    });
    var a8 = new Dialogue({
        actor: "Ursula",
        text: "Longer outings are risky since we can't reconfigure between each camp,",
        letterSpeed: 45,
        backgroundBox: true,
        delayAfterEnd: 0
    });
    var a9 = new Dialogue({
        actor: "Ursula",
        text: "but they give Command time to pack several options into a supply drop.",
        delayAfterEnd: 3000,
        continuation: true,
        backgroundBox: true
    });

    var a10 = new Dialogue({
        actor: "Shane",
        text: "A supply drop?",
        pauseAfterWord: {
            word: 'What?',
            duration: 750
        },
        newBreak: true,
        isTask: false,
        backgroundBox: true
    });
    var a11 = new Dialogue({
        actor: "Ursula",
        text: "After an outing, Command will deliver supplies based on the camps we cleared.",
        letterSpeed: 45,
        backgroundBox: true,
        delayAfterEnd: 1000
    });
    var a11a = new Dialogue({
        actor: "Info",
        text: "The type of delivery is indicated by a small icon next to each camp.",
        isInfo: true,
        letterSpeed: 45,
        backgroundBox: true,
        delayAfterEnd: 2500
    });

    var a12 = new Dialogue({
        actor: "Ursula",
        text: "Additionally, after each camp we'll gain one point of adrenaline.",
        newBreak: true,
        letterSpeed: 45,
        backgroundBox: true
    });
    var a13 = new Dialogue({
        actor: "Info",
        text: "Adrenaline is shown in the lower left of the map.",
        isInfo: true,
        backgroundBox: true,
        delayAfterEnd: 1500
    });
    var a14 = new Dialogue({
        actor: "Shane",
        text: "...What? Adrenaline?",
        pauseAfterWord: {
            word: 'What?',
            duration: 750
        },
        isTask: false,
        backgroundBox: true
    });
    var a15 = new Dialogue({
        actor: "Ursula",
        text: "Adrenaline reduces the amount of fatigue accumulated during travel.",
        letterSpeed: 40,
        backgroundBox: true
    });
    var a16 = new Dialogue({
        actor: "Ursula",
        text: "Traveling produces fatigue rapidly and our starting fatigue increases per enemy camp.",
        delayAfterEnd: 500,
        backgroundBox: true,
        continuation: true
    });
    var a16b = new Dialogue({
        actor: "Ursula",
        text: "We'd therefore be wise to plan our routes.",
        delayAfterEnd: 2000,
        continuation: true,
        backgroundBox: true
    });
    var a17 = new Dialogue({
        actor: "Info",
        text: "Returning to camp resets fatigue, but also resets adrenaline.",
        isInfo: true,
        backgroundBox: true,
        delayAfterEnd: 3250
    });
    var a17a = new Dialogue({
        actor: "Info",
        text: "It's possible to return to camp once per wave.",
        isInfo: true,
        backgroundBox: true,
        delayAfterEnd: 2500
    });

    var a18 = new Dialogue({
        actor: "Ursula",
        text: "You'll get the hang of it.",
        backgroundBox: true,
        delayAfterEnd: 1800
    });

    var a19 = new Dialogue({
        actor: "Ursula",
        text: "Let's get going.",
        newBreak: true,
        continuation: false,
        backgroundBox: true
    });

    var chain = new DialogueChain([a1, a3, a4, a5, a6, a7, a8, a9, a10, a11, a11a, a12, a13, a14, a15, a16, a16b, a17, a17a, a18, a19], {
        cleanUpOnDone: true,
        startDelay: 200,
        done: () => {
            globals.currentGame.map.allowClickEvents(true);
        }
    });

    //disable map
    globals.currentGame.map.allowClickEvents(false);

    a3.onStart = function() {
        gameUtils.matterConditionalOnce(globals.currentGame, 'tooltipShown', function(event) {
            var tooltip = event.tooltip;
            if (tooltip.tooltipContext.levelDetails.isBattleLevel()) {
                achieve.play();
                completeTaskAndRelease(a3);
                return true;
            }
        });
    };

    //get ready for book pickup
    gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, 'pickupItem', (event) => {

        //disable map when the box picks up the book
        var item = event.item;
        if (event.unit.unitType == 'Box' && item.name == 'Book') {
            globals.currentGame.currentLevel.mapTableActive = false;
            globals.currentGame.currentLevel.mapTableSprite.tint = 0xffffff;
        }

        //check to see pickup
        if (event.unit.name != 'Ursula' && event.unit.name != 'Shane') return;
        if (item.name == 'Book') {
            var book = item;
            book.notGrabbable = true;
            var d0 = new Dialogue({
                actor: 'Ursula',
                text: "Books are used to learn states of mind.",
                backgroundBox: true,
                delayAfterEnd: 1500,
            });
            var d1 = new Dialogue({
                text: "Hover over the book to read its description.",
                isTask: true,
                backgroundBox: true
            });
            var d2 = new Dialogue({
                text: "Books cannot be reused like microchips can.",
                isInfo: true,
                backgroundBox: true,
                delayAfterEnd: 1500
            });
            var d3 = new Dialogue({
                text: "Grab the book and drop it on a state of mind.",
                isTask: true,
                backgroundBox: true
            });
            var d4 = new Dialogue({
                text: "This state of mind is now available to equip.",
                isInfo: true,
                backgroundBox: true,
                delayAfterEnd: 1500
            });
            var d5 = new Dialogue({
                text: "Each state of mind has two active-modes and an unequipped-mode.",
                isInfo: true,
                backgroundBox: true,
                delayAfterEnd: 1000
            });
            var d6 = new Dialogue({
                text: "Activate the aggression mode of your learned state of mind. (Click)",
                isTask: true,
                backgroundBox: true
            });
            var d7 = new Dialogue({
                text: "Now switch to the defensive mode. (Ctrl+Click)",
                isTask: true,
                backgroundBox: true
            });
            var d8 = new Dialogue({
                text: "Press 'w' to swap your current states of mind. This can be done at any time.",
                isTask: true,
                backgroundBox: true
            });
            var d9 = new Dialogue({
                actor: 'Ursula',
                text: "Great, let's keep going.",
                backgroundBox: true,
                delayAfterEnd: 1500,
            });

            d1.onStart = function() {
                var arrow = graphicsUtils.pointToSomethingWithArrow(book, -10, 0.5);
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
                    if (item == book) {
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
                    if (mode == 'aggression') {
                        achieve.play();
                        completeTaskAndRelease(d6);
                        return true;
                    }
                });
            };

            d7.onStart = function() {
                gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'stateOfMindEquipped', function(event) {
                    var mode = event.mode;
                    if (mode == 'defensive') {
                        achieve.play();
                        completeTaskAndRelease(d7);
                        return true;
                    }
                });
            };

            d8.onStart = function() {
                gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'swapStatesOfMind', function(event) {
                    achieve.play();
                    completeTaskAndRelease(d8);
                    return true;
                });
            };

            var bookChain = new DialogueChain([d0, d1, d2, d3, d4, d5, d6, d7, d8, d9], {
                startDelay: 200,
                done: function() {
                    achieve.unload();
                    bookChain.cleanUp();
                    var arrow = graphicsUtils.pointToSomethingWithArrow(globals.currentGame.currentLevel.mapTableSprite, -20, 0.5);
                    globals.currentGame.currentLevel.mapTableActive = true;
                    gameUtils.matterOnce(globals.currentGame, 'showMap', () => {
                        graphicsUtils.removeSomethingFromRenderer(arrow);
                    });
                }
            });

            bookChain.play();

            return true;
        }
    });

    scene.addCleanUpTask(() => {
        chain.cleanUp();
    });

    return chain;
};

export {
    MapLearning
};
