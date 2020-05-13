define(['jquery', 'pixi', 'unitcore/UnitConstructor', 'matter-js', 'utils/GameUtils', 'unitcore/UnitAbility', 'utils/styles', 'unitcore/_Augmentable'],
    function($, PIXI, UC, Matter, utils, Ability, styles, aug) {

    return function Critter(options) {
        var critter = {};

        var options = options || {};
        $.extend(options, {radius: 25}, options)

        //animation settings
        var runSpeed = .9;
        var runSpeedBonus = .25;
        var shootSpeed = 1;

        var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienN'].spineData);
        var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienS'].spineData);
        var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienW'].spineData);
        var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienW'].spineData);
        var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienSW'].spineData);
        var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienSW'].spineData);
        var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienNW'].spineData);
        var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienNW'].spineData);

        var runAnimations = {
            up: utils.getSpineAnimation({
                spine: spineNorth,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            upRight: utils.getSpineAnimation({
                spine: spineNorthEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            right: utils.getSpineAnimation({
                spine: spineEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            downRight: utils.getSpineAnimation({
                spine: spineSouthEast,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            down: utils.getSpineAnimation({
                spine: spineSouth,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            downLeft: utils.getSpineAnimation({
                spine: spineSouthWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            left: utils.getSpineAnimation({
                spine: spineWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
            upLeft: utils.getSpineAnimation({
                spine: spineNorthWest,
                animationName: 'walk',
                speed: 1.5,
                loop: true,
                canInterruptSelf: false
            }),
        };

        var attackAnimations = {
            up: utils.getSpineAnimation({
                spine: spineNorth,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            upRight: utils.getSpineAnimation({
                spine: spineNorthEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            right: utils.getSpineAnimation({
                spine: spineEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            downRight: utils.getSpineAnimation({
                spine: spineSouthEast,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            down: utils.getSpineAnimation({
                spine: spineSouth,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            downLeft: utils.getSpineAnimation({
                spine: spineSouthWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            left: utils.getSpineAnimation({
                spine: spineWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
            upLeft: utils.getSpineAnimation({
                spine: spineNorthWest,
                animationName: 'shoot',
                speed: 2,
                times: 3,
            }),
        }

        var otherAnimations = {

        }

        var sc = {x: .33, y: .33};
        var adjustedUpsc = {x: .36, y: .36};
        var flipsc = {x: -1 * sc.x, y: sc.y};
        var yOffset = 22;
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
            scale: adjustedUpsc,
            rotate: 'none',
            visible: false,
            offset: {x: 0, y: yOffset}
        },
        {
            id: 'down',
            data: spineSouth,
            scale: sc,
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

        var fireSound = utils.getSound('critterhit.wav', {volume: .05, rate: 1.5});

        var unitProperties = $.extend({
            unitType: 'Critter',
            health: 20,
            defense: 1,
            energy: 0,
            energyRegenerationRate: 1,
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
            }}, options);

        return UC({
                givenUnitObj: critter,
                renderChildren: rc,
                radius: options.radius,
                hitboxWidth: 35,
                hitboxHeight: 35,
                hitboxYOffset: 8,
                mass: options.mass || 8,
                mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
                slaves: [fireSound, unitProperties.portrait, unitProperties.wireframe],
                unit: unitProperties,
                moveable: {
                    moveSpeed: 3.00,
                    walkAnimations: runAnimations,
                }, attacker: {
                    attackAnimations: attackAnimations,
                    cooldown: 650,
                    honeRange: 300,
                    range: 220,
                    damage: 6,
                    attackExtension: function(target) {
                        fireSound.play();
                    },
                },
        });
    }
})
