export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float progress;
    uniform vec4 inputPixel;
    uniform vec2 screenSize;
    uniform bool leftToRight;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);
        vec2 myCoord = vTextureCoord * inputPixel.xy;
        float blurThreshold = 50.0;
        bool pixelVisible = false;

        if(!leftToRight) {
            myCoord.x = abs(myCoord.x - screenSize.x);
        }

        float edgeOfCurtainX = progress * (screenSize.x + blurThreshold);
        if(myCoord.x <= edgeOfCurtainX) {
            pixelVisible = true;
        }

        float calculatedAlpha = 0.0;

        //blur edge of curtain
        if(myCoord.x >= edgeOfCurtainX - blurThreshold) {
            calculatedAlpha = (myCoord.x - (edgeOfCurtainX - blurThreshold)) / blurThreshold;
        }

        if(pixelVisible) {
            fg.r = fg.r * calculatedAlpha;
            fg.g = fg.g * calculatedAlpha;
            fg.b = fg.b * calculatedAlpha;
            fg.a = calculatedAlpha;
        }

        gl_FragColor = fg;
    }`
