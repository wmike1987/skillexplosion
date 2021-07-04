export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float progress;
    uniform vec4 inputPixel;
    uniform vec2 centerPoint;
    uniform vec2 screenSize;
    uniform float gridSize;
    uniform bool fadeOut;
    uniform float a;
    uniform float b;
    uniform float c;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(a, b))) * c)*.8 + .2;
    }

    void main()
    {
        vec2 myCoord = vTextureCoord * inputPixel.xy;

        float gridLocX = floor(myCoord.x/(gridSize));
        float gridLocY = floor(myCoord.y/(gridSize));
        vec2 loc = vec2(gridLocX, gridLocY);
        vec4 fg = texture2D(uSampler, vTextureCoord);

        float xDiff = abs(myCoord.x - centerPoint.x);
        float yDiff = abs(myCoord.y - centerPoint.y);
        float alteredXDiff = floor(xDiff/(gridSize));
        float alteredYDiff = floor(yDiff/(gridSize));
        xDiff = alteredXDiff;
        yDiff = alteredYDiff;

        float screenSizeHyp = sqrt(screenSize.x*screenSize.x + screenSize.y*screenSize.y)/gridSize;

        float inOrOut = 1.0;
        float addBuffer = 0.0;
        if(fadeOut) {
          addBuffer = 0.2;
        }

        float hypMultiplier = 1.0;
        if(fadeOut) {
            hypMultiplier = 0.6;
        }

        float r = (sqrt(xDiff*xDiff + yDiff*yDiff)/((screenSizeHyp)*hypMultiplier) + addBuffer);

        if(!fadeOut) {
          r = 1.0 - r;
        }

        //soften the edge of the fade circle
        float softening = .1;
        if(r >= progress) {
            float ratio = 1.0 - min(1.0, ((r-progress)/softening));
            fg = vec4(fg.r*ratio, fg.g*ratio, fg.b*ratio, ratio);
        }

        gl_FragColor = fg;
    }`
