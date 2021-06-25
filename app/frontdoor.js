import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import {globals} from '@core/Fundamental/GlobalState.js';
import collisionPlugin from '@lib/matter-collision-events/plugin.js';
import * as particles from 'pixi-particles';
import polydecomp from 'poly-decomp';

$(document).ready(async function() {
    window.PIXI = PIXI;
    PIXI.particles = particles;
    window.decomp = polydecomp;
    await import(/* webpackChunkName: "pixi-layers" */'pixi-layers');
    await import(/* webpackChunkName: "pixi-spine" */'pixi-spine');

    //override spine slot def
    PIXI.spine.core.Slot.prototype.setToSetupPose = function () {
      this.color.setFromColor(this.data.color);
      if (this.customColor) {
        this.color.setFromColor(this.customColor);
      }
      if(this.customPreserveAlpha) {
          var customColorWithAlpha = {
              r: this.customColor.r,
              g: this.customColor.g,
              b: this.customColor.b,
              a: this.data.color.a
          };
          this.color.setFromColor(customColorWithAlpha);
      }
      if (this.darkColor != null)
        this.darkColor.setFromColor(this.data.darkColor);
      if (this.data.attachmentName == null) {
          this.attachment = null;
      }
      else {
        this.attachment = null;
        this.setAttachment(
          this.bone.skeleton.getAttachment(
            this.data.index,
            this.data.attachmentName
          )
        );
      }
    };

    Matter.use('matter-collision-events');

    //anoint button
    $('.game').each((i, gameElement) => {
        let gameName = $(gameElement).attr('name');
        // $(gameElement).text(gameName);
        $(gameElement).click(() => {
            if(globals.currentGame) {
                globals.currentGame.nuke({noMercy: true});
            }
            import(/* webpackChunkName: "[request]" */ /* webpackInclude: /(Us)+.js$/ */'@games/' + gameName + '.js').then((module) => {

                module.default.loadGame();
            });
        });
    });
});
