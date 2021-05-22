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
    globals, keyStates
} from '@core/Fundamental/GlobalState.js';
import Scene from '@core/Scene.js';
import styles from '@utils/Styles.js';
import {
    DialogueScene
} from '@games/Us/Dialogues/DialogueScene.js';

var CampNoirPhaseTwo = function(options) {
    this.escape = options.done;
    this.createChain = function() {
        //begin dialogue
        var title = new Dialogue({
            blinkLastLetter: false,
            title: true,
            text: "...",
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
                actionDuration: 1200,
                fadeOutOnly: true
            },
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
            delayAfterEnd: 0
        });
        var a5 = new Dialogue({
            interrupt: true,
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

        return new DialogueChain([title, a1, a2, a3, a4, a5, a6, a7, a8], {startDelay: 2000});
    };

    this.initialize();
};

CampNoirPhaseTwo.prototype = DialogueScene;
export {
    CampNoirPhaseTwo
};
