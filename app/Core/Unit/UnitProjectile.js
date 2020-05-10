define(['jquery', 'utils/GameUtils', 'matter-js',], function($, utils, Matter) {

    /*
     * options:
     *  damage
     *  speed
     *  track
     *  impactRemoveFunction
     *  impactFunction
     *  target
     *  owningUnit
     *  displayObject
     *  destination
     *  autoSend
     */
    return function(options) {
        $.extend(this, {
            autoSend: false,
            impactRemoveFunction: function(target) {
                currentGame.removeBody(this.body)
            },
            impactFunction: function(target) {
                target.sufferAttack(this.damage, this.owningUnit);
            }.bind(this)
        }, options);

        var startPosition = utils.clonePosition(this.owningUnit.position);
        this.body = Matter.Bodies.circle(startPosition.x, startPosition.y, 4, {
                      frictionAir: 0,
                      mass: options.mass || 5,
                      isSensor: true
                    });

        var targetPosition = this.destination || utils.clonePosition(this.target.position);
        var originalDistance = Matter.Vector.magnitude(Matter.Vector.sub(targetPosition, startPosition));
        this.send = function() {
            utils.sendBodyToDestinationAtSpeed(this.body, targetPosition, this.speed);
            var impactTick = currentGame.addTickCallback(function() {
              if(utils.bodyRanOffStage(this.body) || utils.distanceBetweenPoints(this.body.position, startPosition) >= originalDistance) {
                  currentGame.removeBody(this.body);
                  this.impactRemoveFunction(this.target);
                  this.impactFunction(this.target);
              }
            }.bind(this))
            utils.deathPact(this.body, impactTick);
        }

        this.body.renderChildren = [{
            id: 'projectile',
            data: this.displayObject,
            rotate: utils.pointInDirection(startPosition, targetPosition)
        }]

        currentGame.addBody(this.body);

        if(this.autoSend) {
            this.send();
        }

    }
})
