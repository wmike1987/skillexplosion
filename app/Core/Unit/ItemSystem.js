define(['jquery', 'utils/GameUtils', 'matter-js'], function($, utils, Matter) {

    var highlightTint = 0xa6ff29;
    var itemPickup = utils.getSound('itempickup.wav', {volume: .05, rate: 1});

    //This module manages all things item-related
    var itemSystem = function(properties) {

        //Share given properties
        $.extend(this, properties);

        this.unitSystem = currentGame.unitSystem;
        this.items = [];
        this.targetedItem = null;

        this.initialize = function(options) {

            //Mouse hover tint
            var pastHoveredBodies = [];
            this.hoverCallback = currentGame.addTickCallback(function(event) {

                //collect all item bodies and reset their tints
                var itemBodies = $.map(this.items, function(item) {
                    if(item.body.renderlings['itemFootprint'].originalTint) {
                        item.renderlings['itemFootprint'].tint = item.renderlings['itemFootprint'].originalTint;
                        item.renderlings['itemFootprint'].originalTint = null;
                    }
                    return item.body;
                })

                if(itemBodies && itemBodies.length > 0) {
                    var itemBodiesUnderMouse = Matter.Query.point(itemBodies, currentGame.mousePosition);
                    $.each(itemBodiesUnderMouse, function(i, body) {
                        body.renderlings['itemFootprint'].originalTint = body.renderlings['itemFootprint'].tint;
                        body.renderlings['itemFootprint'].tint = highlightTint;
                    })
                }

            }.bind(this));

            //Add listener to a unit's move event to detect a move-to-an-item command, aka a move whose destination is on an item
            Matter.Events.on(this.unitSystem, 'prevailingUnitChange', function(event) {
                if(!event.unit) return;
                if(!event.unit.itemPickupEnabled) {
                    Matter.Events.on(event.unit, 'unitMove', function(moveEvent) {
                        if(!event.unit.attackMoving && this.unitSystem.selectedUnit == event.unit) {
                            var itemBodies = $.map(this.items, function(item) {
                                return item.body;
                            })

                            var itemBodiesUnderMouse = Matter.Query.point(itemBodies, moveEvent.destination);
                            event.unit.targetedItem = null;
                            $.each(itemBodiesUnderMouse, function(i, body) {
                                event.unit.targetedItem = body.item;
                            }.bind(this))

                            Matter.Events.on(event.unit.body, 'onCollideActive', function(pair) {
                                var otherBody = pair.pair.bodyB == event.unit ? pair.pair.bodyA : pair.pair.bodyB;
                                if(event.unit.targetedItem && otherBody == event.unit.targetedItem.body) {
                                    if(event.unit.canPickupItem(event.unit.targetedItem)) {
                                        itemPickup.play();
                                        event.unit.pickupItem(event.unit.targetedItem);
                                        Matter.Events.trigger(this, 'pickupItem', {item: event.unit.targetedItem, unit: event.unit});
                                        event.unit.targetedItem = null;
                                    }
                                }
                            }.bind(this))
                        }
                    }.bind(this))
                }
                event.unit.itemPickupEnabled = true;
            }.bind(this));
        },

        this.addItem = function(item) {
            this.items.push(item);
        },

        this.removeItem = function(item) {
            var index = this.items.indexOf(item);
            if(index > -1) {
                this.items.splice(index, 1);
            }
        },

        this.cleanUp = function() {

            Matter.Events.off(this);

            this.items = [];

            if(this.hoverCallback)
                currentGame.removeTickCallback(this.hoverCallback);

            if(this.pickupTick)
                currentGame.removeTickCallback(this.pickupTick);

            //clear jquery events
            $('body').off('mousedown.itemSystem');
            $('body').off('mousemove.itemSystem');
            $('body').off('mouseup.itemSystem');
            $('body').off('keydown.itemSystem');
            $('body').off('keyup.itemSystem');
            $('body').off('keypress.itemSystem');
        }
    }

    return itemSystem;
})
