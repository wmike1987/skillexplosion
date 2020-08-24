define(['jquery', 'pixi', 'unitcore/UnitConstructor', 'matter-js', 'utils/GameUtils', 'unitcore/UnitAbility',
 'utils/styles', 'unitcore/_Augmentable', 'shaders/ValueShader'],
    function($, PIXI, UC, Matter, utils, Ability, styles, aug, valueShader) {

    return function Eruptlet(options) {
        var eruptlet = {};

        var options = options || {};
        $.extend(options, {radius: 25}, options)

        //animation settings
        var runSpeed = .9;
        var runSpeedBonus = .25;
        var shootSpeed = 1;

        var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['critterN'].spineData);
        var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['critterS'].spineData);
        var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['critterW'].spineData);
        var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['critterW'].spineData);
        var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['critterSW'].spineData);
        var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['critterSW'].spineData);
        var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['critterNW'].spineData);
        var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['critterNW'].spineData);

        var runAnimations = {
            up: utils.getSpineAnimation({
                spine: spineNorth,
                animationName: 'run',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            upRight: utils.getSpineAnimation({
                spine: spineNorthEast,
                animationName: 'run',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            right: utils.getSpineAnimation({
                spine: spineEast,
                animationName: 'run',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            downRight: utils.getSpineAnimation({
                spine: spineSouthEast,
                animationName: 'run',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            down: utils.getSpineAnimation({
                spine: spineSouth,
                animationName: 'run',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            downLeft: utils.getSpineAnimation({
                spine: spineSouthWest,
                animationName: 'run',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            left: utils.getSpineAnimation({
                spine: spineWest,
                animationName: 'run',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            upLeft: utils.getSpineAnimation({
                spine: spineNorthWest,
                animationName: 'run',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
        };

                var attackAnimations = {
                    up: utils.getSpineAnimation({
                        spine: spineNorth,
                        animationName: 'attack',
                        speed: 2,
                        times: 3,
                    }),
                    upRight: utils.getSpineAnimation({
                        spine: spineNorthEast,
                        animationName: 'attack',
                        speed: 2,
                        times: 3,
                    }),
                    right: utils.getSpineAnimation({
                        spine: spineEast,
                        animationName: 'attack',
                        speed: 2,
                        times: 3,
                    }),
                    downRight: utils.getSpineAnimation({
                        spine: spineSouthEast,
                        animationName: 'attack',
                        speed: 2,
                        times: 3,
                    }),
                    down: utils.getSpineAnimation({
                        spine: spineSouth,
                        animationName: 'attack',
                        speed: 2,
                        times: 3,
                    }),
                    downLeft: utils.getSpineAnimation({
                        spine: spineSouthWest,
                        animationName: 'attack',
                        speed: 2,
                        times: 3,
                    }),
                    left: utils.getSpineAnimation({
                        spine: spineWest,
                        animationName: 'attack',
                        speed: 2,
                        times: 3,
                    }),
                    upLeft: utils.getSpineAnimation({
                        spine: spineNorthWest,
                        animationName: 'attack',
                        speed: 2,
                        times: 3,
                    }),
                }

        var otherAnimations = {

        }

        var sc = {x: .1, y: .1};
        var adjustedUpDownsc = {x: .1, y: .1};
        var flipsc = {x: -1 * sc.x, y: sc.y};
        var yOffset = 22;
        var vShader = new PIXI.Filter(null, valueShader, {
            colors: [0.4, 0.4, 2.0]
        });
        var rc = [
        {
            id: 'selected',
            data: 'IsometricSelected',
            scale: {x: .8, y: .8},
            stage: 'stageNOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {x: 0, y: 22},
        },
        {
            id: 'selectionPending',
            data: 'IsometricSelectedPending',
            scale: {x: 1, y: 1},
            stage: 'stageNOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {x: 0, y: 22},
        },{
            id: 'left',
            data: spineWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset},
        },{
            id: 'right',
            data: spineEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'up',
            data: spineNorth,
            scale: adjustedUpDownsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'down',
            data: spineSouth,
            scale: adjustedUpDownsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'upLeft',
            data: spineNorthWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'upRight',
            data: spineNorthEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'downRight',
            data: spineSouthEast,
            scale: flipsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        }, {
            id: 'downLeft',
            data: spineSouthWest,
            scale: sc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },{
            id: 'shadow',
            data: 'IsoShadowBlurred',
            scale: {x: .75, y: .75},
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: {x: 0, y: 22}}];

        var attackSound = utils.getSound('critterhit.wav', {volume: .15, rate: 1});

        var unitProperties = $.extend({
            unitType: 'Eruptlet',
            health: 20,
            defense: 1,
            energy: 0,
            energyRegenerationRate: 0,
            experienceWorth: 20,
            portrait: utils.createDisplayObject('CritterPortrait'),
            wireframe: utils.createDisplayObject('CritterPortrait'),
            team: options.team || 4,
            priority: 50,
            name: options.name,
            heightAnimation: 'up',
            idleSpecificAnimation: true,
            abilities: [],
            death: function() {
                var self = this;
                var anim = utils.getAnimationB({
                    spritesheetName: 'BaseUnitAnimations1',
                    animationName: 'bloodsplat',
                    speed: .3,
                    transform: [self.position.x, self.position.y, .3, .3]
                });
                utils.addSomethingToRenderer(anim);
                anim.play();
                currentGame.removeUnit(this);
            },
            _afterAddInit: function() {
                $.each(this.body.renderlings, function(key, renderling) {
                    if(renderling.skeleton) {
                        $.each(renderling.skeleton.slots, function(i, slot) {
                            if(slot.currentSprite) {
                                if(slot.currentSpriteName.includes('1---4') ||
                                  (slot.currentSpriteName.includes('1---1') && !slot.currentSpriteName.includes('1---11') && slot.currentSpriteName.charAt(slot.currentSpriteName.length-1) == '1') ||
                                  (slot.currentSpriteName.includes('1---2') && !slot.currentSpriteName.includes('1---20')) ||
                                  slot.currentSpriteName.includes('1---3') ||
                                  slot.currentSpriteName.includes('NorthWest_0003_Layer-1---5') ||
                                  slot.currentSpriteName.includes('North_0003_Layer-1---5'))
                                {
                                    slot.color.r = .2;
                                    slot.color.g = 1.0;
                                    slot.color.b = 0.2;
                                    slot.color.a = 1.0;
                                }
                            }
                        })
                    }
                });
            },
        }, options)

        return UC({
                givenUnitObj: eruptlet,
                renderChildren: rc,
                radius: options.radius,
                hitboxWidth: 40,
                hitboxHeight: 40,
                hitboxYOffset: 5,
                mass: options.mass || 8,
                mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
                slaves: [attackSound, unitProperties.portrait, unitProperties.wireframe],
                unit: unitProperties,
                moveable: {
                    moveSpeed: 3.00,
                    walkAnimations: runAnimations,
                }, attacker: {
                    attackAnimations: attackAnimations,
                    cooldown: 650,
                    honeRange: 300,
                    range: options.radius*2+10,
                    damage: 6,
                    attackExtension: function(target) {
                        var bloodAnimation = utils.getAnimationB({
                            spritesheetName: 'UtilityAnimations1',
                            animationName: 'GenericHit',
                            speed: 1.0,
                            transform: [target.position.x + Math.random()*8, target.position.y + Math.random()*8, .25, .25]
                        });
                        utils.addSomethingToRenderer(bloodAnimation, 'foreground');
                        bloodAnimation.play();
                        attackSound.play();
                    },
                },
        });
    }
})
