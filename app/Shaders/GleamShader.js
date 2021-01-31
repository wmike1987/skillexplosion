export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float progress;
    uniform vec2 screenSize;
    uniform float leanAmount;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);
        if(fg.a < .3) {
            gl_FragColor = fg;
            return;
        }
        vec4 gleamColor = vec4(fg.r*3.5, fg.g*3.5, fg.b*3.5, 1.0);
        float gleamWidth = 35.0;
        float yPercent = (gl_FragCoord.y*2.0/screenSize.y) - 1.0;
        float xOffset = leanAmount * yPercent;
        float xLocation = gl_FragCoord.x - xOffset;

        bool inGleam = false;
        float startingPixel = progress * screenSize.x + leanAmount;
        if(xLocation >= startingPixel && xLocation-gleamWidth < startingPixel) {
            inGleam = true;
        }

        if(inGleam) {
            gl_FragColor = gleamColor;
        } else {
            gl_FragColor = fg;
        }
    }`
