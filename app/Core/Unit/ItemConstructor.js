define(['jquery', 'utils/GameUtils', 'core/Tooltip', 'matter-js', 'utils/Styles', 'pixi', 'unitcore/ItemUtils'],
    function($, utils, Tooltip, Matter, styles, PIXI, ItemUtils) {

    var baseItem = {
        equip: function(unit) {
            $.each(this.manipulations, function(key, value) {
                if(key == 'events') {
                    $.each(value, function(k, v) {
                        this.eventFunctions[k] = function() {
                            $.each(v, function(kk, vv) {
                                if(kk == 'callback') {
                                    vv(unit);
                                } else {
                                    unit[kk] += vv;
                                }
                            })
                        }
                        Matter.Events.on(unit, k, this.eventFunctions[k]);
                    }.bind(this))
                } else {
                    unit[key] += value;
                }
            }.bind(this))
        },
        unequip: function(unit) {
            $.each(this.manipulations, function(key, value) {
                if(key == "events") {
                    $.each(value, function(k, v) {
                        Matter.Events.off(unit, k, this.eventFunctions[k]);
                    }.bind(this))
                } else {
                    unit[key] -= value;
                }
            }.bind(this))
        },
        name: 'generic item name',
        description: 'generic item description',
        icon: 'TintableSquare',
        type: 'common',
        worksWithSlot: function(slot) {
            if(slot.type == 'universal')
                return true;
            if(slot.type == this.type)
                return true;
            return false;
        }
    }

    var itemDrop = utils.getSound('itemdrop.wav', {volume: .04, rate: .75});

    return function(options) {
        var newItem = $.extend({}, baseItem, options);
        newItem.isItem = true;
        newItem.id = utils.uuidv4();
        newItem.eventFunctions = {};

        //create icon
        newItem.icon = utils.createDisplayObject(newItem.icon); //note that this icon will not die upon removing the item
        var ctrlClickToDropMessage = '(Click to grab item)';
        newItem.icon.interactive = true;
        Tooltip.makeTooltippable(newItem.icon, {title: newItem.name, description: newItem.description, systemMessage: ctrlClickToDropMessage});

        //mouse hover event
        newItem.hoverListener = currentGame.addTickCallback(function() {

            //reset everything assuming we're not hovering anymore, or if we're the grabbed item
            newItem.icon.tint = 0xFFFFFF;
            if(!newItem.icon.visible || currentGame.itemSystem.grabbedItem == newItem) return;
            if(newItem.isEmpty) {
                newItem.icon.alpha = 0;
            }

            //if we are hovering, do something
            if(newItem.icon.containsPoint(currentGame.renderer.interaction.mouse.global)) {
                newItem.icon.tint = 0x669900;
                if(newItem.isEmpty) {
                    newItem.icon.alpha = .2;
                    newItem.icon.tint = 0xFFFFFF;
                    return;
                }
            }
        })

        //drop item
        newItem.icon.on('mousedown', function(event) {
            if(currentGame.itemSystem.isGrabbing() || newItem.isEmpty) return;

            newItem.owningUnit.unequipItem(newItem);
            Matter.Events.trigger(currentGame.itemSystem, "usergrab", {item: newItem})
            newItem.mouseInside = false;
            utils.setCursorStyle('server:MainCursor.png');
        }.bind(this))

        //create name display (shown upon alt or hover)
        var baseTint = 0x00042D;
        newItem.nameDisplayBase = utils.createDisplayObject('TintableSquare', {tint: baseTint, scale: {x: 1, y: 1}, alpha: .85});
        newItem.nameDisplay = utils.createDisplayObject('TEXT:' + newItem.name, {style: styles.regularItemName})
        utils.makeSpriteSize(newItem.nameDisplayBase, {w: newItem.nameDisplay.width + 15, h: 25});

        newItem.showName = function(bool) {
            if(!this.body) return; //if we've been collected, don't display the name
            if(!newItem.nameDisplay.parent) {
                utils.addDisplayObjectToRenderer(newItem.nameDisplay, 'hudText');
                utils.addDisplayObjectToRenderer(newItem.nameDisplayBase, 'hud')
            }

            newItem.nameDisplayBase.visible = bool;
            newItem.nameDisplay.visible = bool;

            if(bool) {
                newItem.nameDisplayBase.position = {x: newItem.body.position.x, y: newItem.body.position.y - 30};
                newItem.nameDisplay.position = {x: newItem.body.position.x, y: newItem.body.position.y - 30};
            }
        }

        newItem.removePhysicalForm = function() {
            this.showName(false);
            currentGame.removeBody(this.body);
            this.body = null;
        },

        newItem.pickup = function() {
            this.removePhysicalForm();
        },

        newItem.drop = function(position, options) {
            if(!options) options = {};
            options = $.extend({}, {fleeting: true}, options)

            //create item body
            this.body = Matter.Bodies.circle(position.x, position.y, 20, {
                isSensor: true
            });

            var item = this;

            //play animation
            this.itemDrop = utils.getAnimationB({
                spritesheetName: 'ItemAnimations1',
                animationName: 'ItemDrop',
                speed: 1.2,
                playThisManyTimes: 1,
                transform: [position.x, position.y],
                onComplete: function() {
                    utils.removeSomethingFromRenderer(this);
                    currentGame.addBody(item.body);
                    Matter.Events.trigger(currentGame.itemSystem, 'dropItem', {item: item});
                    item.isDropping = false;
                    item.currentSlot = null;
                    if(options.fleeting)
                        ItemUtils.initiateBlinkDeath({item: item});
                }
            });

            itemDrop.play();
            item.isDropping = true;

            utils.makeSpriteSize(this.itemDrop, {w: 60, h: 60});
            this.itemDrop.alpha = .65;
            this.itemDrop.play();
            utils.addSomethingToRenderer(this.itemDrop, 'stage');

            //Make renderlings accessible from wherever
            Object.defineProperty(newItem.body, 'renderlings', {
                get: function() {
                    return newItem.renderlings;
                },
                set: function(v) {
                    newItem.renderlings = v;
                }
            });
            Object.defineProperty(newItem.body, 'renderChildren', {
                get: function() {
                    return newItem.renderChildren;
                }
            });

            newItem.renderChildren = [{
                id: 'itemFootprint',
                data: 'GlassMarble',
                scale: {
                    x: .4,
                    y: .4
                },
                rotate: 'none',
                visible: true,
            },
            {
                id: 'shadow',
                data: 'IsoShadowBlurred',
                scale: {x: .6, y: .6},
                visible: true,
                rotate: 'none',
                stage: "stageNTwo",
                offset: {x: 0, y: 10}
            }];

            newItem.body.item = newItem;
        },

        newItem.destroy = function() {
            this.icon.tooltipObj.destroy();
            utils.removeSomethingFromRenderer(this.nameDisplayBase);
            utils.removeSomethingFromRenderer(this.nameDisplay);
            if(newItem.body) {
                currentGame.removeBody(newItem.body);
            }
            currentGame.removeTickCallback(newItem.hoverListener);
            if(this.itemDrop)
                utils.removeSomethingFromRenderer(this.itemDrop);
        },

        currentGame.addItem(newItem);
        return newItem;
    }
})
