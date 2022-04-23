import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';

/*
 * options:
 *  damage
 *  speed
 *  tracking
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
        trackTarget: false,
        collisionFunction: function(otherUnit) {
            return otherUnit != this.owningUnit && otherUnit && otherUnit.isTargetable && otherUnit.team != this.owningUnit.team;
        },
        impactRemoveFunction: function() {
            globals.currentGame.removeBody(this.body);
        },
        impactFunction: function(target) {
            var attackInfo = target.sufferAttack(this.damage, this.owningUnit, {
                isProjectile: true,
                projectileData: {
                    startLocation: this.startLocation,
                    location: mathArrayUtils.clonePosition(this.body.position)
                }
            });
            if (this.impactExtension) {
                this.impactExtension(target, {attackInfo: attackInfo});
            }
        }.bind(this)
    }, options);

    var startPosition = mathArrayUtils.clonePosition(this.owningUnit.position);
    if (this.originOffset) {
        startPosition = mathArrayUtils.addScalarToVectorTowardDestination(startPosition, this.destination || this.target.position, this.originOffset);
    }
    this.startLocation = startPosition;
    this.body = Matter.Bodies.circle(startPosition.x, startPosition.y, 4, {
        frictionAir: 0,
        mass: options.mass || 5,
        isSensor: true
    });

    //setup position wrapper
    var positionWrapper = {
        position: this.destination || mathArrayUtils.clonePosition(this.target.position),
        originalPosition: startPosition
    };
    if (this.tracking) {
        positionWrapper.position = this.target.position;
    }

    var originalDistance = Matter.Vector.magnitude(Matter.Vector.sub(positionWrapper.position, startPosition));
    this.send = function() {
        var trackingTimer = gameUtils.sendBodyToDestinationAtSpeed(this.body, positionWrapper, this.speed, true, true, null, this.tracking);
        var impactTick = globals.currentGame.addTickCallback(function() {
            //hijack this tick to also update the position wrapper in case the target's position attribute changes
            if (this.tracking) {
                positionWrapper.position = this.target.position;
            }

            //off stage detector
            if (gameUtils.bodyRanOffStage(this.body)) {
                globals.currentGame.removeBody(this.body);
            }

            //impact detector (if 'always')
            if (this.impactType == 'always' && mathArrayUtils.distanceBetweenPoints(this.body.position, startPosition) >= originalDistance) {
                if (this.impactRemoveFunction) {
                    this.impactRemoveFunction();
                }
                this.impactFunction(this.target);
            }

        }.bind(this));

        //if we're tracking and the unit dies, use the death position
        var trackingTargetDeathHandler = null;
        if (this.tracking) {
            trackingTargetDeathHandler = gameUtils.matterOnce(this.target, 'death', function(event) {
                trackingTimer.invalidate();
            });
        }
        gameUtils.deathPact(this.body, impactTick);
        gameUtils.deathPact(this.body, function() {
            Matter.Events.trigger(this, 'remove');
            if(trackingTargetDeathHandler) {
                trackingTargetDeathHandler.removeHandler();
            }
        }.bind(this));

        if (trackingTimer) {
            gameUtils.deathPact(this.body, trackingTimer);
        }

        if (this.impactType == 'collision') {
            Matter.Events.on(this.body, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == this.body ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit;
                if (otherUnit != null) {
                    if (this.collisionFunction(otherUnit)) {
                        this.impactRemoveFunction();
                        this.impactFunction(otherUnit);
                    }
                }
            }.bind(this));
        }
    };

    this.body.renderChildren = [{
        id: 'projectile',
        data: this.displayObject,
        rotateFunction: function(sprite) {
            if(this.tracking) {
                sprite.rotation = mathArrayUtils.pointInDirection(this.body.position, positionWrapper.position);
            } else {
                sprite.rotation = mathArrayUtils.pointInDirection(positionWrapper.originalPosition, positionWrapper.position);
            }
        }.bind(this),
    }, {
        id: 'shadow',
        data: this.displayObject.creationTextureName || 'IsoShadowBlurred',
        scale: this.displayObject.creationTextureName ? {x: 1.0, y: 1.0} : {x: 0.5, y: 1.0},
        offset: {x: 15, y: 20},
        tint: 0x000000,
        alpha: 0.35,
        rotateFunction: function(sprite) {
            if(this.tracking) {
                sprite.rotation = mathArrayUtils.pointInDirection(this.body.position, positionWrapper.position);
            } else {
                sprite.rotation = mathArrayUtils.pointInDirection(positionWrapper.originalPosition, positionWrapper.position);
            }
        }.bind(this),
        stage: "stageNTwo",
    }];

    globals.currentGame.addBody(this.body);
    Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {
        entity: this.body
    });

    if (this.autoSend) {
        this.send();
    }

    this.cleanUp = function() {
        globals.currentGame.removeBody(this.body);
    };
}
