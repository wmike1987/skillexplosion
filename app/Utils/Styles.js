import * as PIXI from 'pixi.js'

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

	unitHealthStyle: new PIXI.TextStyle({
		name: 'unitHealthStyle',
		fill: "#2EA003",
		fillGradientType: 1,
		fontFamily: "Helvetica",
		fontSize: 18,
		strokeThickness: 2,
	}),

	unitEnergyStyle: new PIXI.TextStyle({
		name: 'unitEnergyStyle',
		fill: "#9F33FF",
		fillGradientType: 1,
		fontFamily: "Helvetica",
		fontSize: 16,
		strokeThickness: 2,
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

	unitGeneralStyle: new PIXI.TextStyle({
		name: 'unitGeneralStyle',
		fill: "#adadad",
		fillGradientType: 1,
		fontFamily: "Helvetica",
		fontSize: 14,
		strokeThickness: 2,
		textBaseline: "bottom",
	}),

	unitGeneralEnergyStyle: new PIXI.TextStyle({
		name: 'unitGeneralEnergyStyle',
		fill: "#dc33ff",
		fillGradientType: 1,
		fontFamily: "Helvetica",
		fontSize: 14,
		strokeThickness: 2,
		textBaseline: "bottom",
	}),

	unitSkillPointStyle: new PIXI.TextStyle({
		name: 'unitSkillPointStyle',
		fill: "#bd8d30",
		fillGradientType: 1,
		fontFamily: "Helvetica",
		fontSize: 14,
		strokeThickness: 2,
		textBaseline: "bottom",
	}),

	unitDamageStyle: new PIXI.TextStyle({
		name: 'unitDamageStyle',
		fill: "#DB2323",
		fillGradientType: 1,
		fontFamily: "Helvetica",
		fontSize: 14,
		strokeThickness: 2,
		textBaseline: "bottom",
	}),

	unitDefenseStyle: new PIXI.TextStyle({
		name: 'unitDefenseStyle',
		fill: "#0CA5D4",
		fillGradientType: 1,
		fontFamily: "Helvetica",
		fontSize: 14,
		strokeThickness: 2,
		textBaseline: "bottom",
	}),

	unitDefenseAdditionsStyle: new PIXI.TextStyle({
		name: 'unitDefenseAdditionsStyle',
		fill: "#b4c629",
		fillGradientType: 1,
		fontFamily: "Helvetica",
		fontSize: 12,
		strokeThickness: 2,
		textBaseline: "bottom",
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
		fill: "#D3D7E8",
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

	systemMessageText: new PIXI.TextStyle({
		name: 'systemMessageText',
		fill: "#7DD4FF",
		fillGradientType: 1,
		fontFamily: "Tahoma, Geneva, sans-serif",
		fontSize: 12,
		strokeThickness: 1
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

	dialogueStyle: new PIXI.TextStyle({
		name: 'dialogueStyle',
	    fill: "#00b3ff",
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
		miterLimit: 0
	}),

	passiveDStyle: new PIXI.TextStyle({
		name: 'passiveDStyle',
		fill: "#8c88f4",
		fontFamily: "Tahoma, Geneva, sans-serif",
		fontSize: 15,
		miterLimit: 0
	}),

	passiveAStyle: new PIXI.TextStyle({
		name: 'passiveAStyle',
		fill: "#cd5c5c",
		fontFamily: "Tahoma, Geneva, sans-serif",
		fontSize: 15,
		miterLimit: 0
	}),
}
