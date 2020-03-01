define(['jquery', 'utils/GameUtils', 'matter-js', 'unitcore/ItemUtils'], function($, utils, Matter, ItemUtils) {

    var highlightTint = 0xa6ff29;
    var itemPickup = utils.getSound('itempickup.wav', {volume: .04, rate: 1});
    var itemDrop = utils.getSound('itempickup.wav', {volume: .04, rate: .8});
    var cantpickup = utils.getSound('cantpickup.wav', {volume: .01, rate: 1.3});

    //This module manages all things item-related
    var itemSystem = function(properties) {

        //Share given properties
        $.extend(this, properties);

        this.unitSystem = currentGame.unitSystem;
        this.itemsOnGround = []; //represents items on the ground
        this.items = new Set();
        this.targetedItem = null;

        this.initialize = function(options) {

            //Mouse hover tint
            var pastHoveredBodies = [];
            this.hoverCallback = currentGame.addTickCallback(function(event) {

                //collect all item bodies and reset their tints
                var itemBodies = $.map(this.itemsOnGround, function(item) {
                    if(item.body.renderlings['itemFootprint'].originalTint) {
                        item.renderlings['itemFootprint'].tint = item.renderlings['itemFootprint'].originalTint;
                        item.renderlings['itemFootprint'].originalTint = null;
                        item.showName(false);
                    }
                    return item.body;
                })

                if(itemBodies && itemBodies.length > 0) {
                    var itemBodiesUnderMouse = Matter.Query.point(itemBodies, currentGame.mousePosition);
                    $.each(itemBodiesUnderMouse, function(i, body) {
                        body.renderlings['itemFootprint'].originalTint = body.renderlings['itemFootprint'].tint;
                        body.renderlings['itemFootprint'].tint = highlightTint;
                        body.item.showName(true);
                    })
                }

            }.bind(this));

            //toggle item name-banner with 'alt'
            $('body').on('keydown.itemSystem', function( event ) {
                 if(event.key == 'Alt') {
                     $.each(this.itemsOnGround, function(i, item) {
                         item.showName(true);
                     })
                 }
            }.bind(this));

            $('body').on('keyup.itemSystem', function( event ) {
                 if(event.key == 'Alt') {
                     $.each(this.itemsOnGround, function(i, item) {
                         item.showName(false);
                     })
                 }
            }.bind(this));

            Matter.Events.on(this, 'dropItem', function(event) {
                this.addItemOnGround(event.item);
            }.bind(this))

            //Annoint units with functionality to detect and pickup an item
            Matter.Events.on(currentGame, 'addUnit', function(event) {
                if(!event.unit.isMoveable) return;

                Matter.Events.on(event.unit, 'unitMove', function(moveEvent) {
                    if(!event.unit.attackMoving && this.unitSystem.selectedUnit == event.unit) {
                        var itemBodies = $.map(this.itemsOnGround, function(item) {
                            return item.body;
                        })

                        var itemBodiesUnderMouse = Matter.Query.point(itemBodies, moveEvent.destination);
                        event.unit.targetedItem = null;
                        $.each(itemBodiesUnderMouse, function(i, body) {
                            event.unit.targetedItem = body.item;
                        }.bind(this))
                    }
                }.bind(this))

                Matter.Events.on(event.unit.body, 'onCollideActive', function(pair) {
                    var otherBody = pair.pair.bodyB == event.unit ? pair.pair.bodyA : pair.pair.bodyB;
                    if(event.unit.targetedItem && otherBody == event.unit.targetedItem.body) {
                        if(event.unit.canPickupItem(event.unit.targetedItem)) {
                            itemPickup.play();
                            event.unit.pickupItem(event.unit.targetedItem);
                            Matter.Events.trigger(this, 'pickupItem', {item: event.unit.targetedItem, unit: event.unit});
                            this.removeItemFromGround(event.unit.targetedItem);
                        } else {
                            cantpickup.play();
                        }
                        event.unit.targetedItem = null;
                    }
                }.bind(this))
            }.bind(this))
        },

        this.addItemOnGround = function(item) {
            this.itemsOnGround.push(item);
            ItemUtils.initiateBlinkDeath({item: item});
            itemDrop.play();
        },

        this.registerItem = function(item) {
            this.items.add(item);
        },

        this.removeItemFromGround = function(item) {
            var index = this.itemsOnGround.indexOf(item);
            if(index > -1) {
                item.removePhysicalForm();
                this.itemsOnGround.splice(index, 1);
            }
        },

        this.removeItem = function(item) {
            this.removeItemFromGround(item);
            this.items.delete(item);
            // console.info(this.items.size)
            item.destroy();
        }

        this.cleanUp = function() {

            Matter.Events.off(this);

            this.itemsOnGround = [];
            for (let item of this.items) {
                item.destroy();
            }

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
