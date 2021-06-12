import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import {globals} from '@core/Fundamental/GlobalState.js';

export default {
    revivableInit: function() {
        this.reviveTime = this.reviveTime || 6000;
        var reviveTickTime = 100;
        var originalDeath = this.death;
        var revivableDeath = function() {
            this.reviveAmount = 0;
            this.grave = graphicsUtils.addSomethingToRenderer(this.graveSpriteName, {where: 'stage', position: mathArrayUtils.clonePosition(this.position, {y: 20}), anchor: {x: 0.5, y: 0.5}, scale: {x: 0.85, y: 0.85}});
            //fade in
            graphicsUtils.fadeSpriteOverTime(this.grave, 2000, true);

            this.reviveCenter = mathArrayUtils.clonePosition(this.position);
            this.grave.tint = graphicsUtils.percentAsHexColor(0, {start: {r: 255, g: 255, b: 255}, final: {r: 255, g: 0, b: 0}});

            this.canAttack = false;
            this.canMove = false;
            this.isTargetable = false;
            gameUtils.moveUnitOffScreen(this);
            Matter.Events.trigger(globals.currentGame.unitSystem, "removeUnitFromSelectionSystem", {unit: this});
            this.isSelectable = false;
            this.stop();

            var levelLocalEntities = originalDeath.call(this);

            this.reviveTimer = globals.currentGame.addTimer({
                name: 'revive' + this.unitId,
                gogogo: true,
                timeLimit: reviveTickTime,
                callback: function() {
                    var canRevive = false;
                    gameUtils.applyToUnitsByTeam(function(team) {
                        return team == this.team;
                    }.bind(this), function(unit) {
                        return this != unit;
                    }.bind(this), function(unit) {
                        if(mathArrayUtils.distanceBetweenPoints(this.reviveCenter, unit.position) <= 50) {
                            canRevive = true;
                        }
                    }.bind(this));

                    if(canRevive) {
                        this.reviveAmount += reviveTickTime;
                        this.revivePercent = this.reviveAmount/this.reviveTime;
                        this.grave.tint = graphicsUtils.percentAsHexColor(this.revivePercent, {start: {r: 255, g: 255, b: 255}, final: {r: 255, g: 0, b: 0}});
                        if(this.revivePercent >= 1) {
                            this.revive();
                        }
                    }
                }.bind(this)
            });
            return levelLocalEntities;
        };
        this.death = revivableDeath;
    },

    revive: function() {
        globals.currentGame.invalidateTimer(this.reviveTimer);
        graphicsUtils.removeSomethingFromRenderer(this.grave);

        this.isDead = false;
        this.currentEnergy = this.maxEnergy/2;
        this.currentHealth = this.maxHealth/2;
        this.position = this.reviveCenter;
        this.isTargetable = true;
        this.isSelectable = true;
        this.canAttack = true;
        this.canMove = true;
    },

    hideGrave: function() {
        if(this.grave) {
            if(this.corpse) {
                graphicsUtils.removeSomethingFromRenderer(this.corpse);
            }
            graphicsUtils.removeSomethingFromRenderer(this.grave);
            this.grave = null;
        }
    }
};
