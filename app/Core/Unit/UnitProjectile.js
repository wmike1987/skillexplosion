import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {globals} from '@core/Fundamental/GlobalState.js'

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
export default function(options) {
    $.extend(this, {
        autoSend: false,
        impactType: 'always',
        collisionFunction: function(otherUnit) {
            return otherUnit != this.owningUnit && otherUnit && otherUnit.isTargetable && otherUnit.team != this.owningUnit.team
        },
        impactRemoveFunction: function() {
            globals.currentGame.removeBody(this.body)
        },
        impactFunction: function(target) {
            target.sufferAttack(this.damage, this.owningUnit, {isProjectile: true});
            if(this.impactExtension) {
                this.impactExtension(target);
            }
        }.bind(this)
    }, options);

    var startPosition = mathArrayUtils.clonePosition(this.owningUnit.position);
    if(this.originOffset) {
        startPosition = mathArrayUtils.addScalarToVectorTowardDestination(startPosition, this.target.position, this.originOffset)
    }
    this.body = Matter.Bodies.circle(startPosition.x, startPosition.y, 4, {
                  frictionAir: 0,
                  mass: options.mass || 5,
                  isSensor: true
                });

    var targetPosition = this.destination || mathArrayUtils.clonePosition(this.target.position);
    var originalDistance = Matter.Vector.magnitude(Matter.Vector.sub(targetPosition, startPosition));
    this.send = function() {
        gameUtils.sendBodyToDestinationAtSpeed(this.body, targetPosition, this.speed);
        var impactTick = globals.currentGame.addTickCallback(function() {
          if(gameUtils.bodyRanOffStage(this.body)) {
              globals.currentGame.removeBody(this.body);
          }

          if(this.impactType == 'always' && mathArrayUtils.distanceBetweenPoints(this.body.position, startPosition) >= originalDistance) {
              if(this.impactRemoveFunction) {
                  this.impactRemoveFunction();
              }
              this.impactFunction(this.target);
          }

        }.bind(this))
        gameUtils.deathPact(this.body, impactTick);

        if(this.impactType == 'collision') {
            Matter.Events.on(this.body, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == this.body ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit;
                if(otherUnit != null) {
                    if(this.collisionFunction(otherUnit)) {
                        this.impactRemoveFunction();
                        this.impactFunction(otherUnit);
                    }
                }
            }.bind(this))
        }
    }

    this.body.renderChildren = [{
        id: 'projectile',
        data: this.displayObject,
        rotate: mathArrayUtils.pointInDirection(startPosition, targetPosition)
    }]

    globals.currentGame.addBody(this.body);
    Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {entity: this.body})

    if(this.autoSend) {
        this.send();
    }

}
