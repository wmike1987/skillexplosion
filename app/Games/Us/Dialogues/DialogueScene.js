import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import {Dialogue, DialogueChain} from '@core/Dialogue.js';
import {globals, keyStates} from '@core/Fundamental/GlobalState.js';
import Scene from '@core/Scene.js';
import styles from '@utils/Styles.js';

var DialogueScene = {
    initialize: function(options) {
        options = options || {};
        this.id = mathArrayUtils.getId();
        var dialogueScene = new Scene();
        var dialogChain = this.createChain(dialogueScene);
        dialogueScene.addBlackBackground();

        Matter.Events.on(dialogueScene, 'afterSnapshotRender', () => {
            globals.currentGame.closeMap();
            globals.currentGame.unitSystem.pause();
        });


        if(this.initExtension) {
            this.initExtension(dialogueScene);
        }

        //indicate skipping behavior
        var skipText;
        if(!this.dontShowEscText) {
            Matter.Events.on(dialogueScene, 'sceneFadeInDone', () => {
                skipText = graphicsUtils.addSomethingToRenderer("TEX+:Esc to fast-forward", {where: 'hudText', style: styles.titleOneStyle, anchor: {x: 1, y: 1}, alpha: 0.1, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}});
                dialogueScene.add(skipText);
            });
        }

        //init the escape-to-continue functionality
        dialogChain.done = function() {
            if(this.chainDoneExtension) {
                this.chainDoneExtension(dialogueScene);
            }
            graphicsUtils.removeSomethingFromRenderer(skipText);
            var spacetoContinue = graphicsUtils.addSomethingToRenderer("TEX+:Space to continue", {where: 'hudText', alpha: 0.5, style: styles.titleOneStyle, anchor: {x: 1, y: 1}, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}});
            dialogueScene.add(spacetoContinue);
            graphicsUtils.graduallyTint(spacetoContinue, 0xFFFFFF, 0xc72efb, 125, null, false, 3);
            $('body').on('keydown.' + 'DScene:' + this.id, function( event ) {
                var key = event.key.toLowerCase();
                if(key == ' ') {
                    //clear dialogue and start initial level
                    globals.currentGame.unitSystem.unpause();
                    $('body').off('keydown.' + 'DScene:' + this.id);
                    this.escape();
                }
            }.bind(this));
        }.bind(this);

        dialogueScene.addCleanUpTask(() => {
            $('body').off('keydown.' + 'DScene:' + this.id);
        });

        this.scene = dialogueScene;

        this.play = function() {
            dialogueScene.add(dialogChain);
            dialogChain.play();
        };
    }
};

export {DialogueScene};
