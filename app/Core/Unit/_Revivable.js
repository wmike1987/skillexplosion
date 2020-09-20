import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import utils from '@utils/GameUtils.js'
import {globals} from '@core/GlobalState.js'

export default {
    revivableInit: function() {
        this.reviveTime = 6000;
        var reviveTickTime = 100;
        var originalDeath = this.death;
        var revivableDeath = function() {
            this.reviveAmount = 0;
            this.deathPosition = utils.clonePosition(this.position);
            this.grave = utils.addSomethingToRenderer(this.graveSpriteName, {where: 'stage', position: utils.clonePosition(this.position, {y: 20}), anchor: {x: .5, y: .5}, scale: {x: .85, y: .85}});
            //fade in
            utils.fadeSpriteOverTime(this.grave, 2000, true);

            this.reviveCenter = utils.clonePosition(this.position);
            this.grave.tint = utils.percentAsHexColor(0, {start: {r: 255, g: 255, b: 255}, final: {r: 255, g: 0, b: 0}});

            this.canAttack = false;
            this.canMove = false;
            this.isTargetable = false;
            utils.moveUnitOffScreen(this);
            Matter.Events.trigger(globals.currentGame.unitSystem, "removeUnitFromSelectionSystem", {unit: this})
            this.stop();

            originalDeath.call(this);

            this.reviveTimer = globals.currentGame.addTimer({
                name: 'revive' + this.unitId,
                gogogo: true,
                timeLimit: reviveTickTime,
                callback: function() {
                    var canRevive = false;
                    utils.applyToUnitsByTeam(function(team) {
                        return team == this.team;
                    }.bind(this), function(unit) {
                        return this != unit;
                    }.bind(this), function(unit) {
                        if(utils.distanceBetweenPoints(this.reviveCenter, unit.position) <= 50) {
                            canRevive = true;
                        }
                    }.bind(this))

                    if(canRevive) {
                        this.reviveAmount += reviveTickTime;
                        this.revivePercent = this.reviveAmount/this.reviveTime;
                        this.grave.tint = utils.percentAsHexColor(this.revivePercent, {start: {r: 255, g: 255, b: 255}, final: {r: 255, g: 0, b: 0}});
                        if(this.revivePercent >= 1) {
                            this.revive();
                        }
                    }
                }.bind(this)
            });
        }
        this.death = revivableDeath;
    },

    revive: function() {
        globals.currentGame.invalidateTimer(this.reviveTimer);
        utils.removeSomethingFromRenderer(this.grave);

        this.isDead = false;
        this.currentEnergy = this.maxEnergy/2;
        this.currentHealth = this.maxHealth/2;
        this.position = this.reviveCenter;
        this.isTargetable = true;
        this.canAttack = true;
        this.canMove = true;
    },

    hideGrave: function() {
        if(this.grave) {
            if(this.corpse) {
                utils.removeSomethingFromRenderer(this.corpse);
            }
            utils.removeSomethingFromRenderer(this.grave);
            this.grave = null;
        }
    }
}
