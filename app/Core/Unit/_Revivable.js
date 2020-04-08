define(['jquery', 'matter-js', 'pixi', 'utils/GameUtils'], function($, Matter, PIXI, utils) {

    return {
        revivableInit: function() {
            this.reviveTime = 6000;
            var reviveTickTime = 100;
            var originalDeath = this.death;
            var revivableDeath = function() {
                this.reviveAmount = 0;
                this.grave = utils.addSomethingToRenderer('Grave', {where: 'stage', position: utils.clonePosition(this.position, {y: 20}), anchor: {x: .5, y: 1}});
                this.graveShadow = utils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stage', position: utils.clonePosition(this.position, {y: 15})});
                this.reviveCenter = utils.clonePosition(this.position);
                this.grave.tint = utils.percentAsHexColor(0, {start: {r: 255, g: 0, b: 0}, final: {r: 255, g: 255, b: 255}});
                this.canAttack = false;
                this.canMove = false;
                this.isAttackable = false;
                originalDeath.call(this);
                this.reviveTimer = currentGame.addTimer({
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
                            this.grave.tint = utils.percentAsHexColor(this.revivePercent, {start: {r: 255, g: 0, b: 0}, final: {r: 255, g: 255, b: 255}});
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
            currentGame.invalidateTimer(this.reviveTimer);
            utils.removeSomethingFromRenderer(this.grave);
            utils.removeSomethingFromRenderer(this.graveShadow);

            this.isDead = false;
            this.currentEnergy = this.maxEnergy/2;
            this.currentHealth = this.maxHealth/2;
            this.position = this.reviveCenter;
            this.isAttackable = true;
            this.canAttack = true;
            this.canMove = true;
        },

        hideGrave: function() {
            if(this.grave) {
                utils.removeSomethingFromRenderer(this.grave);
                utils.removeSomethingFromRenderer(this.graveShadow);
                this.grave = null;
                this.graveShadow = null;
            }
        }
    }
})
