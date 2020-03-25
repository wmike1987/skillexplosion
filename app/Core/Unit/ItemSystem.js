define(['jquery', 'utils/GameUtils', 'matter-js', 'unitcore/ItemUtils'], function($, utils, Matter, ItemUtils) {

    var highlightTint = 0xa6ff29;
    var cantpickup = utils.getSound('cantpickup.wav', {volume: .02, rate: 1.3});

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


            Matter.Events.on(this, "usergrab", function(event) {
                var item = event.item;
                item.icon.visible = true;
                item.icon.tooltipObj.disabled = true;
                item.icon.sortYOffset = 1000;
                item.grabCallback = currentGame.addTickCallback(function() {
                    item.icon.position = {x: currentGame.mousePosition.x - 10, y: currentGame.mousePosition.y - 10};
                })
                this.grabbedItem = item;

            }.bind(this))

            this.grabDropListener = currentGame.addListener('mousedown', function(event) {
                if(!this.grabbedItem || event.which != 1 || keyStates['Control']) return;
                var item = this.grabbedItem;
                if(utils.isPositionWithinPlayableBounds(currentGame.mousePosition)) {
                    var variationX = Math.random()*60;
                    var variationY = Math.random()*60;
                    item.drop(Matter.Vector.add(item.owningUnit.position, {x: 35-variationX, y: 35-variationY}));
                    currentGame.removeTickCallback(item.grabCallback);
                    item.icon.visible = false;
                    item.icon.alpha = 1;
                    item.icon.tooltipObj.disabled = false;
                    this.grabbedItem = null;
                } else {
                    var mouseOverSlottedItem = false;
                    var prevailingUnit = currentGame.unitSystem.selectedUnit;
                    var allItems = prevailingUnit.currentItems.concat(prevailingUnit.currentBackpack).concat(prevailingUnit.currentSpecialtyItems);
                    item.icon.alpha = 1;
                    item.icon.tooltipObj.disabled = false;
                    this.grabbedItem = null;
                    var found = false;
                    $.each(allItems, function(i, loopItem) {
                        currentGame.removeTickCallback(item.grabCallback);
                        if(loopItem && loopItem != item) {
                            if(loopItem.icon.containsPoint(currentGame.renderer.interaction.mouse.global)) {
                                prevailingUnit.unequipItem(loopItem);
                                Matter.Events.trigger(this, 'usergrab', {item: loopItem})
                                prevailingUnit.pickupItem(item, loopItem.currentSpot);
                                loopItem.currentSpot = null;
                                found = true;
                            }
                        }
                    }.bind(this))
                    if(!found) {
                        if(!prevailingUnit.pickupItem(item, item.currentSpot)) {
                            var variationX = Math.random()*60;
                            var variationY = Math.random()*60;
                            item.drop(Matter.Vector.add(item.owningUnit.position, {x: 35-variationX, y: 35-variationY}));
                            currentGame.removeTickCallback(item.grabCallback);
                            item.icon.visible = false;
                            item.icon.alpha = 1;
                            item.icon.tooltipObj.disabled = false;
                            this.grabbedItem = null;
                        }
                    }
                }
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
                        if(event.unit.findItemSpot(event.unit.targetedItem)) {
                            event.unit.pickupItem(event.unit.targetedItem);
                            this.pickupItem(event.unit.targetedItem);
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
            item.owningUnit = null;
        },

        this.registerItem = function(item) {
            this.items.add(item);
        },

        this.pickupItem = function(item) {
            item.pickup();
            this.removeItemFromGround(item);
        }

        this.isGrabbing = function() {
            return this.grabbedItem;
        }

        this.removeItemFromGround = function(item) {
            var index = this.itemsOnGround.indexOf(item);
            if(index > -1) {
                this.itemsOnGround.splice(index, 1);
            }
        },

        this.removeItem = function(item) {
            this.removeItemFromGround(item);
            this.items.delete(item);
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

            if(this.grabDropListener) {
                currentGame.removeListener(this.grabDropListener);
            }

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
