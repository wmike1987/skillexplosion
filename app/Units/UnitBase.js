define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'mixins/_Attacker', 'units/IsoSpriteManager',
'utils/GameUtils', 'utils/CommandQueue', 'utils/Command'],

    function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Iso, utils, CommandQueue, Command) {

        //default unit attributes
        var UnitBase = {
            isUnit: true,
            isoManaged: true,
            maxHealth: 20,
            currentHealth: 20,
            maxEnergy: 0,
            currentEnergy: 0,
            isSelectable: true,
            isAttackable: true,
            team: 4,
            eventMappings: {},
            sufferAttack: function(damage) {
                this.currentHealth -= damage;
                if (this.currentHealth <= 0) {
                    this.death();
                }
                Matter.Events.trigger(this, 'sufferedAttack', damage);
            },

            initUnit: function() {

                this.commandQueue = CommandQueue();

                this.handleEvent = function(event) {
                    if(this.eventMappings[event.id]) {
                        var newCommand = Command({
                            queue: this.commandQueue,
                            method: this.eventMappings[event.id],
                            context: this,
                            target: event.target
                        })
                        if(keyStates['Shift']) {
                            this.commandQueue.enqueue(newCommand);
                        }
                        else {
                            this.commandQueue.clear();
                            this.commandQueue.enqueue(newCommand);
                        }
                    }
                },

                Matter.Events.on(this, 'addUnit', function() {

                    //start unit as idling upon add
                    if (this.isoManaged)
                        this.isoManager.idle();

                    //establish the height of the unit
                    if (this.heightAnimation)
                        this.unitHeight = this.renderlings[this.heightAnimation].height;
                    else
                        this.unitHeight = this.body.circleRadius * 2;

                    //create health bar
                    var backgroundScaleX = 1.8;
                    var barScaleXMultiplier = .96;
                    var healthBorderScale = .16;
                    var healthBarScale = .08;
                    if (this.health && this.isAttackable) {
                        this.renderChildren.push({
                            id: 'healthbarbackground',
                            data: 'HealthEnergyBackground',
                            scale: {
                                x: backgroundScaleX,
                                y: healthBorderScale
                            },
                            offset: {
                                x: -32 * backgroundScaleX / 2,
                                y: -this.unitHeight / 2 - 13
                            },
                            anchor: {
                                x: 0,
                                y: .5
                            },
                            stage: 'foreground',
                            rotate: 'none',
                            tint: 0x000000,
                            avoidIsoMgr: true,
                            visible: false,
                        }, {
                            id: 'healthbar',
                            data: 'HealthEnergyBackground',
                            scale: {
                                x: backgroundScaleX * barScaleXMultiplier,
                                y: healthBarScale
                            },
                            offset: {
                                x: -32 * backgroundScaleX / 2 + 32 * backgroundScaleX * (1 - barScaleXMultiplier) / 2,
                                y: -this.unitHeight / 2 - 13
                            },
                            anchor: {
                                x: 0,
                                y: .5
                            },
                            stage: 'foreground',
                            rotate: 'none',
                            avoidIsoMgr: true,
                            tint: 0x00FF00,
                            visible: false
                        });

                        var updateHealthTick = currentGame.addTickCallback(function() {
                            var percentage = this.currentHealth / this.maxHealth;
                            if (this.renderlings['healthbar']) {
                                this.renderlings['healthbar'].scale = {
                                    x: backgroundScaleX * barScaleXMultiplier * percentage,
                                    y: healthBarScale
                                };
                                this.renderlings['healthbar'].tint = utils.rgbToHex(percentage >= .5 ? ((1-percentage) * 2 * 255) : 255, percentage <= .5 ? (percentage * 2 * 255) : 255, 0);
                            }
                        }.bind(this))

                        currentGame.deathPact(this, updateHealthTick);

                    }
                }.bind(this));


                //create energy bar
                if (this.energy) {

                }
            }
        }

        return UnitBase;
    }
)
