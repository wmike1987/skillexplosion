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
    globals, keyStates
} from '@core/Fundamental/GlobalState.js';
import {Scene} from '@core/Scene.js';
import styles from '@utils/Styles.js';
import {
    DialogueScene
} from '@games/Us/Dialogues/DialogueScene.js';

var CampNoirTrueStart = function(options) {
    this.escape = options.done;
    this.createChain = function() {
        //begin dialogue
        var title = new Dialogue({
            blinkLastLetter: false,
            title: true,
            text: "Late at night...",
            letterSpeed: 60,
            delayAfterEnd: 2000
        });
        var a1 = new Dialogue({
            actor: "Ursula",
            text: "Shane, get up. Incoming message from Command...",
            picture: 'NewMessage.png',
            pictureWordTrigger: 'Incoming'
        });
        var a2 = new Dialogue({
            pauseAtPeriods: false,
            actor: "Shane",
            text: "It's... 3:00am. Those pencil pushers can wait until mor--",
            actionText: {
                word: "Grunts",
                actionDuration: 2000,
                fadeOutOnly: true
            },
            pauseAfterWord: {word: "It's...", duration: 750},
            delayAfterEnd: 0,
            picture: '302.png',
            pictureWordTrigger: '3:00'
        });
        var a3 = new Dialogue({
            interrupt: true,
            actor: "Ursula",
            text: "It's from MacMurray...",
            picture: 'MacMurray.png',
            pictureWordTrigger: 'from'
        });
        var a4 = new Dialogue({
            actor: "Shane",
            text: "Christ... a wave?",
            pauseAfterWord: {word: "Christ...", duration: 900},
            delayAfterEnd: 750
        });
        var a5 = new Dialogue({
            actor: "Ursula",
            text: "Yes."
        });
        var a6 = new Dialogue({
            actor: "Shane",
            text: "Location?",
            delayAfterEnd: 500
        });
        var a7 = new Dialogue({
            actor: "Ursula",
            text: "Intel is being relayed. Get up, get your rifle.",
            picture: 'GrabRifleLighter.png',
            pictureWordTrigger: 'Get up',
            delayAfterEnd: 1200
        });
        var a8 = new Dialogue({
            actor: "Shane",
            text: "Is the coffee ready?",
            delayAfterEnd: 1500
        });

        return new DialogueChain([title, a1, a2, a3, a4, a5, a6, a7, a8], {startDelay: 3000});
    };

    this.initialize();
};

CampNoirTrueStart.prototype = DialogueScene;
export {
    CampNoirTrueStart
};
