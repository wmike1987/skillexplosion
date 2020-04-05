define(function() {

	return {
		style: new PIXI.TextStyle({
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

		unitNameStyle: new PIXI.TextStyle({
			fill: "white",
			fillGradientType: 1,
			fontFamily: "Helvetica",
			fontSize: 20,
			strokeThickness: 4
		}),

		unitHealthStyle: new PIXI.TextStyle({
			fill: "#2EA003",
			fillGradientType: 1,
			fontFamily: "Helvetica",
			fontSize: 18,
			strokeThickness: 2
		}),

		unitLevelStyle: new PIXI.TextStyle({
			fill: "#D59E31",
			fillGradientType: 1,
			fontFamily: "Helvetica",
			fontSize: 14,
		}),

		unitDamageStyle: new PIXI.TextStyle({
			fill: "#DB2323",
			fillGradientType: 1,
			fontFamily: "Helvetica",
			fontSize: 14,
			strokeThickness: 2
		}),

		unitDefenseStyle: new PIXI.TextStyle({
			fill: "#0CA5D4",
			fillGradientType: 1,
			fontFamily: "Helvetica",
			fontSize: 14,
			strokeThickness: 2
		}),

		unitEnergyStyle: new PIXI.TextStyle({
			fill: "#9F33FF",
			fillGradientType: 1,
			fontFamily: "Helvetica",
			fontSize: 16,
			strokeThickness: 2
		}),

		abilityTitle: new PIXI.TextStyle({
			fill: "#ffdd10",
    		fontFamily: "Tahoma, Geneva, sans-serif",
			fontSize: 16,
			strokeThickness: 1
		}),

		regularItemName: new PIXI.TextStyle({
			fill: "#D3D7E8",
			fontFamily: "Tahoma, Geneva, sans-serif",
			fontSize: 16,
			strokeThickness: 1
		}),

		abilityText: new PIXI.TextStyle({
			fill: "#D3D7E8",
			fillGradientType: 1,
    		fontFamily: "Tahoma, Geneva, sans-serif",
			fontSize: 14,
			strokeThickness: 1
		}),

		HPTTStyle: new PIXI.TextStyle({
			fill: "#FFFFFF",
			fillGradientType: 1,
			fontFamily: "Tahoma, Geneva, sans-serif",
			fontSize: 14,
			strokeThickness: 1
		}),

		EnergyTTStyle: new PIXI.TextStyle({
			fill: "#E948EF",
			fillGradientType: 1,
			fontFamily: "Tahoma, Geneva, sans-serif",
			fontSize: 14,
			strokeThickness: 1
		}),

		systemMessageText: new PIXI.TextStyle({
			fill: "#7DD4FF",
			fillGradientType: 1,
			fontFamily: "Tahoma, Geneva, sans-serif",
			fontSize: 12,
			strokeThickness: 1
		}),

		critHitText: new PIXI.TextStyle({
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
	}
})
