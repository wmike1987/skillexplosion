import * as PIXI from 'pixi.js';

export default {
    style: new PIXI.TextStyle({
        name: 'style',
        dropShadow: true,
        dropShadowAngle: 7.1,
        dropShadowBlur: -12,
        dropShadowDistance: 4,
        fill: [
            "#ff0080",
            "#f10cec",
            "#bf34ed",
            "#fdaaf4",
            "#05e0d6"
        ],
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 70,
        fontStyle: "italic",
        fontVariant: "small-caps",
        lineJoin: "bevel",
        strokeThickness: 2
    }),

    fpsStyle: new PIXI.TextStyle({
        name: 'fpsStyle',
        dropShadowAngle: 7.1,
        dropShadowBlur: -12,
        dropShadowDistance: 4,
        fill: "white",
        fillGradientType: 1,
        fontFamily: "Times New Roman",
        fontSize: 14,
        strokeThickness: 4
    }),

    scoreStyleNonItalic: new PIXI.TextStyle({
        name: 'scoreStyleNonItalic',
        fontFamily: 'Arial',
        fontSize: 16,
        fill: ['#6fcdfa'],
        stroke: '#4a1850',
        strokeThickness: 1,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 1,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 1,
        wordWrap: true,
        wordWrapWidth: 440
    }),

    scoreStyle: new PIXI.TextStyle({
        name: 'scoreStyle',
        fontFamily: 'Arial',
        fontSize: 20,
        fontStyle: 'italic',
        fill: ['#01A8F8'],
        stroke: '#4a1850',
        strokeThickness: 2,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 2,
        wordWrap: true,
        wordWrapWidth: 440
    }),

    verySmallStyleNonItalic: new PIXI.TextStyle({
        name: 'verySmallStyleNonItalic',
        fontFamily: "Helvetica",
        fontSize: 12,
        fill: ['#ffffff'],
        stroke: '#4a1850',
        strokeThickness: 2,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 1,
        dropShadowAngle: 2.3,
        dropShadowDistance: 1.5,
        wordWrap: true,
        wordWrapWidth: 440
    }),

    redScoreStyle: new PIXI.TextStyle({
        name: 'redScoreStyle',
        fontFamily: 'Arial',
        fontSize: 20,
        fontStyle: 'italic',
        fill: ['#ff542d'],
        stroke: '#4a1850',
        strokeThickness: 2,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 2,
        wordWrap: true,
        wordWrapWidth: 440
    }),

    greenScoreStyle: new PIXI.TextStyle({
        name: 'greenScoreStyle',
        fontFamily: 'Arial',
        fontSize: 20,
        fontStyle: 'italic',
        fill: ['#b1ff84'],
        stroke: '#4a1850',
        strokeThickness: 2,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 2,
        wordWrap: true,
        wordWrapWidth: 440
    }),

    newWaveStyle: new PIXI.TextStyle({
        name: 'newWaveStyle',
        dropShadow: true,
        dropShadowAlpha: 0.7,
        dropShadowAngle: 7.1,
        dropShadowColor: "#cf22dd",
        dropShadowDistance: 8,
        fill: [
            "#25a6eb",
            "#83e6eb"
        ],
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 125,
        fontVariant: "small-caps",
        fontWeight: 100,
        letterSpacing: 7,
        lineJoin: "bevel",
        strokeThickness: 8
    }),

    praiseStyle: new PIXI.TextStyle({
        name: 'praiseStyle',
        dropShadow: true,
        dropShadowAlpha: 0.7,
        dropShadowAngle: 7.1,
        dropShadowColor: "#5224db",
        dropShadowDistance: 8,
        fill: [
            "#e81ebf",
            "silver"
        ],
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 125,
        fontStyle: "oblique",
        fontVariant: "small-caps",
        fontWeight: 200,
        strokeThickness: 6
    }),


    //Unit stat panel styles
    unitNameStyle: new PIXI.TextStyle({
        name: 'unitNameStyle',
        fill: "white",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 20,
        strokeThickness: 4,
        textBaseline: "bottom",
    }),

    unitLevelStyle: new PIXI.TextStyle({
        name: 'unitLevelStyle',
        fill: "#d7ab52",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 14,
        strokeThickness: 2,
        textBaseline: "bottom",
    }),

    unitGeneralHPStyle: new PIXI.TextStyle({
        name: 'unitGeneralHPStyle',
        fill: "#adadad",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 14,
        strokeThickness: 2,
        textBaseline: "center",
    }),

    unitGeneralEnergyStyle: new PIXI.TextStyle({
        name: 'unitGeneralEnergyStyle',
        fill: "#dc33ff",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 14,
        strokeThickness: 2,
        textBaseline: "center",
    }),

    unitSkillPointStyle: new PIXI.TextStyle({
        name: 'unitSkillPointStyle',
        fill: "#bd8d30",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 14,
        strokeThickness: 2,
        textBaseline: "center",
    }),

    unitDamageStyle: new PIXI.TextStyle({
        name: 'unitDamageStyle',
        fill: "#DB2323",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 14,
        strokeThickness: 2,
        textBaseline: "center",
    }),

    unitDefenseStyle: new PIXI.TextStyle({
        name: 'unitDefenseStyle',
        fill: "#0CA5D4",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 14,
        strokeThickness: 2,
        textBaseline: "center",
    }),

    unitGritStyle: new PIXI.TextStyle({
        name: 'unitGritStyle',
        fill: "#bea603",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 14,
        strokeThickness: 2,
        textBaseline: "center",
    }),

    unitDodgeStyle: new PIXI.TextStyle({
        name: 'unitDodgeStyle',
        fill: "#017340",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 14,
        strokeThickness: 2,
        textBaseline: "center",
    }),

    unitDamageAdditionsStyle: new PIXI.TextStyle({
        name: 'unitDamageAdditionsStyle',
        fill: "#b12626",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 12,
        strokeThickness: 1,
        textBaseline: "center",
    }),

    unitDefenseAdditionsStyle: new PIXI.TextStyle({
        name: 'unitDefenseAdditionsStyle',
        fill: "#24686f",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 12,
        strokeThickness: 1,
        textBaseline: "center",
    }),

    unitGritAdditionsStyle: new PIXI.TextStyle({
        name: 'unitGritAdditionsStyle',
        fill: "#7d8a1e",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 12,
        strokeThickness: 1,
        textBaseline: "center",
    }),

    unitDodgeAdditionsStyle: new PIXI.TextStyle({
        name: 'unitDodgeAdditionsStyle',
        fill: "#0e7813",
        fillGradientType: 1,
        fontFamily: "Helvetica",
        fontSize: 12,
        strokeThickness: 1,
        textBaseline: "center",
    }),

    abilityTitle: new PIXI.TextStyle({
        name: 'abilityTitle',
        fill: "#ffdd10",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 16,
        strokeThickness: 1
    }),

    regularItemName: new PIXI.TextStyle({
        name: 'regularItemName',
        fill: "#f6f8ff",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        textBaseline: "bottom",
        strokeThickness: 1
    }),

    stimulantItemName: new PIXI.TextStyle({
        name: 'stimulantItemName',
        fill: "#ff54d9",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        textBaseline: "bottom",
        strokeThickness: 1
    }),

    shaneItemName: new PIXI.TextStyle({
        name: 'shaneItemName',
        fill: "#ff5454",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        textBaseline: "bottom",
        strokeThickness: 1
    }),

    ursulaItemName: new PIXI.TextStyle({
        name: 'ursulaItemName',
        fill: "#58ff54",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        textBaseline: "bottom",
        strokeThickness: 1
    }),

    microchipItemName: new PIXI.TextStyle({
        name: 'microchipItemName',
        fill: "#ffbb54",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        textBaseline: "bottom",
        strokeThickness: 1
    }),

    bookItemName: new PIXI.TextStyle({
        name: 'bookItemName',
        fill: "#54d6ff",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        textBaseline: "bottom",
        strokeThickness: 1
    }),

    abilityText: new PIXI.TextStyle({
        name: 'abilityText',
        fill: "#D3D7E8",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        strokeThickness: 1
    }),

    HPTTStyle: new PIXI.TextStyle({
        name: 'HPTTStyle',
        fill: "#FFFFFF",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        strokeThickness: 1
    }),

    EnergyTTStyle: new PIXI.TextStyle({
        name: 'EnergyTTStyle',
        fill: "#E948EF",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        strokeThickness: 1
    }),

    cooldownText: new PIXI.TextStyle({
        name: 'cooldownText',
        fill: "#8b8b8b",
        fillGradientType: 1,
        fontStyle: "italic",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 12,
        strokeThickness: 1
    }),

    passiveDescriptorText: new PIXI.TextStyle({
        name: 'passiveDescriptorText',
        fill: "#969696",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        strokeThickness: 1
    }),

    systemMessageTextWhite: new PIXI.TextStyle({
        name: 'systemMessageTextWhite',
        fill: "#9a9a9a",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 12,
        strokeThickness: 1
    }),

    systemMessageText: new PIXI.TextStyle({
        name: 'systemMessageText',
        fill: "#7DD4FF",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 12,
        strokeThickness: 1
    }),

    systemMessageTextAugment: new PIXI.TextStyle({
        name: 'systemMessageTextAugment',
        fill: "#f4f4f4",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 12,
        strokeThickness: 1
    }),

    levelTextAugment: new PIXI.TextStyle({
        name: 'levelTextAugment',
        dropShadow: true,
        dropShadowAngle: 13.2,
        dropShadowDistance: 2,
        fill: "white",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 18,
        fontVariant: "small-caps",
        lineJoin: "bevel",
        padding: 11,
        stroke: "#cfc9c9"
    }),

    augmentInactiveText: new PIXI.TextStyle({
        name: 'augmentInactiveText',
        fill: "#b0afae",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 12,
        strokeThickness: 1
    }),

    basicPoweredByStyle: new PIXI.TextStyle({
        name: 'basicPoweredByStyle',
        fill: "#d68431",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 12,
        strokeThickness: 1
    }),

    fatigueText: new PIXI.TextStyle({
        name: 'fatigueText',
        fill: "#888888",
        fontSize: 15,
        fontStyle: "italic",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontWeight: "lighter",
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 1
    }),

    fatigueTextLarge: new PIXI.TextStyle({
        name: 'fatigueTextLarge',
        fill: "#888888",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 48,
        fontStyle: "italic",
        fontVariant: "small-caps",
        lineJoin: "bevel",
        strokeThickness: 5,
        padding: 11,
    }),

    adrenalineText: new PIXI.TextStyle({
        name: 'adrenalineText',
        fill: "#d22a7b",
        fontSize: 15,
        fontStyle: "italic",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontWeight: "lighter",
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 1
    }),

    adrenalineTextMedium: new PIXI.TextStyle({
        name: 'adrenalineTextMedium',
        fill: "#fb13f4",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 30,
        fontStyle: "italic",
        fontVariant: "small-caps",
        lineJoin: "bevel",
        strokeThickness: 5,
        padding: 11,
    }),

    adrenalineTextLarge: new PIXI.TextStyle({
        name: 'adrenalineTextLarge',
        fill: "#fb13f4",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 48,
        fontStyle: "italic",
        fontVariant: "small-caps",
        lineJoin: "bevel",
        strokeThickness: 5,
        padding: 11,
    }),

    pageArrowStyle: new PIXI.TextStyle({
        name: 'pageArrowStyle',
        fill: "#ebebeb",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 30,
        fontVariant: "small-caps",
        lineJoin: "bevel",
        strokeThickness: 5,
        padding: 11,
    }),

    pageArrowStyleLarge: new PIXI.TextStyle({
        name: 'pageArrowStyleLarge',
        fill: "#ebebeb",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 50,
        fontVariant: "small-caps",
        lineJoin: "bevel",
        strokeThickness: 5,
        padding: 11,
    }),

    rewardTextMedium: new PIXI.TextStyle({
        name: 'rewardTextMedium',
        fill: "#FFFFFF",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 36,
        fontStyle: "italic",
        fontVariant: "small-caps",
        lineJoin: "bevel",
        strokeThickness: 5,
        padding: 11,
    }),

    rewardTextLarge: new PIXI.TextStyle({
        name: 'rewardTextLarge',
        fill: "#FFFFFF",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 48,
        fontStyle: "italic",
        fontVariant: "small-caps",
        lineJoin: "bevel",
        strokeThickness: 5,
        padding: 11,
    }),

    critHitText: new PIXI.TextStyle({
        name: 'critHitText',
        dropShadowAlpha: 0.6,
        dropShadowAngle: 0,
        dropShadowColor: "#e644ea",
        dropShadowDistance: 2,
        fill: [
            "#ff3e3e",
        ],
        fillGradientStops: [
            0.7
        ],
        fontFamily: "Courier New",
        fontSize: 20,
        fontStyle: "italic",
        lineJoin: "bevel",
        miterLimit: 28,
        strokeThickness: 4,
        wordWrap: true,
        wordWrapWidth: 110
    }),

    dodgeText: new PIXI.TextStyle({
        name: 'dodgeText',
        dropShadowAlpha: 0.6,
        dropShadowAngle: 0,
        dropShadowColor: "#e644ea",
        dropShadowDistance: 2,
        fill: [
            "#00a106",
        ],
        fillGradientStops: [
            0.7
        ],
        fontFamily: "Courier New",
        fontSize: 14,
        fontStyle: "italic",
        lineJoin: "bevel",
        miterLimit: 28,
        strokeThickness: 4,
        wordWrap: true,
        wordWrapWidth: 110
    }),

    dodgeKillingBlowText: new PIXI.TextStyle({
        name: 'dodgeKillingBlowText',
        dropShadowAlpha: 0.6,
        dropShadowAngle: 0,
        dropShadowColor: "#e644ea",
        dropShadowDistance: 2,
        fill: [
            "#ffd557",
        ],
        fillGradientStops: [
            0.7
        ],
        fontFamily: "Courier New",
        fontSize: 14,
        fontStyle: "italic",
        lineJoin: "bevel",
        miterLimit: 28,
        strokeThickness: 4,
        wordWrap: true,
        wordWrapWidth: 110
    }),

    titleOneStyle: new PIXI.TextStyle({
        name: 'titleOneStyle',
        fill: "white",
        fontSize: 43,
        fontStyle: "italic",
        fontWeight: "bold",
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 4
    }),

    titleTwoStyle: new PIXI.TextStyle({
        name: 'titleTwoStyle',
        fill: "white",
        fontSize: 35,
        fontWeight: "bold",
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 4
    }),

    escapeToContinueStyle: new PIXI.TextStyle({
        name: 'escapeToContinueStyle',
        fill: "white",
        fontSize: 43,
        fontStyle: "italic",
        fontWeight: "bold",
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 4
    }),

    statScreenVictoryTitleStyle: new PIXI.TextStyle({
        name: 'statScreenVictoryTitleStyle',
        fill: "#ffffff",
        fontSize: 120,
        fontFamily: "Tahoma, Geneva, sans-serif",
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 2
    }),

    statScreenDefeatTitleStyle: new PIXI.TextStyle({
        name: 'statScreenDefeatTitleStyle',
        fill: "#ffffff",
        fontSize: 120,
        fontFamily: "Tahoma, Geneva, sans-serif",
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 2
    }),

    statTitleStyle: new PIXI.TextStyle({
        name: 'statTitleStyle',
        fill: "red",
        fontSize: 16,
        fontFamily: "Tahoma, Geneva, sans-serif",
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 2
    }),

    statTextStyle: new PIXI.TextStyle({
        name: 'statTextStyle',
        fill: "white",
        fontSize: 16,
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 4
    }),

    statDividerStyle: new PIXI.TextStyle({
        name: 'statDividerStyle',
        fill: 0x252525,
        fontSize: 15,
        lineJoin: "round",
        miterLimit: 0,
        strokeThickness: 4
    }),

    taskDialogue: new PIXI.TextStyle({
        name: 'taskDialogue',
        fill: "#ffffff",
        fontFamily: "\"Lucida Console\", Monaco, monospace",
        fontSize: 18,
        miterLimit: 0
    }),

    infoDialogue: new PIXI.TextStyle({
        name: 'infoDialogue',
        fill: "#9fbe06",
        fontFamily: "\"Lucida Console\", Monaco, monospace",
        fontSize: 18,
        miterLimit: 0
    }),

    dialogueStyle: new PIXI.TextStyle({
        name: 'dialogueStyle',
        fill: "#00b3ff",
        fontFamily: "\"Lucida Console\", Monaco, monospace",
        fontSize: 18,
        miterLimit: 0
    }),

    actionStyle: new PIXI.TextStyle({
        name: 'actionStyle',
        fill: "#00d9ff",
        fontStyle: "italic",
        fontFamily: "\"Lucida Console\", Monaco, monospace",
        fontSize: 18,
        miterLimit: 0
    }),

    dialogueActorStyle: new PIXI.TextStyle({
        name: 'dialogueActorStyle',
        fill: "#ffffff",
        fontFamily: "\"Lucida Console\", Monaco, monospace",
        fontSize: 18,
        miterLimit: 0
    }),

    dialogueTitleStyle: new PIXI.TextStyle({
        name: 'dialogueTitleStyle',
        fill: "#b40000",
        fontFamily: "\"Lucida Console\", Monaco, monospace",
        fontSize: 40,
        miterLimit: 0,
        stroke: "#000000",
        strokeThickness: 4
    }),

    passiveDStyle: new PIXI.TextStyle({
        name: 'passiveDStyle',
        fill: "#8c88f4",
        fontStyle: "italic",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        miterLimit: 0
    }),

    passiveAStyle: new PIXI.TextStyle({
        name: 'passiveAStyle',
        fill: "#cd5c5c",
        fontStyle: "italic",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 14,
        miterLimit: 0
    }),

    passivePStyle: new PIXI.TextStyle({
        name: 'passivePStyle',
        fill: "#169d00",
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontStyle: "italic",
        fontSize: 14,
        miterLimit: 0
    }),

    abilityTextFaded: new PIXI.TextStyle({
        name: 'abilityTextFaded',
        fill: "#c3c3c3",
        fontStyle: "italic",
        fillGradientType: 1,
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 13,
        strokeThickness: 1
    }),

    passiveMultiTextStyle: {
        textStyle: {
            st: {
                fill: "#c3c3c3",
                fontStyle: "italic",
                fontFamily: "Tahoma, Geneva, sans-serif",
                fontSize: 13,
                padding: 5
            },
            highlight: {
                fill: "#d182ed",
                fontStyle: "italic",
                fontFamily: "Tahoma, Geneva, sans-serif",
                fontSize: 13,
                padding: 5
            }
        },
        taggedTextOptions: {
            drawWhitespace: true
        }
    }
}
