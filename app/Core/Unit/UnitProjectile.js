define(['jquery', 'utils/GameUtils', 'matter-js',], function($, utils, Matter) {

    /*
     * options:
     *  damage
     *  speed
     *  trackTarget
     *  impactRemoveFunction
     *  impactType {always, collision}
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
            impactType: 'always',
            impactRemoveFunction: function() {
                currentGame.removeBody(this.body)
            },
            impactFunction: function(target) {
                target.sufferAttack(this.damage, this.owningUnit);
                if(this.impactExtension) {
                    this.impactExtension(target);
                }
            }.bind(this)
        }, options);

        var startPosition = utils.clonePosition(this.owningUnit.position);
        if(this.originOffset) {
            startPosition = utils.addScalarToVectorTowardDestination(startPosition, this.target.position, this.originOffset)
        }
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
              if(utils.bodyRanOffStage(this.body)) {
                  currentGame.removeBody(this.body);
              }

              if(this.impactType == 'always' && utils.distanceBetweenPoints(this.body.position, startPosition) >= originalDistance) {
                  if(this.impactRemoveFunction) {
                      this.impactRemoveFunction();
                  }
                  this.impactFunction(this.target);
              }

            }.bind(this))
            utils.deathPact(this.body, impactTick);

            if(this.impactType == 'collision') {
                Matter.Events.on(this.body, 'onCollide', function(pair) {
                    var otherBody = pair.pair.bodyB == this.body ? pair.pair.bodyA : pair.pair.bodyB;
                    var otherUnit = otherBody.unit;
                    if(otherUnit != this.owningUnit && otherUnit && otherUnit.isTargetable && otherUnit.team != this.owningUnit.team) {
                        this.impactRemoveFunction();
                        this.impactFunction(otherUnit);
                    }
                }.bind(this))
            }
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
