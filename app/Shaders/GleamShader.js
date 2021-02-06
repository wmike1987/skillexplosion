export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float progress;
    uniform vec2 spriteSize;
    uniform vec2 spritePosition;
    uniform float leanAmount;
    uniform float gleamWidth;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);
        if(fg.a < .3) {
            gl_FragColor = fg;
            return;
        }

        float top = 1.02;
        float lightProgress = 1.0 + progress*(top-1.0); //1-1.5
        if(lightProgress >= ((top-1.0)/2.0 + 1.0)) {
            lightProgress = ((top-1.0)/2.0 + 1.0)*2.0 - lightProgress;
        }
        float lightMagnifier = pow(lightProgress, 200.0);

        vec4 gleamColor = vec4(fg.r*lightMagnifier, fg.g*lightMagnifier, fg.b*lightMagnifier, 1.0);
        float gleamWidth = gleamWidth;

        float relativeXFragCoord = gl_FragCoord.x - (spritePosition.x-spriteSize.x/2.0);
        float relativeYFragCoord = gl_FragCoord.y - (spritePosition.y-spriteSize.y/2.0);

        float yPercent = (relativeYFragCoord*2.0/spriteSize.y) - 1.0;
        float xOffset = leanAmount * yPercent;
        float xLocation = relativeXFragCoord - xOffset;

        //account for lean amount and gleamWidth so the gleam can start offscreen on the left and continue off screen to the right
        float startingPixel = progress * (spriteSize.x + leanAmount*2.0 + gleamWidth*2.0) - leanAmount - gleamWidth;

        bool inGleam = false;
        if(xLocation >= startingPixel && xLocation-gleamWidth < startingPixel) {
            inGleam = true;
        }

        if(inGleam) {
            gl_FragColor = gleamColor;
        } else {
            gl_FragColor = fg;
        }
    }`
