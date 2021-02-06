export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float progress;
    uniform vec2 spriteSize;
    uniform vec2 spritePosition;
    uniform float leanAmount;
    uniform float gleamWidth;
    uniform bool alphaIncluded;
    uniform bool artificialBoost;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);
        if(!alphaIncluded && fg.a < .3) {
            gl_FragColor = fg;
            return;
        }

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

        //top is never actually reached
        float top = 1.01;
        float lightProgress = 1.0 + progress*(top-1.0); //1-top
        if(lightProgress >= ((top-1.0)/2.0 + 1.0)) {
            lightProgress = ((top-1.0)/2.0 + 1.0)*2.0 - lightProgress;
        }

        float expTop = 60.0;
        float expProgress = 1.0 + progress*(expTop-1.0); //1-expTop;
        if(expProgress >= ((expTop-1.0)/2.0 + 1.0)) {
            expProgress = ((expTop-1.0)/2.0 + 1.0)*2.0 - expProgress;
        }
        float lightMagnifier = pow(lightProgress, expProgress * expProgress);

        float alpha = 1.0;
        if(alphaIncluded && progress < 1.0 && inGleam && fg.a < .3) {
            float alphaTop = 2.0;
            float alphaFix;
            alphaFix = 1.0 + progress*(alphaTop-1.0); //1-alphaTop
            if(alphaFix >= ((alphaTop-1.0)/2.0 + 1.0)) {
                alphaFix = ((alphaTop-1.0)/2.0 + 1.0)*2.0 - alphaFix;
            }
            fg.r = alphaFix*.1;
            fg.g = alphaFix*.1;
            fg.b = alphaFix*.1;
            alpha = alphaFix - 1.5;
        }

        if(artificialBoost && inGleam && fg.r < .5 && fg.g < .1 && fg.b < .1) {
            float boostAmount = .2;
            fg.r = boostAmount;
            fg.g = boostAmount;
            fg.b = boostAmount;
        }

        vec4 gleamColor = vec4(fg.r*lightMagnifier, fg.g*lightMagnifier, fg.b*lightMagnifier, alpha);

        if(inGleam) {
            gl_FragColor = gleamColor;
        } else {
            gl_FragColor = fg;
        }
    }`
